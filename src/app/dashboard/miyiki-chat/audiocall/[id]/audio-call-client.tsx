'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, PhoneOff, Phone, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreConversations } from '@/hooks/useFirestoreConversations';
import { useCallFeedback } from '@/hooks/useCallFeedback';
import { attachRemoteStream, closePeerResources, getRtcConfiguration, hasTurnServerConfigured } from '@/lib/webrtc';
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

type AudioElementWithSink = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

export default function AudioCallClient() {
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
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [speakerSupported, setSpeakerSupported] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState<string>(incomingCallId);
  const [callStatus, setCallStatus] = useState<'init' | 'ringing' | 'connecting' | 'in_call' | 'ended'>('init');
  const [contact, setContact] = useState<{ uid: string; name: string; avatar?: string } | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const unsubRefs = useRef<Unsubscribe[]>([]);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const summarySentRef = useRef(false);
  const hasNavigatedAwayRef = useRef(false);
  const callStatusRef = useRef(callStatus);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const isIncoming = useMemo(() => Boolean(incomingCallId), [incomingCallId]);

  useCallFeedback(callStatus === 'ringing' && !isIncoming, 'ringback');

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    if (!hasTurnServerConfigured()) {
      console.warn('Aucun serveur TURN configure: les appels a distance peuvent rester sans media selon le NAT.');
    }
  }, []);

  useEffect(() => {
    const setupFullscreen = async () => {
      try {
        const [{ Capacitor }, { StatusBar, Style }] = await Promise.all([
          import('@capacitor/core'),
          import('@capacitor/status-bar'),
        ]);

        if (!Capacitor.isNativePlatform()) return;
        await StatusBar.hide();

        return async () => {
          await StatusBar.show();
          await StatusBar.setStyle({ style: Style.Dark });
        };
      } catch {
        return undefined;
      }
    };

    let cleanup: undefined | (() => Promise<void>);
    void setupFullscreen().then((result) => {
      cleanup = result;
    });

    return () => {
      if (cleanup) {
        void cleanup();
      }
    };
  }, []);

  useEffect(() => {
    const getMediaPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        setHasPermission(true);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acces media refuse',
          description: "Veuillez autoriser l'acces au microphone.",
        });
      }
    };

    void getMediaPermissions();
    setSpeakerSupported(typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype);

    return () => {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      unsubRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubRefs.current = [];
      closePeerResources(pcRef.current, [streamRef.current, remoteStreamRef.current]);
      pcRef.current = null;
      remoteStreamRef.current = null;
    };
  }, [toast]);

  useEffect(() => {
    if (hasPermission && callStatus === 'in_call') {
      const timer = setInterval(() => {
        setCallDuration((current) => current + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [hasPermission, callStatus]);

  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !isMicMuted;
    });
  }, [isMicMuted]);

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
        const userData: any = userSnap.exists() ? userSnap.data() : {};
        const name =
          userData?.fullName ||
          userData?.displayName ||
          userData?.name ||
          data.participantNames?.find((item: unknown) => typeof item === 'string' && item) ||
          'Utilisateur';
        const avatar =
          userData?.profileImage ||
          userData?.photoURL ||
          userData?.avatarUrl ||
          userData?.profilePhotoUrl ||
          '';
        setContact({ uid: otherUid, name: String(name), avatar: avatar ? String(avatar) : undefined });
      } catch (error) {
        console.error('Erreur chargement contact appel:', error);
      }
    };

    void loadContactFromConversation();
  }, [conversationId, user?.uid]);

  const ensurePeerConnection = () => {
    if (pcRef.current) return pcRef.current;
    const peerConnection = new RTCPeerConnection(getRtcConfiguration());
    pcRef.current = peerConnection;
    remoteStreamRef.current = new MediaStream();

    peerConnection.ontrack = (event) => {
      const remoteStream = remoteStreamRef.current ?? new MediaStream();
      remoteStreamRef.current = remoteStream;

      const incomingStream = event.streams[0];
      if (incomingStream) {
        incomingStream.getTracks().forEach((track) => {
          if (!remoteStream.getTracks().some((existing) => existing.id === track.id)) {
            remoteStream.addTrack(track);
          }
        });
      } else if (!remoteStream.getTracks().some((existing) => existing.id === event.track.id)) {
        remoteStream.addTrack(event.track);
      }

      void attachRemoteStream(remoteAudioRef.current, remoteStream);
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'connected') {
        setCallStatus('in_call');
        setConnectionError(null);
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
      }

      if (peerConnection.connectionState === 'failed') {
        try {
          peerConnection.restartIce();
        } catch {}
      }

      if (peerConnection.connectionState === 'closed') {
        setCallStatus('ended');
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
        setCallStatus('in_call');
        setConnectionError(null);
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
      }

      if (peerConnection.iceConnectionState === 'failed') {
        try {
          peerConnection.restartIce();
        } catch {}
      }

      if (peerConnection.iceConnectionState === 'closed') {
        setCallStatus('ended');
      }
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        if (!peerConnection.getSenders().some((sender) => sender.track?.id === track.id)) {
          peerConnection.addTrack(track, streamRef.current as MediaStream);
        }
      });
    }
    return peerConnection;
  };

  const leaveCallScreen = () => {
    if (hasNavigatedAwayRef.current) return;
    hasNavigatedAwayRef.current = true;
    closePeerResources(pcRef.current, [streamRef.current, remoteStreamRef.current]);
    pcRef.current = null;
    router.replace(`/dashboard/miyiki-chat/${conversationId}`);
  };

  const finalizeRemoteEnd = () => {
    setCallStatus('ended');
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    closePeerResources(pcRef.current, [streamRef.current, remoteStreamRef.current]);
    pcRef.current = null;

    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      leaveCallScreen();
    }, 900);
  };

  const attachIceHandlers = (callIdToUse: string, role: 'caller' | 'callee') => {
    const peerConnection = ensurePeerConnection();
    const callRef = doc(db, 'calls', callIdToUse);
    const offerCandidates = collection(callRef, 'offerCandidates');
    const answerCandidates = collection(callRef, 'answerCandidates');

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;
      const target = role === 'caller' ? offerCandidates : answerCandidates;
      void addDoc(target, event.candidate.toJSON() as any).catch((error) => console.warn('ICE add failed:', error));
    };

    const listenTo = role === 'caller' ? answerCandidates : offerCandidates;
    const unsubscribe = onSnapshot(listenTo, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        const candidateData: any = change.doc.data();
        if (!candidateData) return;
        void peerConnection.addIceCandidate(new RTCIceCandidate(candidateData)).catch(() => undefined);
      });
    });
    unsubRefs.current.push(unsubscribe);
  };

  const armConnectionTimeout = (callIdToWatch: string) => {
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = setTimeout(async () => {
      if (callStatusRef.current === 'in_call') return;

      const message = hasTurnServerConfigured()
        ? 'Connexion reseau impossible pour cet appel.'
        : 'Connexion impossible a distance: serveur TURN requis.';
      setConnectionError(message);

      try {
        await updateDoc(doc(db, 'calls', callIdToWatch), { status: 'ended', endedAt: serverTimestamp() } as any);
      } catch {}

      finalizeRemoteEnd();
    }, 18000);
  };

  const startOutgoingCall = async () => {
    if (!user?.uid || !contact?.uid || !hasPermission) return;

    setCallStatus('ringing');
    const created = await addDoc(collection(db, 'calls'), {
      conversationId,
      fromUid: user.uid,
      toUid: contact.uid,
      callType: 'audio',
      status: 'ringing',
      createdAt: serverTimestamp(),
    } as CallDoc);

    const newCallId = created.id;
    setCallId(newCallId);
    setConnectionError(null);
    armConnectionTimeout(newCallId);

    const peerConnection = ensurePeerConnection();
    attachIceHandlers(newCallId, 'caller');

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });
    await peerConnection.setLocalDescription(offer);
    await updateDoc(doc(db, 'calls', newCallId), {
      offer: { type: offer.type, sdp: offer.sdp },
    } as any);

    try {
      await addDoc(collection(db, 'users', contact.uid, 'notifications'), {
        type: 'incoming_call',
        title: 'Appel audio',
        message: `${user.displayName || 'Quelqu’un'} vous appelle`,
        actionUrl: `/dashboard/miyiki-chat/audiocall/${conversationId}?callId=${newCallId}`,
        read: false,
        callId: newCallId,
        callType: 'audio',
        conversationId,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
      } as any);
    } catch (error) {
      console.warn('Notif appel (non critique):', error);
    }

    ringTimeoutRef.current = setTimeout(async () => {
      try {
        const callRef = doc(db, 'calls', newCallId);
        const callSnap = await getDoc(callRef);
        if (!callSnap.exists()) return;
        const callData: any = callSnap.data();
        if (callData.status === 'ringing') {
          await updateDoc(callRef, { status: 'missed', endedAt: serverTimestamp() } as any);
        }
      } catch {}
    }, 35000);

    const unsubscribe = onSnapshot(doc(db, 'calls', newCallId), async (snapshot) => {
      if (!snapshot.exists()) return;
      const data: any = snapshot.data();
      const isCaller = Boolean(user?.uid && data.fromUid === user.uid);

      if (data.status === 'accepted' && ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }

      if (data.status === 'ended' || data.status === 'missed') {
        finalizeRemoteEnd();
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
              acceptedAtMs ? 'Appel audio' : 'Appel audio (sans reponse)',
              'call',
              {
                callType: 'audio',
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
          } catch (error) {
            console.warn('Resume appel (non critique):', error);
          }
        }
        return;
      }

      if (data.answer && !peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallStatus('connecting');
      }
      if (data.status === 'accepted') {
        setCallStatus('connecting');
      }
    });
    unsubRefs.current.push(unsubscribe);
  };

  const joinIncomingCall = async (callIdToUse: string) => {
    if (!user?.uid || !hasPermission) return;

    setCallStatus('connecting');
    const peerConnection = ensurePeerConnection();
    attachIceHandlers(callIdToUse, 'callee');
    setConnectionError(null);
    armConnectionTimeout(callIdToUse);

    const callRef = doc(db, 'calls', callIdToUse);
    try {
      await updateDoc(callRef, { receivedAt: serverTimestamp() } as any);
    } catch {}
    const unsubscribe = onSnapshot(callRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const data: any = snapshot.data();
      if (data.status === 'ended' || data.status === 'missed') {
        finalizeRemoteEnd();
        return;
      }
      if (data.offer && !peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await updateDoc(callRef, {
          answer: { type: answer.type, sdp: answer.sdp },
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        } as any);
      }
    });
    unsubRefs.current.push(unsubscribe);
  };

  useEffect(() => {
    if (!hasPermission || !user?.uid || !conversationId) return;
    if (!contact && !isIncoming) return;

    if (isIncoming) {
      if (!incomingCallId || callStatus !== 'init') return;
      void joinIncomingCall(incomingCallId).catch((error) => {
        console.error(error);
        toast({ variant: 'destructive', title: 'Appel impossible', description: "Impossible de rejoindre l'appel." });
        setCallStatus('ended');
      });
      return;
    }

    if (callStatus !== 'init') return;
    void startOutgoingCall().catch((error) => {
      console.error(error);
      toast({ variant: 'destructive', title: 'Appel impossible', description: "Impossible de demarrer l'appel." });
      setCallStatus('ended');
    });
  }, [callStatus, contact, conversationId, hasPermission, incomingCallId, isIncoming, toast, user?.uid]);

  const toggleSpeaker = async () => {
    const audioEl = remoteAudioRef.current as AudioElementWithSink | null;
    if (!audioEl) return;

    if (typeof audioEl.setSinkId !== 'function') {
      toast({
        title: 'Mains libres indisponible',
        description: "Votre appareil ou navigateur ne permet pas encore de changer la sortie audio ici.",
      });
      return;
    }

    try {
      const nextValue = !speakerEnabled;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((device) => device.kind === 'audiooutput');
      const preferredOutput =
        outputs.find((device) => /speaker|haut-parleur/i.test(device.label)) ||
        outputs.find((device) => device.deviceId === 'default') ||
        outputs[0];

      await audioEl.setSinkId(nextValue ? preferredOutput?.deviceId || 'default' : 'default');
      setSpeakerEnabled(nextValue);
    } catch (error) {
      console.error('Erreur activation mains libres:', error);
      toast({
        variant: 'destructive',
        title: 'Mains libres impossible',
        description: "La sortie audio n'a pas pu etre basculee.",
      });
    }
  };

  const handleEndCall = async () => {
    try {
      if (callId) {
        await updateDoc(doc(db, 'calls', callId), { status: 'ended', endedAt: serverTimestamp() } as any);
      }
    } catch {}
    finalizeRemoteEnd();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  return (
    <div className="fixed inset-0 z-[220] flex w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-[#FFA500] text-white">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[min(620px,90vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,165,0,0.45),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/2 h-72 w-[min(720px,92vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(50,187,120,0.55),transparent)] blur-2xl" />

      <div className="z-10 flex flex-col items-center justify-center px-6 text-center">
        <Avatar className="h-40 w-40 border-4 border-white/50 shadow-[0_18px_45px_rgba(0,0,0,0.35)] animate-pulse">
          <AvatarImage src={contact?.avatar} />
          <AvatarFallback>{contact?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <p className="mt-6 font-headline text-3xl font-bold">{contact?.name || 'Appel'}</p>
        {hasPermission && callStatus === 'in_call' ? (
          <p className="mt-2 font-mono text-lg text-white/70">{formatDuration(callDuration)}</p>
        ) : (
          <>
            <p className="mt-2 text-lg text-white/85">
              {hasPermission === false
                ? 'Microphone requis'
                : callStatus === 'ringing'
                  ? 'Sonnerie...'
                  : callStatus === 'connecting'
                    ? 'Connexion...'
                    : callStatus === 'ended'
                      ? 'Termine'
                      : 'Preparation...'}
            </p>
            {connectionError ? <p className="mt-3 max-w-sm text-sm text-red-100/90">{connectionError}</p> : null}
          </>
        )}

        {hasPermission === false && (
          <div className="absolute left-1/2 top-1/2 w-4/5 max-w-sm -translate-x-1/2 -translate-y-1/2">
            <Alert variant="destructive">
              <Phone className="h-4 w-4" />
              <AlertTitle>Microphone requis</AlertTitle>
            </Alert>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/40 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/15 hover:bg-white/25"
          onClick={() => setIsMicMuted((current) => !current)}
          disabled={!hasPermission}
        >
          {isMicMuted ? <MicOff /> : <Mic />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/15 hover:bg-white/25"
          onClick={() => void toggleSpeaker()}
          disabled={!hasPermission || !speakerSupported}
          title={speakerSupported ? 'Mains libres' : 'Mains libres indisponible'}
        >
          {speakerEnabled ? <Volume2 /> : <VolumeX />}
        </Button>
        <Button
          size="icon"
          className="h-20 w-20 scale-110 rounded-full bg-destructive text-destructive-foreground shadow-[0_18px_45px_rgba(220,38,38,0.35)] hover:bg-destructive/90"
          onClick={handleEndCall}
        >
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
}
