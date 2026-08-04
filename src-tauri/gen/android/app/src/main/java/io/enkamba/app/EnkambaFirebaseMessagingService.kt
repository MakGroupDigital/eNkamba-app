package io.enkamba.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class EnkambaFirebaseMessagingService : FirebaseMessagingService() {
  override fun onMessageReceived(message: RemoteMessage) {
    super.onMessageReceived(message)

    val data = message.data
    val type = data["type"].orEmpty()
    val isCall = type == "incoming_call"
    val channelId = if (isCall) CALL_CHANNEL_ID else GENERAL_CHANNEL_ID
    ensureChannel(channelId, isCall)

    val title = message.notification?.title
      ?: data["title"]
      ?: if (isCall) "Appel eNkamba" else "eNkamba"
    val body = message.notification?.body
      ?: data["body"]
      ?: data["message"]
      ?: if (isCall) "Appel entrant" else "Nouvelle notification"

    val actionUrl = data["actionUrl"].orEmpty()
    val intent = Intent(this, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra("enkamba_action_url", actionUrl)
      if (actionUrl.startsWith("/")) {
        setData(Uri.parse("enkamba://open$actionUrl"))
      }
    }

    val pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT or
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
    val pendingIntent = PendingIntent.getActivity(this, 7301, intent, pendingIntentFlags)

    val notification = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setContentIntent(pendingIntent)
      .setAutoCancel(!isCall)
      .setPriority(if (isCall) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_HIGH)
      .setCategory(if (isCall) NotificationCompat.CATEGORY_CALL else NotificationCompat.CATEGORY_MESSAGE)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setVibrate(if (isCall) longArrayOf(0, 300, 150, 300, 150, 500) else longArrayOf(0, 180))
      .build()

    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.notify(data["callId"]?.hashCode() ?: System.currentTimeMillis().toInt(), notification)
  }

  override fun onNewToken(token: String) {
    super.onNewToken(token)
  }

  private fun ensureChannel(channelId: String, isCall: Boolean) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (notificationManager.getNotificationChannel(channelId) != null) return

    val channel = NotificationChannel(
      channelId,
      if (isCall) "eNkamba Appels" else "eNkamba General",
      if (isCall) NotificationManager.IMPORTANCE_HIGH else NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
      description = if (isCall) "Appels audio et video entrants" else "Notifications eNkamba"
      enableVibration(true)
      vibrationPattern = if (isCall) longArrayOf(0, 300, 150, 300, 150, 500) else longArrayOf(0, 180)
      setSound(
        android.provider.Settings.System.DEFAULT_NOTIFICATION_URI,
        AudioAttributes.Builder()
          .setUsage(if (isCall) AudioAttributes.USAGE_NOTIFICATION_RINGTONE else AudioAttributes.USAGE_NOTIFICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
    }

    notificationManager.createNotificationChannel(channel)
  }

  companion object {
    const val CALL_CHANNEL_ID = "enkamba_calls"
    const val GENERAL_CHANNEL_ID = "enkamba_general"
  }
}
