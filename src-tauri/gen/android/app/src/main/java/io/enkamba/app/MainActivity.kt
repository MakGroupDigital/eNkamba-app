package io.enkamba.app

import android.Manifest
import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.ContactsContract
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : TauriActivity() {
  private val nativeCallPreferences by lazy {
    getSharedPreferences("enkamba_native_call", Context.MODE_PRIVATE)
  }
  private var webViewRef: WebView? = null
  private var pendingGoogleRequestId: String? = null
  private var pendingContactsRequestId: String? = null
  private var pendingNotificationUrl: String? = null
  private var pendingNativeCallAccess: String? = null
  private val nativeSessionHandler = Handler(Looper.getMainLooper())
  private lateinit var googleSignInClient: GoogleSignInClient
  private lateinit var googleSignInLauncher: ActivityResultLauncher<Intent>
  private val nativeSessionBootstrap = object : Runnable {
    override fun run() {
      if (FirebaseAuth.getInstance().currentUser != null) return
      bootstrapNativeFirebaseSession()
      nativeSessionHandler.postDelayed(this, NATIVE_SESSION_RETRY_MS)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    captureNotificationIntent(intent)
    pendingNotificationUrl?.let { prepareCallWindowIfNeeded(it) }
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
    pendingNotificationUrl?.let { prepareCallWindowIfNeeded(it) }
    consumePendingNotificationUrl()
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webViewRef = webView
    webView.addJavascriptInterface(EkambaGoogleBridge(), "eNkambaNativeGoogle")
    webView.addJavascriptInterface(EnkambaPushBridge(), "eNkambaNativePush")
    webView.addJavascriptInterface(EnkambaLaunchBridge(), "eNkambaNativeLaunch")
    webView.addJavascriptInterface(EnkambaContactsBridge(), "eNkambaNativeContacts")
    webView.addJavascriptInterface(EnkambaFirebaseBridge(), "eNkambaNativeFirebase")
    webView.addJavascriptInterface(EnkambaCallBridge(), "eNkambaNativeCalls")
    startNativeFirebaseSessionBootstrap()
    consumePendingNotificationUrl()
  }

  override fun onDestroy() {
    nativeSessionHandler.removeCallbacksAndMessages(null)
    super.onDestroy()
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

  inner class EnkambaLaunchBridge {
    @JavascriptInterface
    fun getPendingCallAccess(): String =
      pendingNativeCallAccess
        ?: nativeCallPreferences.getString(PENDING_NATIVE_CALL_ACCESS_KEY, "")
        ?: ""

    @JavascriptInterface
    fun clearPendingCallAccess() {
      pendingNativeCallAccess = null
      nativeCallPreferences.edit().remove(PENDING_NATIVE_CALL_ACCESS_KEY).apply()
    }
  }

  inner class EnkambaContactsBridge {
    @JavascriptInterface
    fun isAvailable(): Boolean = true

    @JavascriptInterface
    fun getContacts(requestId: String) {
      runOnUiThread {
        if (checkSelfPermission(Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) {
          resolveNativeContacts(requestId, buildContactsPayload())
          return@runOnUiThread
        }

        pendingContactsRequestId = requestId
        requestPermissions(arrayOf(Manifest.permission.READ_CONTACTS), CONTACTS_PERMISSION_REQUEST)
      }
    }
  }

  inner class EnkambaFirebaseBridge {
    @JavascriptInterface
    fun isAvailable(): Boolean = true

    @JavascriptInterface
    fun signInWithCustomToken(requestId: String, token: String) {
      runOnUiThread {
        if (token.isBlank()) {
          resolveNativeFirebaseAuth(requestId, false, "Jeton Firebase Android manquant.")
          return@runOnUiThread
        }

        FirebaseAuth.getInstance().signInWithCustomToken(token)
          .addOnCompleteListener { task ->
            if (task.isSuccessful) stopNativeFirebaseSessionBootstrap()
            resolveNativeFirebaseAuth(
              requestId,
              task.isSuccessful,
              task.exception?.message.orEmpty()
            )
          }
      }
    }

    @JavascriptInterface
    fun signOut() {
      FirebaseAuth.getInstance().signOut()
      startNativeFirebaseSessionBootstrap()
    }
  }

  inner class EnkambaCallBridge {
    @JavascriptInterface
    fun isAvailable(): Boolean = true

    @JavascriptInterface
    fun startCall(requestId: String, conversationId: String, recipientUid: String, callType: String) {
      runOnUiThread {
        if (FirebaseAuth.getInstance().currentUser == null) {
          resolveNativeCallStart(requestId, false, "Session Android en cours de synchronisation.")
          return@runOnUiThread
        }
        if (conversationId.isBlank() || recipientUid.isBlank()) {
          resolveNativeCallStart(requestId, false, "Destinataire d'appel invalide.")
          return@runOnUiThread
        }
        try {
          startActivity(NativeCallActivity.outgoingIntent(this@MainActivity, conversationId, recipientUid, callType))
          resolveNativeCallStart(requestId, true, "")
        } catch (error: Exception) {
          resolveNativeCallStart(requestId, false, error.message ?: "Impossible de lancer l'appel natif.")
        }
      }
    }

    @JavascriptInterface
    fun answerIncomingCall(requestId: String, callId: String, callType: String) {
      runOnUiThread {
        if (FirebaseAuth.getInstance().currentUser == null) {
          resolveNativeCallStart(requestId, false, "Session Android en cours de synchronisation.")
          return@runOnUiThread
        }
        if (callId.isBlank()) {
          resolveNativeCallStart(requestId, false, "Reference d'appel invalide.")
          return@runOnUiThread
        }
        try {
          startActivity(
            NativeCallActivity.incomingIntent(
              this@MainActivity,
              callId,
              callType,
              FirebaseAuth.getInstance().currentUser?.uid.orEmpty()
            )
          )
          resolveNativeCallStart(requestId, true, "")
        } catch (error: Exception) {
          resolveNativeCallStart(requestId, false, error.message ?: "Impossible de repondre a l'appel.")
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

      // Google est deja natif a ce stade: ouvrir aussi Firebase Android ici
      // evite toute course avec la WebView pour les futurs appels entrants.
      FirebaseAuth.getInstance()
        .signInWithCredential(GoogleAuthProvider.getCredential(idToken, null))
        .addOnCompleteListener { task ->
          if (task.isSuccessful) stopNativeFirebaseSessionBootstrap()
          resolveGoogleSignIn(requestId, JSONObject().apply {
            put("success", true)
            put("idToken", idToken)
            put("email", account.email ?: "")
            put("displayName", account.displayName ?: "")
            put("photoUrl", account.photoUrl?.toString() ?: "")
          })
        }
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

  private fun resolveNativeContacts(requestId: String, payload: JSONObject) {
    val script = """
      window.__eNkambaNativeContactsResolve &&
      window.__eNkambaNativeContactsResolve(${JSONObject.quote(requestId)}, ${payload});
      document.dispatchEvent(new CustomEvent('enkamba-native-contacts', {
        detail: { requestId: ${JSONObject.quote(requestId)}, payload: ${payload} }
      }));
    """.trimIndent()
    runOnUiThread {
      webViewRef?.post {
        webViewRef?.evaluateJavascript(script, null)
      }
    }
  }

  private fun resolveNativeFirebaseAuth(requestId: String, success: Boolean, error: String) {
    val payload = JSONObject().apply {
      put("success", success)
      if (error.isNotBlank()) put("error", error)
    }
    val script = """
      window.__eNkambaNativeFirebaseAuthResolve &&
      window.__eNkambaNativeFirebaseAuthResolve(${JSONObject.quote(requestId)}, ${payload});
    """.trimIndent()
    runOnUiThread {
      webViewRef?.post { webViewRef?.evaluateJavascript(script, null) }
    }
  }

  private fun resolveNativeCallStart(requestId: String, success: Boolean, error: String) {
    val payload = JSONObject().apply {
      put("success", success)
      if (error.isNotBlank()) put("error", error)
    }
    val script = """
      window.__eNkambaNativeCallResolve &&
      window.__eNkambaNativeCallResolve(${JSONObject.quote(requestId)}, ${payload});
    """.trimIndent()
    runOnUiThread {
      webViewRef?.post { webViewRef?.evaluateJavascript(script, null) }
    }
  }

  private fun startNativeFirebaseSessionBootstrap() {
    nativeSessionHandler.removeCallbacks(nativeSessionBootstrap)
    if (FirebaseAuth.getInstance().currentUser == null) {
      nativeSessionHandler.postDelayed(nativeSessionBootstrap, NATIVE_SESSION_INITIAL_DELAY_MS)
    }
  }

  private fun stopNativeFirebaseSessionBootstrap() {
    nativeSessionHandler.removeCallbacks(nativeSessionBootstrap)
  }

  private fun bootstrapNativeFirebaseSession() {
    val webView = webViewRef ?: return
    val script = """
      (async function () {
        try {
          if (!window.__eNkambaNativeSessionSync && !window.__eNkambaNativeSessionSyncSetup) {
            window.__eNkambaNativeSessionSyncSetup = true;
            try {
              const modules = await Promise.all([
                import('https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js')
              ]);
              const appSdk = modules[0];
              const authSdk = modules[1];
              const config = {
                apiKey: 'AIzaSyDRhWbrpB1Ss4njot7GYO-CZdkvJtZXGyI',
                authDomain: 'studio-1153706651-6032b.firebaseapp.com',
                projectId: 'studio-1153706651-6032b',
                appId: '1:60114170881:web:7805087264e18745ef3c00'
              };
              const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(config);
              const auth = authSdk.getAuth(app);
              window.__eNkambaNativeSessionSync = async function () {
                const user = auth.currentUser;
                if (!user || !window.eNkambaNativeFirebase || !window.eNkambaNativeFirebase.signInWithCustomToken) return;
                const idToken = await user.getIdToken();
                const response = await fetch('/api/mobile-auth/tauri-custom-token/', {
                  method: 'POST',
                  headers: { Authorization: 'Bearer ' + idToken }
                });
                const payload = await response.json().catch(function () { return {}; });
                if (response.ok && payload.customToken) {
                  window.eNkambaNativeFirebase.signInWithCustomToken('native-bootstrap', payload.customToken);
                }
              };
              authSdk.onAuthStateChanged(auth, function (user) {
                if (user && window.__eNkambaNativeSessionSync) window.__eNkambaNativeSessionSync();
              });
            } finally {
              window.__eNkambaNativeSessionSyncSetup = false;
            }
          }
          await window.__eNkambaNativeSessionSync();
        } catch (error) {
          console.warn('eNkamba native session sync failed', error);
        }
      })();
    """.trimIndent()
    webView.post { webView.evaluateJavascript(script, null) }
  }

  private fun buildContactsPayload(): JSONObject {
    val contacts = JSONArray()
    val seenPhones = mutableSetOf<String>()
    val projection = arrayOf(
      ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
      ContactsContract.CommonDataKinds.Phone.NUMBER,
      ContactsContract.CommonDataKinds.Phone.CONTACT_ID
    )

    try {
      contentResolver.query(
        ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
        projection,
        null,
        null,
        "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} ASC"
      )?.use { cursor ->
        val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
        val phoneIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
        val idIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)

        while (cursor.moveToNext()) {
          val phone = cursor.getString(phoneIndex).orEmpty().trim()
          if (phone.isBlank()) continue
          val phoneKey = phone.replace(Regex("\\D"), "")
          if (phoneKey.isBlank() || seenPhones.contains(phoneKey)) continue
          seenPhones.add(phoneKey)

          contacts.put(JSONObject().apply {
            put("id", cursor.getString(idIndex).orEmpty())
            put("name", cursor.getString(nameIndex).orEmpty().ifBlank { phone })
            put("phoneNumber", phone)
            put("email", "")
          })
        }
      }
    } catch (error: Exception) {
      return JSONObject().apply {
        put("success", false)
        put("error", error.message ?: "Lecture des contacts impossible.")
        put("contacts", contacts)
      }
    }

    return JSONObject().apply {
      put("success", true)
      put("contacts", contacts)
    }
  }

  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)

    if (requestCode == CONTACTS_PERMISSION_REQUEST) {
      val requestId = pendingContactsRequestId ?: return
      pendingContactsRequestId = null
      val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
      if (granted) {
        resolveNativeContacts(requestId, buildContactsPayload())
      } else {
        resolveNativeContacts(requestId, JSONObject().apply {
          put("success", false)
          put("error", "Acces aux contacts refuse.")
          put("contacts", JSONArray())
        })
      }
    }
  }

  private fun captureNotificationIntent(intent: Intent?) {
    val fromExtra = intent?.getStringExtra("enkamba_action_url").orEmpty()
    val fromActionUrl = intent?.getStringExtra("actionUrl").orEmpty()
    val fromData = intent?.data?.toString().orEmpty()
    val resolvedTarget = when {
      fromExtra.startsWith("/") -> fromExtra
      fromActionUrl.startsWith("/") -> fromActionUrl
      fromData.startsWith("enkamba://open/") -> fromData.removePrefix("enkamba://open")
      else -> pendingNotificationUrl
    }

    pendingNotificationUrl = resolvedTarget?.let { target ->
      if (isCallRoute(target)) appendNativeAcceptedForCall(target) else target
    }

    val target = pendingNotificationUrl.orEmpty()
    if (isCallRoute(target)) {
      setPendingNativeCallAccess(target)
    }
  }

  private fun consumePendingNotificationUrl() {
    val target = pendingNotificationUrl ?: return
    if (!target.startsWith("/")) return
    pendingNotificationUrl = null
    val isCallRoute = isCallRoute(target)
    val targetWithNativeState = if (isCallRoute) appendNativeAcceptedForCall(target) else target
    val destination = "https://www.enkamba.io$targetWithNativeState"

    if (isCallRoute) {
      setPendingNativeCallAccess(targetWithNativeState)
      prepareCallWindowIfNeeded(targetWithNativeState)
      runOnUiThread {
        webViewRef?.post {
          webViewRef?.loadUrl(destination)
        }
      }
      return
    }

    val script = """
      window.location.replace(${JSONObject.quote(destination)});
    """.trimIndent()
    runOnUiThread {
      webViewRef?.post {
        webViewRef?.evaluateJavascript(script, null)
      }
    }
  }

  private fun isCallRoute(target: String): Boolean {
    return target.startsWith("/dashboard/miyiki-chat/call/") ||
      target.startsWith("/dashboard/miyiki-chat/audiocall/")
  }

  private fun appendNativeAcceptedForCall(path: String): String {
    if (!isCallRoute(path) || path.contains("nativeAccepted=1")) return path
    return appendQueryParam(path, "nativeAccepted", "1")
  }

  private fun setPendingNativeCallAccess(target: String) {
    val access = JSONObject().apply {
      put("target", appendNativeAcceptedForCall(target))
      put("expiresAt", System.currentTimeMillis() + 120000)
    }.toString()
    pendingNativeCallAccess = access
    nativeCallPreferences.edit().putString(PENDING_NATIVE_CALL_ACCESS_KEY, access).apply()
  }

  private fun prepareCallWindowIfNeeded(target: String) {
    if (!isCallRoute(target)) return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
      )
    }

    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      runCatching {
        val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
        keyguardManager?.requestDismissKeyguard(this, null)
      }
    }
  }

  private fun appendQueryParam(path: String, key: String, value: String): String {
    val separator = if (path.contains("?")) "&" else "?"
    return "$path$separator$key=$value"
  }

  private fun requestNotificationPermissionIfNeeded() {
    if (Build.VERSION.SDK_INT < 33) return
    if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return
    requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 7302)
  }

  companion object {
    private const val CONTACTS_PERMISSION_REQUEST = 7303
    private const val PENDING_NATIVE_CALL_ACCESS_KEY = "pending_call_access"
    private const val NATIVE_SESSION_INITIAL_DELAY_MS = 1_000L
    private const val NATIVE_SESSION_RETRY_MS = 4_000L
  }
}
