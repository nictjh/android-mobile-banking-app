package com.ahmadsyuaib.androidmobilebankingapp

import android.app.AlertDialog
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Button
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper
import java.io.File

class MainActivity : ReactActivity() {



    companion object {
        // Root management and cloaking app packages
        private val ROOT_CLOAKING_PACKAGES = arrayOf(
        "com.devadvance.rootcloak",
        "com.devadvance.rootcloakplus",
        "de.robv.android.xposed.installer",
        "com.saurik.substrate",
        "com.zachspong.temprootremovejb",
        "com.amphoras.hidemyroot",
        "com.amphoras.hidemyrootadfree",
        "com.formyhm.hiderootPremium",
        "com.formyhm.hideroot"
        )

        private val ROOT_APP_PACKAGES = arrayOf(
        "com.noshufou.android.su",
        "com.noshufou.android.su.elite",
        "eu.chainfire.supersu",
        "com.koushikdutta.superuser",
        "com.thirdparty.superuser",
        "com.yellowes.su",
        "com.topjohnwu.magisk",
        "com.kingroot.kinguser",
        "com.kingo.root",
        "com.smedialink.oneclickroot",
        "com.zhiqupk.root.global",
        "com.alephzain.framaroot"
        )

        private val ROOT_REQUIRED_PACKAGES = arrayOf(
        "de.robv.android.xposed.installer",
        "mobi.acpm.inspeckage",
        "com.koushikdutta.rommanager",
        "com.koushikdutta.rommanager.license",
        "com.dimonvideo.luckypatcher",
        "com.chelpus.lackypatch",
        "com.ramdroid.appquarantine",
        "com.ramdroid.appquarantinepro",
        "com.android.vending.billing.InAppBillingService.COIN",
        "com.android.vending.billing.InAppBillingService.LUCK",
        "com.chelpus.luckypatcher",
        "com.blackmartalpha",
        "org.blackmart.market",
        "com.allinone.free",
        "com.repodroid.app",
        "org.creeplays.hack",
        "com.baseappfull.fwd",
        "com.zmapp",
        "com.dv.marketmod.installer",
        "org.mobilism.android",
        "com.android.wp.net.log",
        "com.android.camera.update",
        "cc.madkite.freedom",
        "com.solohsu.android.edxp.manager",
        "org.meowcat.edxposed.manager",
        "com.xmodgame",
        "com.cih.game_cih",
        "com.charles.lpoqasert"
        )

        private val HIGH_PRIVILEGE_PATHS = arrayOf(
        "/data/local/",
        "/data/local/bin/",
        "/data/local/xbin/",
        "/sbin/",
        "/su/bin/",
        "/system/bin/",
        "/system/bin/.ext/",
        "/system/bin/failsafe/",
        "/system/sd/xbin/",
        "/system/usr/we-need-root/",
        "/system/xbin/",
        "/cache/",
        "/data/",
        "/dev/"
        )

        private val WRITEABLE_PATHS = arrayOf(
        "/system",
        "/system/bin",
        "/system/sbin",
        "/system/xbin",
        "/vendor/bin",
        "/sbin",
        "/etc"
        )
    }


  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)

    // Perform root detection first - exit if compromised
    performInitialRootDetection()

  }

  private fun addRootDetectionButton() {
    // Create button programmatically
    val button = Button(this)
    button.text = "🔍 Run Root Detection"
    button.setOnClickListener {
      performRootDetection()
    }

    // Create layout parameters with proper positioning
    val layoutParams = android.widget.FrameLayout.LayoutParams(
      android.view.ViewGroup.LayoutParams.WRAP_CONTENT,
      android.view.ViewGroup.LayoutParams.WRAP_CONTENT
    ).apply {
      // Position at bottom-right corner with margins
      gravity = android.view.Gravity.BOTTOM or android.view.Gravity.END
      setMargins(32, 32, 32, 150) // left, top, right, bottom margins
    }

    // Add button to the activity (will overlay on React Native content)
    runOnUiThread {
      addContentView(button, layoutParams)
    }
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

    // Root Detection Methods
  private fun performInitialRootDetection() {
    val compromisedDetails = getCompromisedDetails()
    
    if (compromisedDetails.isNotEmpty()) {
      // Device is compromised - show details and exit immediately
      val detailsMessage = buildString {
        appendLine("⚠️ CRITICAL SECURITY WARNING")
        appendLine()
        appendLine("This device has been detected as rooted or compromised.")
        appendLine("For your security and to protect sensitive banking data,")
        appendLine("this application cannot run on compromised devices.")
        appendLine()
        appendLine("🔍 DETECTED THREATS:")
        appendLine("=".repeat(30))
        compromisedDetails.forEach { detail ->
          appendLine("❌ $detail")
        }
        appendLine("=".repeat(30))
        appendLine()
        appendLine("The app will now exit for your protection.")
      }
      
      runOnUiThread {
        AlertDialog.Builder(this)
          .setTitle("🚨 Security Alert")
          .setMessage(detailsMessage)
          .setPositiveButton("Exit") { _, _ ->
            android.os.Process.killProcess(android.os.Process.myPid())
          }
          .setCancelable(false)
          .show()
      }
    }
  }

  private fun getCompromisedDetails(): List<String> {
    val compromisedItems = mutableListOf<String>()
    
    // Check SU binaries
    val suPaths = listOf(
      "/system/bin/su", "/system/xbin/su", "/sbin/su", "/system/sudo",
      "/vendor/bin/su", "/system/app/Superuser.apk", "/data/local/xbin/su",
      "/data/local/bin/su", "/system/sd/xbin/su", "/system/bin/.ext/.su", "/data/local/su"
    )
    val foundSuPaths = suPaths.filter { File(it).exists() }
    if (foundSuPaths.isNotEmpty()) {
      compromisedItems.add("SU binaries found: ${foundSuPaths.joinToString(", ")}")
    }
    
    // Check BusyBox binaries
    val busyBoxPaths = listOf(
      "/system/bin/busybox", "/system/xbin/busybox", "/sbin/busybox",
      "/data/local/xbin/busybox", "/data/local/bin/busybox", "/system/sd/xbin/busybox", "/data/busybox"
    )
    val foundBusyBoxPaths = busyBoxPaths.filter { File(it).exists() }
    if (foundBusyBoxPaths.isNotEmpty()) {
      compromisedItems.add("BusyBox found: ${foundBusyBoxPaths.joinToString(", ")}")
    }
    
    // Check high privilege path access
    val accessiblePaths = HIGH_PRIVILEGE_PATHS.filter { 
      val file = File(it)
      file.exists() && file.canRead()
    }
    if (accessiblePaths.isNotEmpty()) {
      compromisedItems.add("High privilege access: ${accessiblePaths.take(3).joinToString(", ")}${if (accessiblePaths.size > 3) "... (+${accessiblePaths.size - 3} more)" else ""}")
    }
    
    // Check writeable system paths
    val writeablePaths = WRITEABLE_PATHS.filter {
      val file = File(it)
      file.exists() && file.canWrite()
    }
    if (writeablePaths.isNotEmpty()) {
      compromisedItems.add("Writeable system paths: ${writeablePaths.joinToString(", ")}")
    }
    
    // Check root cloaking apps
    val pm = packageManager
    val detectedCloakingApps = ROOT_CLOAKING_PACKAGES.filter {
      try {
        pm.getPackageInfo(it, PackageManager.GET_ACTIVITIES)
        true
      } catch (e: PackageManager.NameNotFoundException) {
        false
      }
    }
    if (detectedCloakingApps.isNotEmpty()) {
      compromisedItems.add("Root cloaking apps: ${detectedCloakingApps.joinToString(", ")}")
    }
    
    // Check root management apps
    val detectedRootApps = ROOT_APP_PACKAGES.filter {
      try {
        pm.getPackageInfo(it, PackageManager.GET_ACTIVITIES)
        true
      } catch (e: PackageManager.NameNotFoundException) {
        false
      }
    }
    if (detectedRootApps.isNotEmpty()) {
      compromisedItems.add("Root management apps: ${detectedRootApps.joinToString(", ")}")
    }
    
    // Check root-required apps
    val detectedRootRequiredApps = ROOT_REQUIRED_PACKAGES.filter {
      try {
        pm.getPackageInfo(it, PackageManager.GET_ACTIVITIES)
        true
      } catch (e: PackageManager.NameNotFoundException) {
        false
      }
    }
    if (detectedRootRequiredApps.isNotEmpty()) {
      compromisedItems.add("Root-required apps: ${detectedRootRequiredApps.joinToString(", ")}")
    }
    
    return compromisedItems
  }

  private fun isDeviceRooted(): Boolean {
    return checkSuBinaryExists() ||
           checkBusyBoxBinaryExists() ||
           checkHighPrivilegePathAccessExists() ||
           checkWriteablePathAccessExists() ||
           checkRootCloakingAppsExists() ||
           checkRootAppPackagesExists() ||
           checkRootRequiredAppsExists()
  }

  private fun performRootDetection() {
    val results = mutableListOf<String>()
    
    results.add(checkSuBinary())
    results.add(checkBusyBoxBinary())
    results.add(checkHighPrivilegePathAccess())
    results.add(checkWriteablePathAccess())
    results.add(checkRootCloakingApps())
    results.add(checkRootAppPackages())
    results.add(checkRootRequiredApps())
    
    showRootDetectionResults(results)
  }

  private fun checkSuBinary(): String {
    val suPaths = listOf(
      "/system/bin/su",
      "/system/xbin/su",
      "/sbin/su",
      "/system/sudo",
      "/vendor/bin/su",
      "/system/app/Superuser.apk",
      "/data/local/xbin/su",
      "/data/local/bin/su",
      "/system/sd/xbin/su",
      "/system/bin/.ext/.su",
      "/data/local/su"
    )

    val foundPaths = mutableListOf<String>()
    for (path in suPaths) {
      if (File(path).exists()) {
        foundPaths.add(path)
      }
    }

    val result = if (foundPaths.isEmpty()) "✅ PASSED" else "❌ FAILED"
    val details = if (foundPaths.isEmpty()) "" else "\n   Detected SU binaries: ${foundPaths.joinToString(", ")}"

    return "SU Binary Detection: $result$details"
  }

  private fun checkSuBinaryExists(): Boolean {
    val suPaths = listOf(
      "/system/bin/su",
      "/system/xbin/su",
      "/sbin/su",
      "/system/sudo",
      "/vendor/bin/su",
      "/system/app/Superuser.apk",
      "/data/local/xbin/su",
      "/data/local/bin/su",
      "/system/sd/xbin/su",
      "/system/bin/.ext/.su",
      "/data/local/su"
    )

    for (path in suPaths) {
      if (File(path).exists()) {
        return true
      }
    }
    return false
  }

  private fun checkBusyBoxBinary(): String {
    val busyBoxPaths = listOf(
      "/system/bin/busybox",
      "/system/xbin/busybox",
      "/sbin/busybox",
      "/data/local/xbin/busybox",
      "/data/local/bin/busybox",
      "/system/sd/xbin/busybox",
      "/data/busybox"
    )

    val foundPaths = mutableListOf<String>()
    for (path in busyBoxPaths) {
      if (File(path).exists()) {
        foundPaths.add(path)
      }
    }

    val result = if (foundPaths.isEmpty()) "✅ PASSED" else "❌ FAILED"
    val details = if (foundPaths.isEmpty()) "" else "\n   Detected BusyBox: ${foundPaths.joinToString(", ")}"

    return "BusyBox Detection: $result$details"
  }

  private fun checkBusyBoxBinaryExists(): Boolean {
    val busyBoxPaths = listOf(
      "/system/bin/busybox",
      "/system/xbin/busybox",
      "/sbin/busybox",
      "/data/local/xbin/busybox",
      "/data/local/bin/busybox",
      "/system/sd/xbin/busybox",
      "/data/busybox"
    )

    for (path in busyBoxPaths) {
      if (File(path).exists()) {
        return true
      }
    }
    return false
  }

  private fun checkHighPrivilegePathAccess(): String {
    val accessiblePaths = mutableListOf<String>()

    for (path in HIGH_PRIVILEGE_PATHS) {
      val file = File(path)
      if (file.exists() && file.canRead()) {
        accessiblePaths.add(path)
      }
    }

    val result = if (accessiblePaths.isEmpty()) "✅ PASSED" else "❌ FAILED"
    val details = if (accessiblePaths.isEmpty()) "" else "\n   Accessible paths: ${accessiblePaths.joinToString(", ")}"

    return "High Privilege Access: $result$details"
  }

  private fun checkHighPrivilegePathAccessExists(): Boolean {
    for (path in HIGH_PRIVILEGE_PATHS) {
      val file = File(path)
      if (file.exists() && file.canRead()) {
        return true
      }
    }
    return false
  }

  private fun checkWriteablePathAccess(): String {
    val writeablePaths = mutableListOf<String>()

    for (path in WRITEABLE_PATHS) {
      val file = File(path)
      if (file.exists() && file.canWrite()) {
        writeablePaths.add(path)
      }
    }

    val result = if (writeablePaths.isEmpty()) "✅ PASSED" else "❌ FAILED"
    val details = if (writeablePaths.isEmpty()) "" else "\n   Writeable paths: ${writeablePaths.joinToString(", ")}"

    return "Writeable Path Access: $result$details"
  }

  private fun checkWriteablePathAccessExists(): Boolean {
    for (path in WRITEABLE_PATHS) {
      val file = File(path)
      if (file.exists() && file.canWrite()) {
        return true
      }
    }
    return false
  }

  private fun checkRootCloakingApps(): String {
    val detectedPackages = mutableListOf<String>()
    val pm = packageManager

    for (packageName in ROOT_CLOAKING_PACKAGES) {
      try {
        pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
        detectedPackages.add(packageName)
      } catch (e: PackageManager.NameNotFoundException) {
        // Package not found, which is good
      }
    }

    val result = if (detectedPackages.isEmpty()) "✅ PASSED" else "❌ FAILED"
    val details = if (detectedPackages.isEmpty()) "" else "\n   Detected: ${detectedPackages.joinToString(", ")}"

    return "Root Cloaking Apps: $result$details"
  }

  private fun checkRootCloakingAppsExists(): Boolean {
    val pm = packageManager

    for (packageName in ROOT_CLOAKING_PACKAGES) {
      try {
        pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
        return true
      } catch (e: PackageManager.NameNotFoundException) {
        // Package not found, which is good
      }
    }
    return false
  }

  private fun checkRootAppPackages(): String {
    val detectedPackages = mutableListOf<String>()
    val pm = packageManager

    for (packageName in ROOT_APP_PACKAGES) {
      try {
        pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
        detectedPackages.add(packageName)
      } catch (e: PackageManager.NameNotFoundException) {
        // Package not found, which is good
      }
    }

    val result = if (detectedPackages.isEmpty()) "✅ PASSED" else "❌ FAILED"
    val details = if (detectedPackages.isEmpty()) "" else "\n   Detected: ${detectedPackages.joinToString(", ")}"

    return "Root Management Apps: $result$details"
  }

  private fun checkRootAppPackagesExists(): Boolean {
    val pm = packageManager

    for (packageName in ROOT_APP_PACKAGES) {
      try {
        pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
        return true
      } catch (e: PackageManager.NameNotFoundException) {
        // Package not found, which is good
      }
    }
    return false
  }

  private fun checkRootRequiredApps(): String {
    val detectedPackages = mutableListOf<String>()
    val pm = packageManager

    for (packageName in ROOT_REQUIRED_PACKAGES) {
      try {
        pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
        detectedPackages.add(packageName)
      } catch (e: PackageManager.NameNotFoundException) {
        // Package not found, which is good
      }
    }

    val result = if (detectedPackages.isEmpty()) "✅ PASSED" else "❌ FAILED"
    val details = if (detectedPackages.isEmpty()) "" else "\n   Detected: ${detectedPackages.joinToString(", ")}"

    return "Root-Required Apps: $result$details"
  }

  private fun checkRootRequiredAppsExists(): Boolean {
    val pm = packageManager

    for (packageName in ROOT_REQUIRED_PACKAGES) {
      try {
        pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
        return true
      } catch (e: PackageManager.NameNotFoundException) {
        // Package not found, which is good
      }
    }
    return false
  }

  private fun showRootDetectionResults(results: List<String>) {
    val message = buildString {
      appendLine("🔍 Root Detection Results")
      appendLine("=".repeat(35))
      appendLine()
      
      results.forEach { result ->
        appendLine(result)
        appendLine()
      }
      
      appendLine("=".repeat(35))
      val failed = results.count { it.contains("❌ FAILED") }
      val passed = results.count { it.contains("✅ PASSED") }
      appendLine("Summary: $passed passed, $failed failed")
      appendLine()
      
      if (failed > 0) {
        appendLine("⚠️ WARNING: Potential root access detected!")
        appendLine("This device may be compromised.")
      } else {
        appendLine("✅ No root access detected.")
        appendLine("Device appears to be secure.")
      }
    }

    runOnUiThread {
      AlertDialog.Builder(this)
        .setTitle("🛡️ Root Detection Report")
        .setMessage(message)
        .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
        .setNegativeButton("Exit App") { _, _ ->
          android.os.Process.killProcess(android.os.Process.myPid())
        }
        .setCancelable(true)
        .show()
    }
  }



}
