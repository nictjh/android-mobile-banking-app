package com.ahmadsyuaib.androidmobilebankingapp

import android.app.AlertDialog
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.util.Log

import java.security.SecureRandom

import org.json.JSONObject

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import androidx.appcompat.app.AppCompatActivity
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import com.google.android.play.core.integrity.IntegrityTokenResponse
import com.google.android.gms.tasks.Task

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
    // This is a quick check but very old way to check if the app is installed from an official app store.
    val installer = packageManager.getInstallerPackageName(packageName);
    Log.d("InstallSource", "$installer"); // I need to test this
    val allowedInstallers = listOf(
      "com.android.vending", // Google Play Store
      "com.huawei.appmarket", // Huawei AppGallery
      "com.sec.android.app.samsungapps", // Samsung Galaxy Store
      "com.amazon.venezia" // Amazon Appstore, if needed
    )
    if (installer == null || installer !in allowedInstallers) {
      showBlockDialogAndExit();
    }
  }

   fun generateSecureNonce(): String {
    val randomBytes = ByteArray(16) // 24 bytes is plenty, >=16
    SecureRandom().nextBytes(randomBytes)
    return Base64.encodeToString(randomBytes, Base64.URL_SAFE or Base64.NO_WRAP)
  }

  private fun runPlayIntegrityCheck() {
    val integrityManager = IntegrityManagerFactory.create(this)
    val nonce = generateSecureNonce() // In production: generate a secure random string

    val request = IntegrityTokenRequest.builder()
      .setNonce(nonce)
      .build()

    val integrityTokenTask: Task<IntegrityTokenResponse> = integrityManager.requestIntegrityToken(request)

    integrityTokenTask.addOnSuccessListener { integrityTokenResponse ->
      val integrityToken = integrityTokenResponse.token()
      // In production: Send this token to your backend server to validate!
      // For demo, decode it locally to show licensing verdict
      val verdict = parseLicensingVerdictDemo(integrityToken, nonce)
      Log.d("PlayIntegrity", "Licensing verdict: $verdict")

      if (verdict == "UNLICENSED" || verdict == "UNKNOWN") {
          showBlockDialogAndExit()
      }
    }

    integrityTokenTask.addOnFailureListener { e ->
      Log.e("PlayIntegrity", "Integrity API failed: ${e.message}")
      // Block or allow with warning; here we block for security demo
      showBlockDialogAndExit()
    }
  }

  private fun parseLicensingVerdictDemo(integrityToken: String, expectedNonce: String): String {
    try {
      val parts = integrityToken.split(".")
      if (parts.size != 3) return "UNKNOWN"

      val payloadJson = String(Base64.decode(parts[1], Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP))
      Log.d("PlayIntegrity", "Decoded JWT payload: $payloadJson")
      val payload = JSONObject(payloadJson)

      // Check the nonce matches what you sent
      val nonce = payload.optString("nonce", "")
      if (nonce != expectedNonce) {
          Log.e("PlayIntegrity", "Nonce mismatch! Received: $nonce, Expected: $expectedNonce")
          return "UNKNOWN"
      }

      // Now get the verdict
      return payload.optString("appLicensingVerdict", "UNKNOWN") // Safety fallback to UNKNOWN if appLicensingVerdict is not present
    } catch (e: Exception) {
      Log.e("PlayIntegrity", "Failed to parse token: ${e.message}")
      return "UNKNOWN"
    }
  }

  private fun showBlockDialogAndExit() {
    AlertDialog.Builder(this)
      .setTitle("App Blocked")
      .setMessage("This app is blocked due to integrity verification failure. Please reinstall from an official app store.")
      .setCancelable(false)
      .setPositiveButton("Exit") { _, _ ->
          finishAffinity() // Shut the app down
      }
      .show()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
