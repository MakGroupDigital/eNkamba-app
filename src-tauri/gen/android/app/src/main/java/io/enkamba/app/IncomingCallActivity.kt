package io.enkamba.app

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore

class IncomingCallActivity : AppCompatActivity() {
  private val dismissedReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      finish()
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      )
    }

    val title = intent.getStringExtra("title").orEmpty().ifBlank { "Appel Kenz" }
    val body = intent.getStringExtra("body").orEmpty().ifBlank { "Appel entrant" }
    val callType = intent.getStringExtra("callType").orEmpty().ifBlank { "video" }
    val callId = intent.getStringExtra("callId").orEmpty()
    val notificationId = intent.getIntExtra("notificationId", callId.hashCode())

    registerReceiverCompat()
    setContentView(buildLayout(title, body, callType, notificationId))
  }

  override fun onDestroy() {
    runCatching { unregisterReceiver(dismissedReceiver) }
    super.onDestroy()
  }

  private fun buildLayout(
    title: String,
    body: String,
    callType: String,
    notificationId: Int
  ): View {
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(dp(24), dp(40), dp(24), dp(36))
      background = GradientDrawable(
        GradientDrawable.Orientation.TOP_BOTTOM,
        intArrayOf(Color.rgb(10, 139, 70), Color.rgb(7, 72, 40), Color.rgb(2, 24, 14))
      )
    }

    val brand = TextView(this).apply {
      text = "Kenz"
      textSize = 15f
      setTextColor(Color.argb(210, 255, 255, 255))
      typeface = Typeface.DEFAULT_BOLD
      letterSpacing = 0.06f
      gravity = Gravity.CENTER
    }
    root.addView(brand, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)

    val logoCard = LinearLayout(this).apply {
      gravity = Gravity.CENTER
      background = oval(Color.WHITE, 0)
      elevation = dp(10).toFloat()
      setPadding(dp(10), dp(10), dp(10), dp(10))
    }
    val logo = ImageView(this).apply {
      setImageResource(R.mipmap.ic_launcher)
      scaleType = ImageView.ScaleType.CENTER_CROP
    }
    logoCard.addView(logo, LinearLayout.LayoutParams(dp(94), dp(94)))
    val logoParams = LinearLayout.LayoutParams(dp(120), dp(120)).apply {
      topMargin = dp(34)
      bottomMargin = dp(24)
    }
    root.addView(logoCard, logoParams)

    val caller = TextView(this).apply {
      text = body.replace(" vous appelle", "")
      textSize = 30f
      setTextColor(Color.WHITE)
      typeface = Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER
      maxLines = 2
    }
    root.addView(caller, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)

    val subtitle = TextView(this).apply {
      text = if (callType == "audio") "Appel audio entrant" else "Appel video entrant"
      textSize = 16f
      setTextColor(Color.argb(215, 255, 255, 255))
      gravity = Gravity.CENTER
      setPadding(0, dp(10), 0, 0)
    }
    root.addView(subtitle, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)

    val spacer = View(this)
    root.addView(spacer, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))

    val controls = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER
      background = rounded(Color.argb(138, 0, 0, 0), dp(38), 0)
      setPadding(dp(14), dp(12), dp(14), dp(12))
    }

    controls.addView(actionButton("Refuser", Color.rgb(239, 68, 68)) {
      closeCallNotification(notificationId)
      updateCallStatus("missed")
      finish()
    })
    controls.addView(actionButton("Occupé", Color.rgb(242, 140, 40)) {
      closeCallNotification(notificationId)
      updateCallStatus("busy")
      finish()
    })
    controls.addView(actionButton("Accepter", Color.rgb(10, 139, 70)) {
      closeCallNotification(notificationId)
      openCall()
    })

    root.addView(controls, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)

    val hint = TextView(this).apply {
      text = title
      textSize = 13f
      setTextColor(Color.argb(170, 255, 255, 255))
      gravity = Gravity.CENTER
      setPadding(0, dp(16), 0, 0)
    }
    root.addView(hint, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)

    return root
  }

  private fun actionButton(label: String, color: Int, onClick: () -> Unit): Button {
    return Button(this).apply {
      text = label
      textSize = 13f
      setTextColor(Color.WHITE)
      isAllCaps = false
      typeface = Typeface.DEFAULT_BOLD
      background = rounded(color, dp(24), 0)
      setPadding(dp(12), 0, dp(12), 0)
      setOnClickListener { onClick() }
      layoutParams = LinearLayout.LayoutParams(0, dp(54), 1f).apply {
        marginStart = dp(5)
        marginEnd = dp(5)
      }
    }
  }

  private fun openCall() {
    val openIntent = NativeCallActivity.incomingIntent(
      this,
      intent.getStringExtra("callId").orEmpty(),
      intent.getStringExtra("callType").orEmpty(),
      intent.getStringExtra("recipientUid").orEmpty(),
      intent.getStringExtra("nativeAuthToken").orEmpty()
    ).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_SINGLE_TOP or
        Intent.FLAG_ACTIVITY_NO_ANIMATION
    }
    startActivity(openIntent)
    finish()
  }

  private fun closeCallNotification(notificationId: Int) {
    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(notificationId)
  }

  private fun updateCallStatus(status: String) {
    val callId = intent.getStringExtra("callId").orEmpty()
    if (callId.isBlank()) return
    FirebaseFirestore.getInstance().collection("calls").document(callId).update(
      mapOf(
        "status" to status,
        "endedAt" to FieldValue.serverTimestamp()
      )
    )
  }

  private fun registerReceiverCompat() {
    val filter = IntentFilter(IncomingCallActionReceiver.ACTION_CALL_DISMISSED)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(dismissedReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(dismissedReceiver, filter)
    }
  }

  private fun rounded(color: Int, radius: Int, strokeColor: Int): GradientDrawable {
    return GradientDrawable().apply {
      setColor(color)
      cornerRadius = radius.toFloat()
      if (strokeColor != 0) setStroke(dp(1), strokeColor)
    }
  }

  private fun oval(color: Int, strokeColor: Int): GradientDrawable {
    return GradientDrawable().apply {
      shape = GradientDrawable.OVAL
      setColor(color)
      if (strokeColor != 0) setStroke(dp(1), strokeColor)
    }
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
