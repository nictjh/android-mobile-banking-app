import { NativeModules } from 'react-native';

const { KeystoreModule } = NativeModules;

const KEY_ALIAS = 'ENCRYPTION_KEY_V2';

export async function ensureKey() {
  try {
    const res = await KeystoreModule.generateKey(KEY_ALIAS);
    console.log('Key generated or already exists:', res); // "CREATED" or "EXISTS"
  } catch (e) {
    console.error('Failed to ensure key:', e);
  }
}

export async function encryptText(plainText) {
  try {
    const { cipherText, iv } = await KeystoreModule.encrypt(KEY_ALIAS, plainText);
    return { cipherText, iv };
  } catch (e) {
    console.error('Encryption error:', e);
    throw e;
  }
}

export async function decryptText(cipherText, iv) {
  try {
    return await KeystoreModule.decrypt(KEY_ALIAS, cipherText, iv);
  } catch (e) {
    console.error('Decryption error:', e);
    throw e;
  }
}