import { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase' // <-- relative import
import validator from 'validator';

export default function Signup() {

  // Constants
  const MAX_EMAIL_LENGTH = 254;
  const MAX_PASSWORD_LENGTH = 72;

  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (email, password, confirmPassword) => {
    // Clean and Sanitize inputs
    const cleanedEmail = validator.normalizeEmail(email.trim()) || '';
    const cleanedPassword = password.trim();
    const cleanedConfirmPassword = confirmPassword.trim();
    console.log("Running Sanitize and Validate Inputs");

    if (cleanedEmail.length > MAX_EMAIL_LENGTH) {
      Alert.alert('Error', 'Email is too long');
      return;
    }

    if (cleanedPassword.length > MAX_PASSWORD_LENGTH) {
      Alert.alert('Error', 'Password is too long');
      return;
    }

    if (!validator.isEmail(cleanedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    if (cleanedPassword !== cleanedConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: cleanedEmail,
      password: cleanedPassword,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Signup Failed', error.message)
    } else {
      Alert.alert(
        'Signup Success',
        'Please check your email to confirm your account.'
      )
      router.replace('/home')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

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
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Button title={loading ? 'Signing Up...' : 'Sign Up'} onPress={() => handleSignup(email, password, confirmPassword)} disabled={loading} />
      <View style={{ marginTop: 10 }} />
      <Button title="Back to Login" onPress={() => router.back()} />
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
