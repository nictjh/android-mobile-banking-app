import 'react-native-get-random-values'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { getStoredKey, generateAndStoreEncryptionKey } from '../crypto/cryptoHelper'

export default function RootLayout() {
  useEffect(() => {
    const ensureKey = async () => {
      try {
        await getStoredKey()
        console.log('Encryption key exists')
      } catch {
        console.log('Generating new encryption key')
        await generateAndStoreEncryptionKey()
      }
    }

    ensureKey()
  }, [])

  return <Stack />
}
