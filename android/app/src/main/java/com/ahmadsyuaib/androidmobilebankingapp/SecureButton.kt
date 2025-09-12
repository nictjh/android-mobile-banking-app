package com.ahmadsyuaib.androidmobilebankingapp

import android.content.Context
import android.os.Build
import android.util.AttributeSet
import android.view.MotionEvent
import androidx.appcompat.widget.AppCompatButton

class SecureButton @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyle: Int = 0
) : AppCompatButton(context, attrs, defStyle) {

    init {
        // Reject touches if obscured by overlays
        filterTouchesWhenObscured = true
    }

    override fun onFilterTouchEventForSecurity(ev: MotionEvent): Boolean {
        val obscured = (ev.flags and MotionEvent.FLAG_WINDOW_IS_OBSCURED) != 0
        val partiallyObscured = Build.VERSION.SDK_INT >= 29 &&
            (ev.flags and MotionEvent.FLAG_WINDOW_IS_PARTIALLY_OBSCURED) != 0

        return if (obscured || partiallyObscured) {
            // Ignore suspicious touches
            false
        } else {
            super.onFilterTouchEventForSecurity(ev)
        }
    }
}