package io.enkamba.app

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import org.webrtc.AudioSource
import org.webrtc.AudioTrack
import org.webrtc.Camera2Enumerator
import org.webrtc.CameraEnumerator
import org.webrtc.CameraVideoCapturer
import org.webrtc.DataChannel
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.RtpTransceiver
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.SurfaceTextureHelper
import org.webrtc.SurfaceViewRenderer
import org.webrtc.VideoCapturer
import org.webrtc.VideoSource
import org.webrtc.VideoTrack

/**
 * Ecran d'appel Android natif. Le media ne passe jamais par la WebView :
 * Firestore sert seulement a echanger offer, answer et ICE avec les clients
 * Web ou Android. Cela conserve l'interoperabilite avec les appels existants.
 */
class NativeCallActivity : AppCompatActivity() {
  private val firestore by lazy { FirebaseFirestore.getInstance() }
  private val firebaseAuth by lazy { FirebaseAuth.getInstance() }
  private val isIncoming by lazy { intent.getBooleanExtra(EXTRA_IS_INCOMING, false) }
  private val callType by lazy {
    if (intent.getStringExtra(EXTRA_CALL_TYPE) == "audio") "audio" else "video"
  }
  private var callId = ""
  private var conversationId = ""
  private var recipientUid = ""
  private var callReference: DocumentReference? = null
  private var callListener: ListenerRegistration? = null
  private var candidateListener: ListenerRegistration? = null

  private var eglBase: EglBase? = null
  private var factory: PeerConnectionFactory? = null
  private var peerConnection: PeerConnection? = null
  private var audioSource: AudioSource? = null
  private var audioTrack: AudioTrack? = null
  private var videoSource: VideoSource? = null
  private var videoTrack: VideoTrack? = null
  private var surfaceTextureHelper: SurfaceTextureHelper? = null
  private var videoCapturer: VideoCapturer? = null
  private var localRenderer: SurfaceViewRenderer? = null
  private var remoteRenderer: SurfaceViewRenderer? = null
  private var remoteDescriptionApplied = false
  private var localOfferCreated = false
  private var localAnswerCreated = false
  private var finishedCall = false
  private val queuedCandidates = mutableListOf<IceCandidate>()

  private lateinit var nameView: TextView
  private lateinit var statusView: TextView
  private lateinit var muteButton: Button
  private lateinit var cameraButton: Button
  private lateinit var swapButton: Button
  private var microphoneMuted = false
  private var cameraDisabled = false
  private var frontCamera = true

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    applyCallWindowFlags()
    eglBase = EglBase.create()
    callId = intent.getStringExtra(EXTRA_CALL_ID).orEmpty()
    conversationId = intent.getStringExtra(EXTRA_CONVERSATION_ID).orEmpty()
    recipientUid = intent.getStringExtra(EXTRA_RECIPIENT_UID).orEmpty()
    setContentView(buildLayout())
    requestMediaAndStart()
  }

  override fun onDestroy() {
    stopCallResources()
    super.onDestroy()
  }

  override fun onBackPressed() {
    finishCall("ended")
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    if (requestCode != MEDIA_PERMISSION_REQUEST) return
    if (grantResults.isEmpty() || grantResults.any { it != PackageManager.PERMISSION_GRANTED }) {
      showFailure("La camera et le microphone sont necessaires pour l'appel.")
      return
    }
    startNativeCall()
  }

  private fun applyCallWindowFlags() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    )
  }

  private fun requestMediaAndStart() {
    val required = mutableListOf(Manifest.permission.RECORD_AUDIO).apply {
      if (callType == "video") add(Manifest.permission.CAMERA)
    }.toTypedArray()

    val missing = required.filter {
      ActivityCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
    }
    if (missing.isNotEmpty()) {
      ActivityCompat.requestPermissions(this, missing.toTypedArray(), MEDIA_PERMISSION_REQUEST)
      return
    }
    startNativeCall()
  }

  private fun startNativeCall() {
    if (firebaseAuth.currentUser == null) {
      showFailure("Session mobile indisponible. Ouvrez eNkamba une fois puis reessayez.")
      return
    }
    initialiseWebRtc()
    if (isIncoming) {
      if (callId.isBlank()) {
        showFailure("Reference d'appel introuvable.")
        return
      }
      joinIncomingCall()
    } else {
      if (conversationId.isBlank() || recipientUid.isBlank()) {
        showFailure("Destinataire de l'appel introuvable.")
        return
      }
      createOutgoingCall()
    }
  }

  private fun initialiseWebRtc() {
    if (factory != null) return
    PeerConnectionFactory.initialize(
      PeerConnectionFactory.InitializationOptions.builder(applicationContext)
        .setEnableInternalTracer(false)
        .createInitializationOptions()
    )

    factory = PeerConnectionFactory.builder()
      .createPeerConnectionFactory()

    audioSource = factory?.createAudioSource(MediaConstraints())
    audioTrack = factory?.createAudioTrack("enkamba-audio", audioSource)

    if (callType == "video") {
      startVideoCapture()
    }

    val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
    audioManager.isSpeakerphoneOn = callType == "video"
  }

  private fun startVideoCapture() {
    val eglContext = eglBase?.eglBaseContext ?: return
    val capturer = createCameraCapturer(frontCamera) ?: run {
      showFailure("Camera indisponible sur cet appareil.")
      return
    }
    videoCapturer = capturer
    videoSource = factory?.createVideoSource(false)
    surfaceTextureHelper = SurfaceTextureHelper.create("eNkambaCamera", eglContext)
    capturer.initialize(surfaceTextureHelper, applicationContext, videoSource?.capturerObserver)
    capturer.startCapture(1280, 720, 30)
    videoTrack = factory?.createVideoTrack("enkamba-video", videoSource)
    localRenderer?.let { videoTrack?.addSink(it) }
  }

  private fun createCameraCapturer(useFrontCamera: Boolean): CameraVideoCapturer? {
    val enumerator: CameraEnumerator = Camera2Enumerator(this)
    val names = enumerator.deviceNames
    val preferred = if (useFrontCamera) {
      names.firstOrNull { enumerator.isFrontFacing(it) }
    } else {
      names.firstOrNull { !enumerator.isFrontFacing(it) }
    }
    return preferred?.let { enumerator.createCapturer(it, null) }
  }

  private fun createPeerConnection(): PeerConnection? {
    peerConnection?.let { return it }
    val servers = mutableListOf(
      PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
      PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer()
    )
    val turnHost = BuildConfig.NATIVE_WEBRTC_TURN_HOST.trim()
    val turnUsername = BuildConfig.NATIVE_WEBRTC_TURN_USERNAME.trim()
    val turnPassword = BuildConfig.NATIVE_WEBRTC_TURN_PASSWORD.trim()
    val turnPort = BuildConfig.NATIVE_WEBRTC_TURN_PORT.trim().ifBlank { "3478" }
    val turnsPort = BuildConfig.NATIVE_WEBRTC_TURNS_PORT.trim()
    if (turnHost.isNotBlank() && turnUsername.isNotBlank() && turnPassword.isNotBlank()) {
      servers.add(
        PeerConnection.IceServer.builder("turn:$turnHost:$turnPort?transport=udp")
          .setUsername(turnUsername)
          .setPassword(turnPassword)
          .createIceServer()
      )
      servers.add(
        PeerConnection.IceServer.builder("turn:$turnHost:$turnPort?transport=tcp")
          .setUsername(turnUsername)
          .setPassword(turnPassword)
          .createIceServer()
      )
      if (turnsPort.isNotBlank()) {
        servers.add(
          PeerConnection.IceServer.builder("turns:$turnHost:$turnsPort?transport=tcp")
            .setUsername(turnUsername)
            .setPassword(turnPassword)
            .createIceServer()
        )
      }
    }

    val connection = factory?.createPeerConnection(
      PeerConnection.RTCConfiguration(servers).apply {
        bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
        rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
        iceTransportsType = PeerConnection.IceTransportsType.ALL
      },
      object : PeerConnection.Observer {
        override fun onSignalingChange(newState: PeerConnection.SignalingState?) = Unit
        override fun onIceConnectionChange(newState: PeerConnection.IceConnectionState?) {
          runOnUiThread {
            when (newState) {
              PeerConnection.IceConnectionState.CONNECTED,
              PeerConnection.IceConnectionState.COMPLETED -> updateStatus("Appel en cours")
              PeerConnection.IceConnectionState.FAILED -> finishCall("ended")
              PeerConnection.IceConnectionState.DISCONNECTED -> updateStatus("Connexion en cours...")
              else -> Unit
            }
          }
        }
        override fun onIceConnectionReceivingChange(receiving: Boolean) = Unit
        override fun onIceGatheringChange(newState: PeerConnection.IceGatheringState?) = Unit
        override fun onIceCandidate(candidate: IceCandidate?) {
          if (candidate != null) writeLocalCandidate(candidate)
        }
        override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) = Unit
        override fun onAddStream(stream: MediaStream?) {
          stream?.videoTracks?.forEach { track -> remoteRenderer?.let { track.addSink(it) } }
        }
        override fun onRemoveStream(stream: MediaStream?) = Unit
        override fun onDataChannel(dataChannel: DataChannel?) = Unit
        override fun onRenegotiationNeeded() = Unit
        override fun onAddTrack(receiver: RtpReceiver?, mediaStreams: Array<out MediaStream>?) {
          mediaStreams?.forEach { stream ->
            stream.videoTracks.forEach { track -> remoteRenderer?.let { track.addSink(it) } }
          }
        }
        override fun onTrack(transceiver: RtpTransceiver?) {
          val track = transceiver?.receiver?.track() as? VideoTrack ?: return
          remoteRenderer?.let { track.addSink(it) }
        }
      }
    )
    peerConnection = connection
    connection?.addTrack(audioTrack, listOf("enkamba-stream"))
    videoTrack?.let { connection?.addTrack(it, listOf("enkamba-stream")) }
    return connection
  }

  private fun createOutgoingCall() {
    updateStatus("Appel en cours de lancement...")
    val caller = firebaseAuth.currentUser ?: return
    firestore.collection("calls").add(
      hashMapOf(
        "conversationId" to conversationId,
        "fromUid" to caller.uid,
        "toUid" to recipientUid,
        "callType" to callType,
        "status" to "ringing",
        "createdAt" to FieldValue.serverTimestamp()
      )
    ).addOnSuccessListener { reference ->
      callId = reference.id
      callReference = reference
      updateStatus("Appel entrant chez votre contact...")
      listenToCall(reference, "caller")
      loadParticipantName(recipientUid, "Appel sortant")
      createOffer(reference)
      firestore.collection("users").document(recipientUid).collection("notifications").add(
        hashMapOf(
          "type" to "incoming_call",
          "title" to "Appel ${if (callType == "audio") "audio" else "video"}",
          "message" to "${caller.displayName ?: "Un contact"} vous appelle",
          "actionUrl" to "/dashboard/miyiki-chat/${if (callType == "audio") "audiocall" else "call"}/$conversationId?callId=$callId",
          "read" to false,
          "callId" to callId,
          "callType" to callType,
          "conversationId" to conversationId,
          "fromUid" to caller.uid,
          "timestamp" to FieldValue.serverTimestamp(),
          "createdAt" to FieldValue.serverTimestamp()
        )
      )
    }.addOnFailureListener { showFailure("Impossible de creer cet appel.") }
  }

  private fun joinIncomingCall() {
    updateStatus("Connexion a l'appel...")
    val reference = firestore.collection("calls").document(callId)
    callReference = reference
    reference.get().addOnSuccessListener { snapshot ->
      if (!snapshot.exists()) {
        showFailure("Cet appel n'est plus disponible.")
        return@addOnSuccessListener
      }
      val currentUid = firebaseAuth.currentUser?.uid.orEmpty()
      if (snapshot.getString("toUid") != currentUid || snapshot.getString("status") !in listOf("ringing", "accepted")) {
        showFailure("Cet appel n'est plus disponible.")
        return@addOnSuccessListener
      }
      conversationId = snapshot.getString("conversationId").orEmpty()
      loadParticipantName(snapshot.getString("fromUid").orEmpty(), "Appel entrant")
      reference.update("receivedAt", FieldValue.serverTimestamp())
      listenToCall(reference, "callee")
    }.addOnFailureListener { showFailure("Impossible de rejoindre l'appel.") }
  }

  private fun createOffer(reference: DocumentReference) {
    if (localOfferCreated) return
    val connection = createPeerConnection() ?: run {
      showFailure("Moteur d'appel indisponible.")
      return
    }
    localOfferCreated = true
    connection.createOffer(object : SimpleSdpObserver() {
      override fun onCreateSuccess(description: SessionDescription?) {
        if (description == null) return showFailure("Offre d'appel invalide.")
        connection.setLocalDescription(object : SimpleSdpObserver() {
          override fun onSetSuccess() {
            reference.update(mapOf("offer" to sdpMap(description)))
          }
        }, description)
      }
      override fun onCreateFailure(error: String?) {
        showFailure("Impossible de preparer l'appel.")
      }
    }, mediaConstraints())
  }

  private fun createAnswer(reference: DocumentReference, offer: SessionDescription) {
    if (localAnswerCreated) return
    val connection = createPeerConnection() ?: run {
      showFailure("Moteur d'appel indisponible.")
      return
    }
    connection.setRemoteDescription(object : SimpleSdpObserver() {
      override fun onSetSuccess() {
        remoteDescriptionApplied = true
        flushQueuedCandidates()
        localAnswerCreated = true
        connection.createAnswer(object : SimpleSdpObserver() {
          override fun onCreateSuccess(description: SessionDescription?) {
            if (description == null) return showFailure("Reponse d'appel invalide.")
            connection.setLocalDescription(object : SimpleSdpObserver() {
              override fun onSetSuccess() {
                reference.update(
                  mapOf(
                    "answer" to sdpMap(description),
                    "status" to "accepted",
                    "acceptedAt" to FieldValue.serverTimestamp()
                  )
                )
              }
            }, description)
          }
          override fun onCreateFailure(error: String?) = showFailure("Impossible de repondre a l'appel.")
        }, mediaConstraints())
      }
      override fun onSetFailure(error: String?) = showFailure("Connexion d'appel invalide.")
    }, offer)
  }

  private fun applyAnswer(answer: SessionDescription) {
    val connection = createPeerConnection() ?: return
    if (remoteDescriptionApplied) return
    connection.setRemoteDescription(object : SimpleSdpObserver() {
      override fun onSetSuccess() {
        remoteDescriptionApplied = true
        flushQueuedCandidates()
        updateStatus("Connexion en cours...")
      }
      override fun onSetFailure(error: String?) = showFailure("Reponse d'appel invalide.")
    }, answer)
  }

  private fun listenToCall(reference: DocumentReference, role: String) {
    candidateListener?.remove()
    callListener?.remove()
    val remoteCandidates = if (role == "caller") "answerCandidates" else "offerCandidates"
    candidateListener = reference.collection(remoteCandidates).addSnapshotListener { snapshot, _ ->
      snapshot?.documentChanges?.forEach { change ->
        if (change.type.name != "ADDED") return@forEach
        candidateFrom(change.document.data)?.let { candidate ->
          if (remoteDescriptionApplied) createPeerConnection()?.addIceCandidate(candidate) else queuedCandidates.add(candidate)
        }
      }
    }
    callListener = reference.addSnapshotListener { snapshot, _ ->
      if (snapshot == null || !snapshot.exists() || finishedCall) return@addSnapshotListener
      val status = snapshot.getString("status").orEmpty()
      if (status == "ended" || status == "missed" || status == "busy") {
        finishCall(status, false)
        return@addSnapshotListener
      }
      if (role == "callee") {
        sdpFrom(snapshot.get("offer"))?.let { createAnswer(reference, it) }
      } else {
        sdpFrom(snapshot.get("answer"))?.let { applyAnswer(it) }
      }
    }
  }

  private fun writeLocalCandidate(candidate: IceCandidate) {
    val reference = callReference ?: return
    if (callId.isBlank()) return
    val target = if (isIncoming) "answerCandidates" else "offerCandidates"
    reference.collection(target).add(
      hashMapOf(
        "candidate" to candidate.sdp,
        "sdpMid" to (candidate.sdpMid ?: ""),
        "sdpMLineIndex" to candidate.sdpMLineIndex
      )
    )
  }

  private fun loadParticipantName(uid: String, fallback: String) {
    if (uid.isBlank()) {
      nameView.text = fallback
      return
    }
    firestore.collection("users").document(uid).get().addOnSuccessListener { user ->
      val displayName = listOf("fullName", "displayName", "name")
        .asSequence()
        .mapNotNull { field -> user.getString(field)?.trim()?.takeIf { it.isNotBlank() } }
        .firstOrNull()
      nameView.text = displayName ?: fallback
    }.addOnFailureListener {
      nameView.text = fallback
    }
  }

  private fun flushQueuedCandidates() {
    val connection = createPeerConnection() ?: return
    queuedCandidates.forEach { connection.addIceCandidate(it) }
    queuedCandidates.clear()
  }

  private fun mediaConstraints() = MediaConstraints().apply {
    mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
    mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", (callType == "video").toString()))
  }

  private fun sdpMap(description: SessionDescription) = hashMapOf(
    "type" to description.type.canonicalForm(),
    "sdp" to description.description
  )

  private fun sdpFrom(value: Any?): SessionDescription? {
    val data = value as? Map<*, *> ?: return null
    val type = data["type"] as? String ?: return null
    val sdp = data["sdp"] as? String ?: return null
    return runCatching { SessionDescription(SessionDescription.Type.fromCanonicalForm(type), sdp) }.getOrNull()
  }

  private fun candidateFrom(data: Map<String, Any>): IceCandidate? {
    val sdp = data["candidate"] as? String ?: return null
    val sdpMid = data["sdpMid"] as? String
    val index = (data["sdpMLineIndex"] as? Number)?.toInt() ?: 0
    return IceCandidate(sdpMid, index, sdp)
  }

  private fun toggleMicrophone() {
    microphoneMuted = !microphoneMuted
    audioTrack?.setEnabled(!microphoneMuted)
    muteButton.text = if (microphoneMuted) "Micro coupe" else "Micro"
  }

  private fun toggleCamera() {
    if (callType != "video") return
    cameraDisabled = !cameraDisabled
    videoTrack?.setEnabled(!cameraDisabled)
    cameraButton.text = if (cameraDisabled) "Camera off" else "Camera"
  }

  private fun switchCamera() {
    (videoCapturer as? CameraVideoCapturer)?.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
      override fun onCameraSwitchDone(isFrontCamera: Boolean) {
        frontCamera = isFrontCamera
        runOnUiThread { localRenderer?.setMirror(frontCamera) }
      }
      override fun onCameraSwitchError(errorDescription: String?) {
        runOnUiThread { updateStatus("Changement de camera impossible") }
      }
    })
  }

  private fun finishCall(status: String, notifyRemote: Boolean = true) {
    if (finishedCall) return
    finishedCall = true
    if (notifyRemote) {
      callReference?.update(
        mapOf(
          "status" to status,
          "endedAt" to FieldValue.serverTimestamp()
        )
      )
    }
    stopCallResources()
    finish()
  }

  private fun stopCallResources() {
    callListener?.remove()
    callListener = null
    candidateListener?.remove()
    candidateListener = null
    runCatching { videoCapturer?.stopCapture() }
    videoCapturer?.dispose()
    videoCapturer = null
    surfaceTextureHelper?.dispose()
    surfaceTextureHelper = null
    videoTrack?.dispose()
    videoTrack = null
    videoSource?.dispose()
    videoSource = null
    audioTrack?.dispose()
    audioTrack = null
    audioSource?.dispose()
    audioSource = null
    peerConnection?.close()
    peerConnection?.dispose()
    peerConnection = null
    factory?.dispose()
    factory = null
    remoteRenderer?.release()
    localRenderer?.release()
    eglBase?.release()
    eglBase = null
    val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    audioManager.mode = AudioManager.MODE_NORMAL
    audioManager.isSpeakerphoneOn = false
  }

  private fun showFailure(message: String) {
    updateStatus(message)
    statusView.postDelayed({ finishCall("ended") }, 2500)
  }

  private fun updateStatus(text: String) {
    runOnUiThread { statusView.text = text }
  }

  private fun buildLayout(): View {
    val root = FrameLayout(this).apply {
      setBackgroundColor(0xFF031A0E.toInt())
    }

    remoteRenderer = SurfaceViewRenderer(this).apply {
      init(eglBase!!.eglBaseContext, null)
      setMirror(false)
      setEnableHardwareScaler(true)
      setBackgroundColor(0xFF0A8B46.toInt())
    }
    // Re-initialise the remote renderer with the shared context once WebRTC starts.
    root.addView(remoteRenderer, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))

    val shade = View(this).apply { setBackgroundColor(0x66000000) }
    root.addView(shade, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))

    val top = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(24), dp(46), dp(24), 0)
    }
    nameView = TextView(this).apply {
      text = if (isIncoming) "Appel entrant" else "Nouvel appel"
      textSize = 28f
      setTextColor(0xFFFFFFFF.toInt())
      gravity = Gravity.CENTER
    }
    statusView = TextView(this).apply {
      text = "Preparation de l'appel..."
      textSize = 15f
      setTextColor(0xDFFFFFFF.toInt())
      gravity = Gravity.CENTER
      setPadding(0, dp(8), 0, 0)
    }
    top.addView(nameView)
    top.addView(statusView)
    root.addView(top, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.TOP))

    if (callType == "video") {
      localRenderer = SurfaceViewRenderer(this).apply {
        init(eglBase!!.eglBaseContext, null)
        setMirror(true)
        setEnableHardwareScaler(true)
        setBackgroundColor(0xFF0A8B46.toInt())
      }
      val previewParams = FrameLayout.LayoutParams(dp(124), dp(168), Gravity.TOP or Gravity.END).apply {
        topMargin = dp(116)
        marginEnd = dp(18)
      }
      root.addView(localRenderer, previewParams)
    }

    val controls = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER
      setPadding(dp(10), dp(10), dp(10), dp(10))
      setBackgroundColor(0xCC10261B.toInt())
    }
    muteButton = controlButton("Micro") { toggleMicrophone() }
    controls.addView(muteButton)
    if (callType == "video") {
      cameraButton = controlButton("Camera") { toggleCamera() }
      controls.addView(cameraButton)
      swapButton = controlButton("Tourner") { switchCamera() }
      controls.addView(swapButton)
    } else {
      cameraButton = controlButton("Haut-parleur") {
        val manager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        manager.isSpeakerphoneOn = !manager.isSpeakerphoneOn
        cameraButton.text = if (manager.isSpeakerphoneOn) "Ecouteur" else "Haut-parleur"
      }
      controls.addView(cameraButton)
    }
    controls.addView(controlButton("Raccrocher", 0xFFEF4444.toInt()) { finishCall("ended") })
    val controlsParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
      bottomMargin = dp(36)
    }
    root.addView(controls, controlsParams)
    return root
  }

  private fun controlButton(text: String, color: Int = 0xFF0A8B46.toInt(), action: () -> Unit): Button {
    return Button(this).apply {
      this.text = text
      textSize = 12f
      isAllCaps = false
      setTextColor(0xFFFFFFFF.toInt())
      setBackgroundColor(color)
      setOnClickListener { action() }
      layoutParams = LinearLayout.LayoutParams(dp(94), dp(52)).apply {
        marginStart = dp(4)
        marginEnd = dp(4)
      }
    }
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

  private abstract class SimpleSdpObserver : SdpObserver {
    override fun onCreateSuccess(sessionDescription: SessionDescription?) = Unit
    override fun onSetSuccess() = Unit
    override fun onCreateFailure(error: String?) = Unit
    override fun onSetFailure(error: String?) = Unit
  }

  companion object {
    const val EXTRA_CALL_ID = "native_call_id"
    const val EXTRA_CALL_TYPE = "native_call_type"
    const val EXTRA_IS_INCOMING = "native_call_incoming"
    const val EXTRA_CONVERSATION_ID = "native_call_conversation_id"
    const val EXTRA_RECIPIENT_UID = "native_call_recipient_uid"
    private const val MEDIA_PERMISSION_REQUEST = 7601

    fun incomingIntent(context: Context, callId: String, callType: String): Intent {
      return Intent(context, NativeCallActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        putExtra(EXTRA_CALL_ID, callId)
        putExtra(EXTRA_CALL_TYPE, callType)
        putExtra(EXTRA_IS_INCOMING, true)
      }
    }

    fun outgoingIntent(context: Context, conversationId: String, recipientUid: String, callType: String): Intent {
      return Intent(context, NativeCallActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        putExtra(EXTRA_CONVERSATION_ID, conversationId)
        putExtra(EXTRA_RECIPIENT_UID, recipientUid)
        putExtra(EXTRA_CALL_TYPE, callType)
        putExtra(EXTRA_IS_INCOMING, false)
      }
    }
  }
}
