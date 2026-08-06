package io.enkamba.app

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject

class MainActivity : TauriActivity() {
  private var webViewRef: WebView? = null
  private var pendingGoogleRequestId: String? = null
  private var pendingNotificationUrl: String? = null
  private lateinit var googleSignInClient: GoogleSignInClient
  private lateinit var googleSignInLauncher: ActivityResultLauncher<Intent>

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    captureNotificationIntent(intent)
    val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
      .requestIdToken("60114170881-1h775tgj6rlku54t07dv2m12b47io2u3.apps.googleusercontent.com")
      .requestEmail()
      .requestProfile()
      .build()
    googleSignInClient = GoogleSignIn.getClient(this, options)
    googleSignInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      handleGoogleSignInResult(result.resultCode, result.data)
    }
    super.onCreate(savedInstanceState)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    captureNotificationIntent(intent)
    consumePendingNotificationUrl()
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webViewRef = webView
    webView.addJavascriptInterface(EkambaGoogleBridge(), "eNkambaNativeGoogle")
    webView.addJavascriptInterface(EnkambaPushBridge(), "eNkambaNativePush")
    consumePendingNotificationUrl()
  }

  inner class EkambaGoogleBridge {
    @JavascriptInterface
    fun isAvailable(): Boolean = true

    @JavascriptInterface
    fun signIn(requestId: String) {
      runOnUiThread {
        pendingGoogleRequestId = requestId
        try {
          googleSignInClient.signOut().addOnCompleteListener {
            try {
              googleSignInLauncher.launch(googleSignInClient.signInIntent)
            } catch (error: Exception) {
              pendingGoogleRequestId = null
              resolveGoogleSignIn(requestId, JSONObject().apply {
                put("success", false)
                put("error", error.message ?: "Impossible d'ouvrir Google sur cet appareil.")
              })
            }
          }
        } catch (error: Exception) {
          pendingGoogleRequestId = null
          resolveGoogleSignIn(requestId, JSONObject().apply {
            put("success", false)
            put("error", error.message ?: "Connexion Google native impossible.")
          })
        }
      }
    }
  }

  inner class EnkambaPushBridge {
    @JavascriptInterface
    fun isAvailable(): Boolean = true

    @JavascriptInterface
    fun getToken(requestId: String) {
      runOnUiThread {
        requestNotificationPermissionIfNeeded()
        FirebaseMessaging.getInstance().token
          .addOnCompleteListener { task ->
            val payload = JSONObject()
            if (task.isSuccessful && !task.result.isNullOrBlank()) {
              payload.put("success", true)
              payload.put("token", task.result)
            } else {
              payload.put("success", false)
              payload.put("error", task.exception?.message ?: "Token FCM indisponible.")
            }
            resolveNativePushToken(requestId, payload)
          }
      }
    }
  }

  private fun handleGoogleSignInResult(resultCode: Int, data: Intent?) {
    val requestId = pendingGoogleRequestId ?: return
    pendingGoogleRequestId = null

    if (resultCode != Activity.RESULT_OK || data == null) {
      resolveGoogleSignIn(requestId, JSONObject().apply {
        put("success", false)
        put("error", "Connexion Google annulée.")
      })
      return
    }

    try {
      val account = GoogleSignIn.getSignedInAccountFromIntent(data).result
      val idToken = account?.idToken
      if (idToken.isNullOrBlank()) {
        resolveGoogleSignIn(requestId, JSONObject().apply {
          put("success", false)
          put("error", "Token Google natif indisponible.")
        })
        return
      }

      resolveGoogleSignIn(requestId, JSONObject().apply {
        put("success", true)
        put("idToken", idToken)
        put("email", account.email ?: "")
        put("displayName", account.displayName ?: "")
        put("photoUrl", account.photoUrl?.toString() ?: "")
      })
    } catch (error: Exception) {
      resolveGoogleSignIn(requestId, JSONObject().apply {
        put("success", false)
        put("error", error.message ?: "Connexion Google native impossible.")
      })
    }
  }

  private fun resolveGoogleSignIn(requestId: String, payload: JSONObject) {
    val script = """
      window.__eNkambaNativeGoogleAuthResolve &&
      window.__eNkambaNativeGoogleAuthResolve(${JSONObject.quote(requestId)}, ${payload});
      document.dispatchEvent(new CustomEvent('enkamba-native-google-auth', {
        detail: { requestId: ${JSONObject.quote(requestId)}, payload: ${payload} }
      }));
    """.trimIndent()
    runOnUiThread {
      webViewRef?.post {
        webViewRef?.evaluateJavascript(script, null)
      }
    }
  }

  private fun resolveNativePushToken(requestId: String, payload: JSONObject) {
    val script = """
      window.__eNkambaNativePushTokenResolve &&
      window.__eNkambaNativePushTokenResolve(${JSONObject.quote(requestId)}, ${payload});
      document.dispatchEvent(new CustomEvent('enkamba-native-push-token', {
        detail: { requestId: ${JSONObject.quote(requestId)}, payload: ${payload} }
      }));
    """.trimIndent()
    runOnUiThread {
      webViewRef?.post {
        webViewRef?.evaluateJavascript(script, null)
      }
    }
  }

  private fun captureNotificationIntent(intent: Intent?) {
    val fromExtra = intent?.getStringExtra("enkamba_action_url").orEmpty()
    val fromActionUrl = intent?.getStringExtra("actionUrl").orEmpty()
    val fromData = intent?.data?.toString().orEmpty()
    pendingNotificationUrl = when {
      fromExtra.startsWith("/") -> fromExtra
      fromActionUrl.startsWith("/") -> fromActionUrl
      fromData.startsWith("enkamba://open/") -> fromData.removePrefix("enkamba://open")
      else -> pendingNotificationUrl
    }
  }

  private fun consumePendingNotificationUrl() {
    val target = pendingNotificationUrl ?: return
    if (!target.startsWith("/")) return
    pendingNotificationUrl = null

    val script = """
      window.setTimeout(function () {
        window.location.href = ${JSONObject.quote(target)};
      }, 250);
    """.trimIndent()
    runOnUiThread {
      webViewRef?.post {
        webViewRef?.evaluateJavascript(script, null)
      }
    }
  }

  private fun requestNotificationPermissionIfNeeded() {
    if (Build.VERSION.SDK_INT < 33) return
    if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return
    requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 7302)
  }
}
