package com.ahmadsyuaib.androidmobilebankingapp

import android.graphics.Color
import android.graphics.Typeface
import android.util.TypedValue
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.common.MapBuilder

class SecureButtonManager : SimpleViewManager<SecureButton>() {

  override fun getName() = "SecureButton"

  override fun createViewInstance(reactContext: ThemedReactContext): SecureButton {
    val view = SecureButton(reactContext)

    // Set default text styling
    view.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
    view.setTextColor(Color.BLACK)

    view.setOnClickListener {
      reactContext
        .getJSModule(RCTEventEmitter::class.java)
        .receiveEvent(view.id, "topPress", null)
    }
    return view
  }

  @ReactProp(name = "text")
  fun setText(view: SecureButton, text: String?) {
    view.text = text ?: ""
  }

  @ReactProp(name = "textStyle")
  fun setTextStyle(view: SecureButton, textStyle: ReadableMap?) {
    textStyle?.let { style ->
      // Handle font size
      if (style.hasKey("fontSize")) {
        val fontSize = style.getDouble("fontSize").toFloat()
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, fontSize)
      }

      // Handle text color
      if (style.hasKey("color")) {
        val color = style.getString("color")
        color?.let {
          try {
            view.setTextColor(Color.parseColor(it))
          } catch (e: IllegalArgumentException) {
            // Invalid color, ignore
          }
        }
      }

      // Handle font weight
      if (style.hasKey("fontWeight")) {
        val fontWeight = style.getString("fontWeight")
        when (fontWeight) {
          "bold", "700", "800", "900" -> view.setTypeface(view.typeface, Typeface.BOLD)
          "500", "600" -> view.setTypeface(view.typeface, Typeface.BOLD)
          else -> view.setTypeface(view.typeface, Typeface.NORMAL)
        }
      }
    }
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
    return MapBuilder.builder<String, Any>()
      .put("topPress", MapBuilder.of("registrationName", "onPress"))
      .build()
  }
}