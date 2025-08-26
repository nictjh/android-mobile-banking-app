import { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase' // You'll need to set this up

import { NativeModules } from 'react-native';

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

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

  return (
    <View style={styles.container}>
      <Button title="Show Native Toast" onPress={showToast} />
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        contextMenuHidden={true}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        contextMenuHidden={true}
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