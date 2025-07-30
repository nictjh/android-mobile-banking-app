import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const WARNING_LIMIT = 1 * 1024 * 1024;
const HARD_LIMIT = Math.floor(1.99 * 1024 * 1024);

function getStringSizeInBytes(str) {
  return new TextEncoder().encode(str).length;
}

export const safeAsyncStorage = {
    async getItem(key) {
        return await AsyncStorage.getItem(key);
    },

    async setItem(key, value) {
        const size = getStringSizeInBytes(value);

        if (size > WARNING_LIMIT && size <= HARD_LIMIT) {
        // Optionally, log or send telemetry for devs
            console.warn(
                `[safeAsyncStorage] Value for key "${key}" is large (${(size / (1024 * 1024)).toFixed(2)} MB)`
            );
        }

        if (size > HARD_LIMIT) {
            Alert.alert(
                'Error',
                'Your session data is too large to be stored securely. Please log out and log in again. If this problem persists, contact support.',
                [{ text: 'OK' }]
            );
            throw new Error(
                `[safeAsyncStorage] Refusing to store value for key "${key}" size ${size} bytes exceeds 1.99 MB hard limit.`
            );
        }

        return await AsyncStorage.setItem(key, value);
    },

    async removeItem(key) {
      return await AsyncStorage.removeItem(key);
    },

    async clear() {
        return await AsyncStorage.clear();
    }
}