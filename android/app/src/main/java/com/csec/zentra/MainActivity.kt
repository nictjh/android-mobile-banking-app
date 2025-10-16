package com.csec.zentra

import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import android.util.Log

import androidx.appcompat.app.AlertDialog

import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class MainActivity : ReactActivity() {

    private val DANGEROUS_RISKS = setOf(
        "UNKNOWN_CAPTURING",
        "UNKNOWN_CONTROLLING",
        "UNKNOWN_OVERLAYS"
    )

  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)

    // Only request Play Integrity token in release builds from Play Store
    if (BuildConfig.BUILD_TYPE == "release" && !BuildConfig.DEBUG) {
      requestIntegrityToken()
    } else {
      Log.d("Integrity", "Skipping Play Integrity check in debug/sideload build")
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }


  private fun requestIntegrityToken() {
    val integrityManager = IntegrityManagerFactory.create(this)

    // you can put a random nonce here if you want extra binding
    val nonce = java.util.UUID.randomUUID().toString()
    val request = IntegrityTokenRequest.builder()
      .setNonce(nonce)
      .build()

    integrityManager.requestIntegrityToken(request)
      .addOnSuccessListener { response ->
        val token = response.token()
        Log.d("Integrity", "Token received: ${token.take(30)}...")

        // send the token to supabase edge function for verification
        sendTokenToBackend(token)
      }
      .addOnFailureListener { e ->
        Log.e("Integrity", "Integrity request failed: ${e.message}", e)

        runOnUiThread {
          when {
            e.message?.contains("INTEGRITY_NO_ERROR") == true -> {
              Toast.makeText(this, "Device integrity check passed", Toast.LENGTH_SHORT).show()
            }
            e.message?.contains("PLAY_SERVICES_NOT_AVAILABLE") == true -> {
              Toast.makeText(this, "Play Services not available", Toast.LENGTH_SHORT).show()
            }
            else -> {
              Log.w("Integrity", "Play Integrity not available (likely sideloaded/debug build)")
            }
          }
        }
      }
  }

    private fun sendTokenToBackend(token: String) {
        val client = OkHttpClient()
        val mediaType = "application/json; charset=utf-8".toMediaType()
        val body = """{"integrityToken":"$token"}""".toRequestBody(mediaType)
        val req = Request.Builder()
            .url("https://vomohccmapvpspaupbah.supabase.co/functions/v1/play-integrity-decode")
            .post(body)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer ${BuildConfig.SUPABASE_ANON_KEY}")
            .build()

        client.newCall(req).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
            runOnUiThread {
                Toast.makeText(this@MainActivity, "Backend call failed: ${e.message}", Toast.LENGTH_LONG).show()
            }
            Log.e("Integrity", "Backend call failed", e)
            }

            override fun onResponse(call: Call, response: Response) {
                val bodyStr = response.body?.string() ?: "{}"
                Log.i("IntegrityFullJSON", "Full decoded JSON:\n$bodyStr")

                val verdictJson = try { JSONObject(bodyStr) } catch (_: Exception) { null }

                runOnUiThread {
                    // Check for dangerous access risks
                    if (verdictJson != null && hasDangerousAccessRisk(verdictJson)) {
                        showRiskDialog()
                        return@runOnUiThread
                    }
                    // Show success message when no dangerous risks detected
                    Toast.makeText(this@MainActivity, "Everything OK - App integrity verified", Toast.LENGTH_SHORT).show()
                }
            }
        })
    }


    // Collect all string values recursively inside appAccessRiskVerdict
    private fun collectStrings(node: Any?, out: MutableSet<String>) {
        when (node) {
            is JSONObject -> node.keys().forEach { k -> collectStrings(node.opt(k), out) }
            is JSONArray -> for (i in 0 until node.length()) collectStrings(node.opt(i), out)
            is String -> if (node.isNotBlank()) out.add(node)
        }
    }

    private fun hasDangerousAccessRisk(verdict: JSONObject): Boolean {
        val tpe = verdict.optJSONObject("tokenPayloadExternal") ?: return false
        val env = tpe.optJSONObject("environmentDetails") ?: return false
        val risk = env.optJSONObject("appAccessRiskVerdict") ?: return false

        val allStrings = mutableSetOf<String>()
        collectStrings(risk, allStrings)
        return allStrings.any { it in DANGEROUS_RISKS }
    }

    private fun showRiskDialog() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Security Warning")
        builder.setMessage(
            "We detected apps that may capture, overlay, or control your screen.\n\n" +
            "For your security, please close those apps before continuing."
        )
        builder.setCancelable(false)
        builder.setPositiveButton("Close App") { _, _ ->
            finishAndRemoveTask()
        }
        builder.show()
    }



}
