import { Stack } from 'expo-router'
import { use, useEffect } from 'react'
import { ensureKey } from '../crypto/cryptoHelperKS'


export default function RootLayout() {
    useEffect(() => {
        ensureKey();
    }, []);
    return <Stack />
}