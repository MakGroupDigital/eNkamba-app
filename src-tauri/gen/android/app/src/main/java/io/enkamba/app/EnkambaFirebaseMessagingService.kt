package io.enkamba.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.RingtoneManager
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
    val callId = data["callId"].orEmpty()
    val callType = data["callType"].orEmpty()
    val recipientUid = data["toUid"].orEmpty()
    val nativeAuthToken = data["nativeAuthToken"].orEmpty()
    val notificationId = if (isCall && callId.isNotBlank()) callId.hashCode() else System.currentTimeMillis().toInt()
    val intent = Intent(this, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra("enkamba_action_url", actionUrl)
      putExtra("actionUrl", actionUrl)
      if (actionUrl.startsWith("/")) {
        setData(Uri.parse("enkamba://open$actionUrl"))
      }
    }

    val pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT or
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
    val pendingIntent = PendingIntent.getActivity(this, notificationId, intent, pendingIntentFlags)
    val largeIcon = BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)

    val notificationBuilder = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.drawable.ic_notification_enkamba)
      .setLargeIcon(largeIcon)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setContentIntent(pendingIntent)
      .setAutoCancel(!isCall)
      .setPriority(if (isCall) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_HIGH)
      .setCategory(if (isCall) NotificationCompat.CATEGORY_CALL else NotificationCompat.CATEGORY_MESSAGE)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setColor(0xFF0A8B46.toInt())
      .setVibrate(if (isCall) longArrayOf(0, 300, 150, 300, 150, 500) else longArrayOf(0, 180, 80, 180))

    if (isCall) {
      val callScreenIntent = Intent(this, IncomingCallActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        putExtra("title", title)
        putExtra("body", body)
        putExtra("actionUrl", actionUrl)
        putExtra("callId", callId)
        putExtra("callType", callType)
        putExtra("recipientUid", recipientUid)
        putExtra("nativeAuthToken", nativeAuthToken)
        putExtra("notificationId", notificationId)
      }
      val fullScreenIntent = PendingIntent.getActivity(
        this,
        notificationId + 101,
        callScreenIntent,
        pendingIntentFlags
      )
      val acceptIntent = PendingIntent.getBroadcast(
        this,
        notificationId + 201,
        callActionIntent(IncomingCallActionReceiver.ACTION_ACCEPT_CALL, actionUrl, callId, callType, recipientUid, nativeAuthToken, notificationId),
        pendingIntentFlags
      )
      val declineIntent = PendingIntent.getBroadcast(
        this,
        notificationId + 202,
        callActionIntent(IncomingCallActionReceiver.ACTION_DECLINE_CALL, actionUrl, callId, callType, recipientUid, nativeAuthToken, notificationId),
        pendingIntentFlags
      )
      val busyIntent = PendingIntent.getBroadcast(
        this,
        notificationId + 203,
        callActionIntent(IncomingCallActionReceiver.ACTION_BUSY_CALL, actionUrl, callId, callType, recipientUid, nativeAuthToken, notificationId),
        pendingIntentFlags
      )

      notificationBuilder
        .setFullScreenIntent(fullScreenIntent, true)
        .setOngoing(true)
        .setTimeoutAfter(60000)
        .setColorized(true)
        .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Refuser", declineIntent)
        .addAction(android.R.drawable.ic_dialog_alert, "Occupé", busyIntent)
        .addAction(android.R.drawable.ic_menu_call, "Accepter", acceptIntent)
    } else {
      notificationBuilder
        .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
        .setAutoCancel(true)
    }

    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.notify(notificationId, notificationBuilder.build())
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
        RingtoneManager.getDefaultUri(if (isCall) RingtoneManager.TYPE_RINGTONE else RingtoneManager.TYPE_NOTIFICATION),
        AudioAttributes.Builder()
          .setUsage(if (isCall) AudioAttributes.USAGE_NOTIFICATION_RINGTONE else AudioAttributes.USAGE_NOTIFICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
    }

    notificationManager.createNotificationChannel(channel)
  }

  private fun callActionIntent(
    action: String,
    actionUrl: String,
    callId: String,
    callType: String,
    recipientUid: String,
    nativeAuthToken: String,
    notificationId: Int
  ): Intent {
    return Intent(this, IncomingCallActionReceiver::class.java).apply {
      this.action = action
      putExtra("actionUrl", actionUrl)
      putExtra("callId", callId)
      putExtra("callType", callType)
      putExtra("recipientUid", recipientUid)
      putExtra("nativeAuthToken", nativeAuthToken)
      putExtra("notificationId", notificationId)
    }
  }

  companion object {
    const val CALL_CHANNEL_ID = "enkamba_calls_v2"
    const val GENERAL_CHANNEL_ID = "enkamba_messages_v2"
  }
}
