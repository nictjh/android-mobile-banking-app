import { useState, useEffect } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase' // You'll need to set this up

import { NativeModules } from 'react-native';
import NotificationService from '../lib/services/NotificationService';

import { useDevice } from '../context/DeviceContext';

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { deviceId } = useDevice();
  console.log("📱 Device ID in Login component:", deviceId);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // User is already logged in, initialize Firebase messaging
        console.log('👤 User already logged in, initializing Firebase...')
        await NotificationService.init()
        router.replace('/home')
      }
    } catch (error) {
      console.error('❌ Auth check error:', error)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)

    try {

        const { user, session, error } = await signIn(email, password, deviceId)
        // const {data, error} = await supabase.auth.signInWithPassword({
        //     email,
        //     password
        // })
        if (error) {
            Alert.alert('Login Error', error.message)
        } else {
            await NotificationService.init() // Initialize Firebase messaging after login
            router.replace('/home')
        }

    } catch (error) {
      Alert.alert('Unexpected Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

    // Re write the signIn function with device binding
    async function signIn(email, password, deviceId) {

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { error };
        }

        // Defensive checks
        if (!deviceId) {
            return { error: { message: 'Device ID not available' } };
        }
        if (!data?.user || !data?.session) {
            return { error: { message: 'User/session not found' } };
        }

        // Bind device
        const { data: deviceData, error: deviceError } = await supabase.from('auth_devices').insert({
            user_id: data.user.id,
            device_id: deviceId,
            refresh_token: data.session.refresh_token
        });

        if (deviceError) {
            return { error: deviceError };
        }

        return { data: deviceData, user: data.user, session: data.session };
    }



  const showToast = () => {
    NativeModules.MyToastModule.showToast('Hello from native!');
  };

  return (
    <View style={styles.container}>
      <Button title="Show Native Toast" onPress={showToast} />
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Button 
            title="Login" 
            onPress={handleLogin} 
            disabled={loading}
          />
          <View style={{ marginTop: 10 }} />
          <Button 
            title="Go to Signup" 
            onPress={() => router.push('/signup')} 
            disabled={loading}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
})