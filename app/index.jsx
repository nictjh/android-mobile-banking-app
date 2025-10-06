import { useState, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity, Dimensions, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

import { NativeModules } from 'react-native';
import NotificationService from '../lib/services/NotificationService';

// import analytics from '@react-native-firebase/analytics';

// export async function logLogin() {
//   await analytics().setAnalyticsCollectionEnabled(true);
//   await analytics().logEvent('login_attempt', { method: 'email' });
// }

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍🔍🔍🔍🔍🔍🔍 Checking auth state, session:', session)
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        Alert.alert('Login Error', error.message)
      } else {
        // await logLogin() // Log the login event
        // console.log('✅🦄 Login successful, initializing Firebase...')
        // Login successful, navigate to home or protected route
        await NotificationService.init() // Initialize Firebase messaging after login
        router.replace('/home')
      }
    } catch (error) {
      Alert.alert('Unexpected Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  // const showToast = () => {
  //   NativeModules.MyToastModule.showToast('Hello from native!');
  // };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0e273c" />
      <LinearGradient
        colors={['#0e273c', '#0e273c', '#1a3a52']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>💳</Text>
            </View>
            <Text style={styles.bankName}>Zentra Bank</Text>
            <Text style={styles.tagline}>Your premium banking experience</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.subtitle}>Secure access to your account</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.buttonSection}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#dcb24e" />
                    <Text style={styles.loadingText}>Signing you in...</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                      <LinearGradient
                        colors={['#dcb24e', '#dcb24e']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.loginButtonText}>Sign In Securely</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')} disabled={loading}>
                      <Text style={styles.signupButtonText}>Create New Account</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220, 178, 78, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#dcb24e',
  },
  logoText: {
    fontSize: 32,
  },
  bankName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fffffe',
    marginBottom: 4,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#dcb24e',
    fontWeight: '400',
  },
  formContainer: {
    flex: 0.6,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fffffe',
    padding: 28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minHeight: height * 0.6,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0e273c',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e273c',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#0e273c',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  buttonSection: {
    marginTop: 30,
    paddingBottom: 20,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#dcb24e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fffffe',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signupButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0e273c',
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#0e273c',
    fontSize: 16,
    fontWeight: '600',
  },
})