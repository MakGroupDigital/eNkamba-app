package io.enkamba.app

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import org.json.JSONObject

class MainActivity : TauriActivity() {
  private var webViewRef: WebView? = null
  private var pendingGoogleRequestId: String? = null
  private lateinit var googleSignInClient: GoogleSignInClient
  private lateinit var googleSignInLauncher: ActivityResultLauncher<Intent>

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
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

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webViewRef = webView
    webView.addJavascriptInterface(EkambaGoogleBridge(), "eNkambaNativeGoogle")
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
}
