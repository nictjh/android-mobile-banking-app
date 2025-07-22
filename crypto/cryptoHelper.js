import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import * as Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY_NAME = 'ENCRYPTION_KEY';

export async function generateAndStoreEncryptionKey() {
  // Generate a random 32-character hex key
  const key = [...Array(32)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');
  await Keychain.setGenericPassword(ENCRYPTION_KEY_NAME, key); // Stores the key safely in the Android keychain
  return key;
}

export async function getStoredKey() {
  const credentials = await Keychain.getGenericPassword(); // Retrieves the latest stored key, Object with .username and .password properties
  if (!credentials || credentials.username !== ENCRYPTION_KEY_NAME) {
    throw new Error('No stored key found');
  }
  // console.log(credentials.password); // Debugging line to check the key
  return credentials.password;
}

export async function encryptText(text) {
  const key = await getStoredKey();
  const ciphertext = AES.encrypt(text, key).toString();
  return ciphertext;
}

export async function decryptText(encryptedText) {
  const key = await getStoredKey();
  // console.log('EncryptedText:', encryptedText);

  let salt, ciphertext;
  try {
    ({ salt, ciphertext } = extractSaltAndCiphertext(encryptedText));
    if (!salt || !ciphertext) throw new Error('Salt or ciphertext undefined');
  } catch (error) {
    console.error('Error extracting salt and ciphertext:', error);
    throw error;
  }
  const { key: derivedKey, iv } = evpKDF(key, salt);
  // console.log('Derived Key:', derivedKey.toString(CryptoJS.enc.Hex));
  // console.log('IV:', iv.toString(CryptoJS.enc.Hex));
  // console.log('Ciphertext:', ciphertext.toString(CryptoJS.enc.Hex));

  const bytes = AES.decrypt(encryptedText, key);
  const originalText = bytes.toString(Utf8);
  return originalText;
}

function evpKDF(passphrase, salt, keySize = 32, ivSize = 16) {
    // keySize and ivSize in bytes. AES-256 = 32, AES-128 = 16
    let keyiv = CryptoJS.lib.WordArray.create();
    let prev = CryptoJS.lib.WordArray.create();
    const pass = CryptoJS.enc.Utf8.parse(passphrase);

    while (keyiv.sigBytes < keySize + ivSize) {
        let md5 = CryptoJS.algo.MD5.create();
        if (prev.sigBytes) md5.update(prev);
        md5.update(pass);
        md5.update(salt);
        prev = md5.finalize();
        keyiv.concat(prev);
    }
    const key = CryptoJS.lib.WordArray.create(keyiv.words.slice(0, keySize / 4));
    const iv = CryptoJS.lib.WordArray.create(keyiv.words.slice(keySize / 4, (keySize + ivSize) / 4));
    return { key, iv };
}

function extractSaltAndCiphertext(ciphertextBase64) {
    const raw = CryptoJS.enc.Base64.parse(ciphertextBase64);
    const rawStr = CryptoJS.enc.Latin1.stringify(raw);
    // console.log('################# Raw String:', rawStr); // Debugging line to check the raw string
    if (!rawStr.startsWith('Salted__')) throw new Error('Not OpenSSL format!');
    const salt = CryptoJS.enc.Latin1.parse(rawStr.slice(8, 16));
    const ciphertext = CryptoJS.enc.Latin1.parse(rawStr.slice(16));
    return { salt, ciphertext };
}