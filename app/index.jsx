import { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase' // You'll need to set this up

import { NativeModules } from 'react-native';
import { safeAsyncStorage } from '../lib/customStorAdapter.jsx';


export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      // Log the session size for debugging
      console.log('Supabase session size: ', getObjectSizeMB(data?.session), 'MB');
      // Inducing a large session to test storage limits
      const storageKey = 'supabase.auth.token';
      let bigSession;

      if (data?.session) {
        const bigToken = "a".repeat(3 * 1024 * 1024); // 3MB token string
        // const bigToken = "a".repeat(1 * 1024 * 1024); // 1MB token string
        bigSession = {
          ...data.session,
          access_token: bigToken,
          // refresh_token: bigToken, // This is length 12 if I want to check
        };
      } else {
        throw new Error('No session returned');
      }

      const value = JSON.stringify({
        currentSession: bigSession,
        expiresAt: bigSession.expires_at,
      });

      console.log('Induced session store size: ', getObjectSizeMB(value), 'MB');

      try {
        await safeAsyncStorage.setItem(key, value);
      } catch (err) {
        Alert.alert(
          'Session Too Large',
          'Your session data is too large to be stored securely. You will be logged out. Please log in again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await supabase.auth.signOut();
              }
            }
          ]
        );
        return;
      }


      if (error) {
        Alert.alert('Login Error', error.message)
      } else {
        // Login successful, navigate to home or protected route
        router.replace('/home')
      }
    } catch (error) {
      Alert.alert('Unexpected Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const showToast = () => {
    NativeModules.MyToastModule.showToast('Hello from native!');
  };

  function getObjectSizeMB(obj) {
    const jsonString = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(jsonString).length;
    const mb = bytes / (1024 * 1024); // convert bytes to MB
    return mb;
  }

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