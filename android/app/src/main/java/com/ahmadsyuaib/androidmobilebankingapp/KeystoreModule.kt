package com.ahmadsyuaib.androidmobilebankingapp

import android.util.Base64
import com.facebook.react.bridge.*
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import android.util.Log

class KeystoreModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "KeystoreModule"

    @ReactMethod
    fun generateKey(alias: String, promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            if (keyStore.containsAlias(alias)) {
                // Key already exists, do nothing
                promise.resolve("EXISTS")
                return
            }
            val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            val keyGenParameterSpec = KeyGenParameterSpec.Builder(
                alias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
            keyGenerator.init(keyGenParameterSpec)
            keyGenerator.generateKey()
            promise.resolve("CREATED")
        } catch (e: Exception) {
            promise.reject("GEN_KEY_ERROR", e)
        }
    }

    @ReactMethod
    fun keyExists(alias: String): Boolean {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)
        return keyStore.containsAlias(alias)
    }

    @ReactMethod
    fun encrypt(alias: String, plainText: String, promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            val secretKey = keyStore.getKey(alias, null) as SecretKey
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)
            val iv = cipher.iv
            val encryptedBytes = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))
            val result = Arguments.createMap().apply {
                putString("cipherText", Base64.encodeToString(encryptedBytes, Base64.DEFAULT))
                putString("iv", Base64.encodeToString(iv, Base64.DEFAULT))
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ENCRYPT_ERROR", e)
        }
    }

    @ReactMethod
    fun decrypt(alias: String, cipherText: String, iv: String, promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            val secretKey = keyStore.getKey(alias, null) as SecretKey
            Log.d("CryptoHelper", "Secret Key Encoded: " + secretKey.getEncoded())
            Log.d("CryptoHelper", "Secret Key Format: " + secretKey.getFormat())
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val ivBytes = Base64.decode(iv, Base64.DEFAULT)
            val spec = GCMParameterSpec(128, ivBytes)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)
            val encryptedBytes = Base64.decode(cipherText, Base64.DEFAULT)
            val decryptedBytes = cipher.doFinal(encryptedBytes)
            promise.resolve(String(decryptedBytes, Charsets.UTF_8))
        } catch (e: Exception) {
            promise.reject("DECRYPT_ERROR", e)
        }
    }
}