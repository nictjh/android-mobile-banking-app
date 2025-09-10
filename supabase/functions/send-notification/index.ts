// supabase/functions/send-notification/index.ts
// Updated for Firebase Cloud Messaging API (V1)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// JWT implementation for service account authentication
async function createJWT(serviceAccount: any) {
  const now = Math.floor(Date.now() / 1000)
  
  // JWT Header
  const header = {
    alg: "RS256",
    typ: "JWT"
  }
  
  // JWT Payload
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600, // 1 hour
    iat: now
  }
  
  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  // Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`

  function pemToBinary(pem: string): ArrayBuffer {
    const b64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "")
      .trim()
    const raw = atob(b64)
    const buf = new ArrayBuffer(raw.length)
    const view = new Uint8Array(buf)
    for (let i = 0; i < raw.length; i++) {
      view[i] = raw.charCodeAt(i)
    }
    return buf
  }

  
  // Import the private key
  const keyData = pemToBinary(serviceAccount.private_key)
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  )

  
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signatureInput)
  )
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  return `${signatureInput}.${encodedSignature}`
}

// Get OAuth2 access token
async function getAccessToken() {
  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not set')
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Create JWT
    const jwt = await createJWT(serviceAccount)
    
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })
    
    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`)
    }
    
    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    throw error
  }
}

serve(async (req) => {
  console.log("Request = ", req)
  console.log('🚀 send-notification function called (FCM API V1)')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const requestData = await req.json()
    const transactionData = requestData.record || requestData

    const {
      transaction_id,
      account_id,
      amount,
      currency,
      description,
      booking_datetime,
      transaction_type,
      credit_debit
    } = transactionData

    // Only process Credit transactions
    if (credit_debit !== 'Credit') {
      console.log(`🔍 Transaction type is ${credit_debit}, not Credit`)
      console.log('⏭️ Skipping non-Credit transaction')
      return new Response(
        JSON.stringify({ success: true, message: 'Not a credit transaction, skipping' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`💰 Processing credit transaction for account ${account_id}`)

    // Get FCM tokens for the receiving account
    const { data: devices, error: deviceError } = await supabaseClient
      .from('user_devices')
      .select('fcm_token, user_id')
      .eq('account_id', account_id)
      .eq('is_active', true)

    console.log(`🔍 Fetching devices for account ${account_id}`)
    console.log('Devices query result:', devices)

    if (deviceError) {
      console.log(`❌ Error fetching devices for account ${account_id}:`, deviceError)
      throw new Error(`Error fetching devices: ${deviceError.message}`)
    }

    if (!devices || devices.length === 0) {
      console.log('📱 No active devices found for this account')
      return new Response(
        JSON.stringify({ success: false, message: 'No active devices found for this account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📱 Found ${devices.length} device(s) for account ${account_id}`)

    // Get access token for FCM API V1
    const accessToken = await getAccessToken()
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}')
    const projectId = serviceAccount.project_id

    // Extract sender account from description
    const fromAccountMatch = description.match(/Transfer from (\w+)/)
    const fromAccount = fromAccountMatch ? fromAccountMatch[1] : 'Unknown'

    const notificationTitle = 'Money Received! 💰'
    const notificationBody = `You received $${amount} ${currency} from account ${fromAccount}`

    console.log(`📤 Sending notification: ${notificationTitle}`)

    // Send notification to each device using FCM API V1
    const notificationPromises = devices.map(async (device) => {
      // FCM API V1 payload format
      const fcmPayload = {
        message: {
          token: device.fcm_token,
          notification: {
            title: notificationTitle,
            body: notificationBody,
          },
          data: {
            transaction_id: transaction_id || '',
            account_id: account_id || '',
            amount: amount?.toString() || '',
            currency: currency || '',
            from_account: fromAccount,
            transaction_type: transaction_type || '',
            timestamp: booking_datetime || ''
          },
          android: {
            notification: {
              icon: 'ic_notification',
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
              channel_id: 'default'
            }
          }
        }
      }

      try {
        // Send to FCM API V1
        const fcmResponse = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fcmPayload),
          }
        )

        const fcmResult = await fcmResponse.json()
        console.log('📤 FCM V1 Result:', fcmResult)

        const isSuccess = fcmResponse.ok && fcmResult.name
        const errorMessage = fcmResult.error?.message || null

        // Log the notification
        await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: device.user_id,
            account_id: account_id,
            transaction_id: transaction_id,
            notification_type: 'money_received',
            title: notificationTitle,
            body: notificationBody,
            fcm_message_id: isSuccess ? fcmResult.name : null,
            status: isSuccess ? 'sent' : 'failed',
            error_message: errorMessage
          })

        return {
          token: device.fcm_token.substring(0, 20) + '...',
          success: isSuccess,
          error: errorMessage,
          fcm_response: fcmResult
        }
      } catch (error) {
        console.error('❌ Error sending to device:', error)
        return {
          token: device.fcm_token.substring(0, 20) + '...',
          success: false,
          error: error.message
        }
      }
    })

    const results = await Promise.all(notificationPromises)
    const successCount = results.filter(r => r.success).length

    console.log(`✅ Notifications sent: ${successCount}/${results.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications processed: ${successCount}/${results.length} sent successfully`,
        results: results,
        using_api: 'FCM_API_V1'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        using_api: 'FCM_API_V1'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})