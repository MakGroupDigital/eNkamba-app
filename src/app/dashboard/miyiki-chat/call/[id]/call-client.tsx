'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreConversations } from '@/hooks/useFirestoreConversations';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type CallDoc = {
  conversationId: string;
  fromUid: string;
  toUid: string;
  callType: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'ended' | 'missed';
  offer?: { type: RTCSdpType; sdp: string };
  answer?: { type: RTCSdpType; sdp: string };
  createdAt?: any;
  receivedAt?: any;
  acceptedAt?: any;
  endedAt?: any;
  summarySent?: boolean;
};

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

export default function CallClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = (params?.id as string) || '';
  const incomingCallId = searchParams?.get('callId') || '';
  const { user } = useAuth();
  const { sendMessage } = useFirestoreConversations();
  const { toast } = useToast();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState<'init' | 'ringing' | 'connecting' | 'in_call' | 'ended'>('init');
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState<string>(incomingCallId);
  const [contact, setContact] = useState<{ uid: string; name: string; avatar?: string } | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);

  const isIncoming = useMemo(() => Boolean(incomingCallId), [incomingCallId]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const unsubRefs = useRef<Unsubscribe[]>([]);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const summarySentRef = useRef(false);

  useEffect(() => {
    const getMediaPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setHasPermission(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Accès Média Refusé',
          description: "Veuillez autoriser l'accès à la caméra et au microphone.",
        });
      }
    };

    getMediaPermissions();

    return () => {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      unsubRefs.current.forEach((u) => u());
      unsubRefs.current = [];
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch {}
        pcRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [toast]);

  useEffect(() => {
    if (hasPermission && callStatus === 'in_call') {
      const timer = setInterval(() => setCallDuration((p) => p + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [hasPermission, callStatus]);

  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((track) => (track.enabled = !isMicMuted));
  }, [isMicMuted]);

  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach((track) => (track.enabled = !isCameraOff));
  }, [isCameraOff]);

  useEffect(() => {
    const loadContactFromConversation = async () => {
      if (!conversationId || !user?.uid) return;
      try {
        const convSnap = await getDoc(doc(db, 'conversations', conversationId));
        if (!convSnap.exists()) return;
        const data: any = convSnap.data() || {};
        const participants: string[] = Array.isArray(data.participants) ? data.participants : [];
        const otherUid = participants.find((id) => id && id !== user.uid);
        if (!otherUid) return;

        const userSnap = await getDoc(doc(db, 'users', otherUid));
        const ud: any = userSnap.exists() ? userSnap.data() : {};
        const name =
          ud?.fullName ||
          ud?.displayName ||
          ud?.name ||
          data.participantNames?.find((n: any) => typeof n === 'string' && n) ||
          'Utilisateur';
        const avatar = ud?.profileImage || ud?.photoURL || ud?.avatarUrl || ud?.profilePhotoUrl || '';
        setContact({ uid: otherUid, name: String(name), avatar: avatar ? String(avatar) : undefined });
      } catch (e) {
        console.error('Erreur chargement contact appel:', e);
      }
    };
    loadContactFromConversation();
  }, [conversationId, user?.uid]);

  const ensurePeerConnection = () => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    pcRef.current = pc;

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        setRemoteReady(true);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallStatus('in_call');
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') setCallStatus('ended');
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => pc.addTrack(t, streamRef.current as MediaStream));
    }
    return pc;
  };

  const attachIceHandlers = (callIdToUse: string, role: 'caller' | 'callee') => {
    const pc = ensurePeerConnection();
    const callRef = doc(db, 'calls', callIdToUse);
    const offerCandidates = collection(callRef, 'offerCandidates');
    const answerCandidates = collection(callRef, 'answerCandidates');

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const target = role === 'caller' ? offerCandidates : answerCandidates;
      void addDoc(target, event.candidate.toJSON() as any).catch(() => undefined);
    };

    const listenTo = role === 'caller' ? answerCandidates : offerCandidates;
    const unsub = onSnapshot(listenTo, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        const data: any = change.doc.data();
        if (!data) return;
        void pc.addIceCandidate(new RTCIceCandidate(data)).catch(() => undefined);
      });
    });
    unsubRefs.current.push(unsub);
  };

  const startOutgoingCall = async () => {
    if (!user?.uid || !contact?.uid) return;
    if (!hasPermission) return;

    setCallStatus('ringing');
    const created = await addDoc(collection(db, 'calls'), {
      conversationId,
      fromUid: user.uid,
      toUid: contact.uid,
      callType: 'video',
      status: 'ringing',
      createdAt: serverTimestamp(),
    } as CallDoc);

    const newCallId = created.id;
    setCallId(newCallId);

    const pc = ensurePeerConnection();
    attachIceHandlers(newCallId, 'caller');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await updateDoc(doc(db, 'calls', newCallId), { offer: { type: offer.type, sdp: offer.sdp } } as any);

    try {
      await addDoc(collection(db, 'users', contact.uid, 'notifications'), {
        type: 'system',
        title: 'Appel vidéo',
        message: `${user.displayName || 'Quelqu’un'} vous appelle`,
        actionUrl: `/dashboard/miyiki-chat/call/${conversationId}?callId=${newCallId}`,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
      } as any);
    } catch (e) {
      console.warn('Notif appel (non critique):', e);
    }

    ringTimeoutRef.current = setTimeout(async () => {
      try {
        const ref = doc(db, 'calls', newCallId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data: any = snap.data();
        if (data.status === 'ringing') {
          await updateDoc(ref, { status: 'missed', endedAt: serverTimestamp() } as any);
        }
      } catch {}
    }, 35000);

    const unsub = onSnapshot(doc(db, 'calls', newCallId), async (snap) => {
      if (!snap.exists()) return;
      const data: any = snap.data();
      const isCaller = Boolean(user?.uid && data.fromUid === user.uid);

      if (data.status === 'ended' || data.status === 'missed') {
        setCallStatus('ended');
        if (isCaller && !summarySentRef.current) {
          summarySentRef.current = true;
          try {
            const createdAtMs = data.createdAt?.toMillis?.() || Date.now();
            const receivedAtMs = data.receivedAt?.toMillis?.() || null;
            const acceptedAtMs = data.acceptedAt?.toMillis?.() || null;
            const endedAtMs = data.endedAt?.toMillis?.() || Date.now();
            const durationSec = acceptedAtMs ? Math.max(0, Math.round((endedAtMs - acceptedAtMs) / 1000)) : 0;
            const status = acceptedAtMs ? 'completed' : 'no_answer';

            await sendMessage(
              conversationId,
              acceptedAtMs ? '🎥 Appel vidéo' : '🎥 Appel vidéo (sans réponse)',
              'call',
              {
                callType: 'video',
                status,
                durationSec,
                createdAtMs,
                receivedAtMs,
                acceptedAtMs,
                endedAtMs,
                callId: newCallId,
              }
            );
            await updateDoc(doc(db, 'calls', newCallId), { summarySent: true } as any);
          } catch (e) {
            console.warn('Résumé appel (non critique):', e);
          }
        }
        return;
      }

      if (data.answer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallStatus('connecting');
      }
      if (data.status === 'accepted') setCallStatus('connecting');
    });
    unsubRefs.current.push(unsub);
  };

  const joinIncomingCall = async (callIdToUse: string) => {
    if (!user?.uid) return;
    if (!hasPermission) return;

    setCallStatus('connecting');
    const pc = ensurePeerConnection();
    attachIceHandlers(callIdToUse, 'callee');

    const callRef = doc(db, 'calls', callIdToUse);
    try {
      await updateDoc(callRef, { receivedAt: serverTimestamp() } as any);
    } catch {}

    const unsub = onSnapshot(callRef, async (snap) => {
      if (!snap.exists()) return;
      const data: any = snap.data();

      if (data.status === 'ended' || data.status === 'missed') {
        setCallStatus('ended');
        return;
      }

      if (data.offer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(callRef, {
          answer: { type: answer.type, sdp: answer.sdp },
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        } as any);
      }
    });
    unsubRefs.current.push(unsub);
  };

  useEffect(() => {
    if (!hasPermission) return;
    if (!user?.uid) return;
    if (!conversationId) return;
    if (!contact && !isIncoming) return;

    if (isIncoming) {
      if (!incomingCallId) return;
      if (callStatus !== 'init') return;
      void joinIncomingCall(incomingCallId).catch((e) => {
        console.error(e);
        toast({ variant: 'destructive', title: 'Appel impossible', description: "Impossible de rejoindre l’appel." });
        setCallStatus('ended');
      });
    } else {
      if (callStatus !== 'init') return;
      void startOutgoingCall().catch((e) => {
        console.error(e);
        toast({ variant: 'destructive', title: 'Appel impossible', description: "Impossible de démarrer l’appel." });
        setCallStatus('ended');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, user?.uid, conversationId, contact?.uid, isIncoming]);

  const handleEndCall = async () => {
    try {
      if (callId) {
        await updateDoc(doc(db, 'calls', callId), { status: 'ended', endedAt: serverTimestamp() } as any);
      }
    } catch {}
    setCallStatus('ended');
    router.push(`/dashboard/miyiki-chat/${conversationId}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-black text-white overflow-hidden">
      {/* Remote Video */}
      <div className="absolute inset-0">
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
        {!remoteReady && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-700 to-orange-500">
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[min(620px,90vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,140,0,0.45),transparent)] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/2 h-72 w-[min(720px,92vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(50,187,120,0.55),transparent)] blur-2xl" />

            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
              <Avatar className="h-36 w-36 border-4 border-white/50 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                <AvatarImage src={contact?.avatar} />
                <AvatarFallback>{contact?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <p className="mt-5 font-headline text-2xl font-bold">{contact?.name || 'Appel vidéo'}</p>
              {hasPermission && callStatus === 'in_call' ? (
                <p className="text-white/70 text-lg font-mono mt-2">{formatDuration(callDuration)}</p>
              ) : (
                <p className="text-white/85 text-base mt-2">
                  {hasPermission === false
                    ? 'Caméra/Micro requis'
                    : callStatus === 'ringing'
                      ? 'Sonnerie…'
                      : callStatus === 'connecting'
                        ? 'Connexion…'
                        : callStatus === 'ended'
                          ? 'Terminé'
                          : 'Préparation…'}
                </p>
              )}

              {hasPermission === false && (
                <div className="mt-6 w-full max-w-sm">
                  <Alert variant="destructive">
                    <Camera className="h-4 w-4" />
                    <AlertTitle>Caméra/Micro requis</AlertTitle>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local Video */}
      <div className="absolute top-4 right-4 h-48 w-32 overflow-hidden rounded-2xl border border-white/15 bg-black/30 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur">
        <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/40 p-4 backdrop-blur-xl border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/15 hover:bg-white/25"
          onClick={() => setIsMicMuted((p) => !p)}
          disabled={!hasPermission}
        >
          {isMicMuted ? <MicOff /> : <Mic />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/15 hover:bg-white/25"
          onClick={() => setIsCameraOff((p) => !p)}
          disabled={!hasPermission}
        >
          {isCameraOff ? <VideoOff /> : <Video />}
        </Button>
        <Button
          size="icon"
          className="h-16 w-16 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-110 shadow-[0_18px_45px_rgba(220,38,38,0.35)]"
          onClick={handleEndCall}
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}

