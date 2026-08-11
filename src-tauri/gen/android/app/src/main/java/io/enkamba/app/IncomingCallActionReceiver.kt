package io.enkamba.app

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore

class IncomingCallActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val callId = intent.getStringExtra("callId").orEmpty()
    val actionUrl = intent.getStringExtra("actionUrl").orEmpty()
    val notificationId = intent.getIntExtra("notificationId", callId.hashCode())
    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(notificationId)

    when (intent.action) {
      ACTION_ACCEPT_CALL -> {
        val openIntent = NativeCallActivity.incomingIntent(
          context,
          callId,
          intent.getStringExtra("callType").orEmpty().ifBlank {
            if (actionUrl.contains("/audiocall/")) "audio" else "video"
          }
        ).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_SINGLE_TOP or
            Intent.FLAG_ACTIVITY_NO_ANIMATION
        }
        context.startActivity(openIntent)
      }
      ACTION_DECLINE_CALL, ACTION_BUSY_CALL -> {
        if (callId.isNotBlank()) {
          val pendingResult = goAsync()
          val status = if (intent.action == ACTION_BUSY_CALL) "busy" else "missed"
          FirebaseFirestore.getInstance().collection("calls").document(callId).update(
            mapOf(
              "status" to status,
              "endedAt" to FieldValue.serverTimestamp()
            )
          ).addOnCompleteListener { pendingResult.finish() }
        }
        context.sendBroadcast(Intent(ACTION_CALL_DISMISSED).apply {
          putExtra("callId", callId)
        })
      }
    }
  }

  companion object {
    const val ACTION_ACCEPT_CALL = "io.enkamba.app.ACCEPT_CALL"
    const val ACTION_DECLINE_CALL = "io.enkamba.app.DECLINE_CALL"
    const val ACTION_BUSY_CALL = "io.enkamba.app.BUSY_CALL"
    const val ACTION_CALL_DISMISSED = "io.enkamba.app.CALL_DISMISSED"
  }

}
