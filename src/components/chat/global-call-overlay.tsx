'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Phone, PhoneOff, Video } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useCallFeedback } from '@/hooks/useCallFeedback';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type IncomingCallOverlay = {
  id: string;
  conversationId: string;
  callType: 'audio' | 'video';
  fromUid: string;
  fromName: string;
  fromAvatar?: string;
  createdAtMs: number;
};

export function GlobalCallOverlay() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCallOverlay | null>(null);
  const seenCallIdsRef = useRef<Set<string>>(new Set());

  const isOnCallScreen = useMemo(
    () => pathname.includes('/dashboard/miyiki-chat/audiocall/') || pathname.includes('/dashboard/miyiki-chat/call/'),
    [pathname]
  );

  useCallFeedback(Boolean(incomingCall) && !isOnCallScreen, 'incoming', true);

  useEffect(() => {
    if (!user?.uid) {
      setIncomingCall(null);
      return;
    }

    const callsQuery = query(collection(db, 'calls'), where('toUid', '==', user.uid));
    const unsubscribe = onSnapshot(callsQuery, async (snapshot) => {
      const ringingCalls: Array<IncomingCallOverlay | null> = await Promise.all(
        snapshot.docs.map(async (callDoc) => {
          const data: any = callDoc.data() || {};
          if (data.status !== 'ringing') return null;
          if (!data.conversationId || !data.fromUid) return null;

          let fromName = 'Appel entrant';
          let fromAvatar = '';

          try {
            const senderSnap = await getDoc(doc(db, 'users', String(data.fromUid)));
            const senderData: any = senderSnap.exists() ? senderSnap.data() : {};
            fromName =
              senderData?.fullName ||
              senderData?.displayName ||
              senderData?.name ||
              fromName;
            fromAvatar =
              senderData?.profileImage ||
              senderData?.photoURL ||
              senderData?.avatarUrl ||
              senderData?.profilePhotoUrl ||
              '';
          } catch {}

          return {
            id: callDoc.id,
            conversationId: String(data.conversationId),
            callType: data.callType === 'audio' ? 'audio' : 'video',
            fromUid: String(data.fromUid),
            fromName: String(fromName),
            fromAvatar: fromAvatar || undefined,
            createdAtMs: data.createdAt?.toMillis?.() || 0,
          } satisfies IncomingCallOverlay;
        })
      );

      const activeCall = ringingCalls
        .filter((item): item is IncomingCallOverlay => item !== null)
        .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];

      if (!activeCall) {
        setIncomingCall(null);
        return;
      }

      if (!seenCallIdsRef.current.has(activeCall.id)) {
        seenCallIdsRef.current.add(activeCall.id);
        void updateDoc(doc(db, 'calls', activeCall.id), { receivedAt: serverTimestamp() } as any).catch(() => undefined);
      }

      setIncomingCall((prev) => (prev?.id === activeCall.id ? prev : activeCall));
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const acceptCall = () => {
    if (!incomingCall) return;
    const routeBase = incomingCall.callType === 'audio' ? 'audiocall' : 'call';
    setIncomingCall(null);
    router.push(`/dashboard/miyiki-chat/${routeBase}/${incomingCall.conversationId}?callId=${incomingCall.id}`);
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    const callId = incomingCall.id;
    setIncomingCall(null);
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'missed',
        endedAt: serverTimestamp(),
      } as any);
    } catch {}
  };

  if (!incomingCall || isOnCallScreen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[250] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(50,187,120,0.35),transparent_35%),linear-gradient(180deg,#03140d_0%,#072b1b_34%,#0b1b14_100%)] text-white">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[min(720px,95vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,165,0,0.32),transparent)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-[min(920px,110vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(50,187,120,0.28),transparent)] blur-3xl" />

      <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 pb-12 pt-16 text-center sm:pt-20">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.34em] text-white/60">Appel entrant</p>
          <div className="mx-auto flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/75">
            {incomingCall.callType === 'audio' ? 'Audio en direct' : 'Video en direct'}
          </div>
        </div>

        <div className="space-y-5">
          <div className="relative mx-auto">
            <div className="absolute inset-0 rounded-full border border-white/10 animate-ping" />
            <Avatar className="relative mx-auto h-32 w-32 border-[5px] border-white/30 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:h-40 sm:w-40">
              <AvatarImage src={incomingCall.fromAvatar} alt={incomingCall.fromName} />
              <AvatarFallback className="bg-white/10 text-4xl text-white">
                {incomingCall.fromName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{incomingCall.fromName}</h2>
            <p className="mt-2 text-base text-white/72">Souhaite vous joindre maintenant</p>
          </div>
        </div>

        <div className="w-full max-w-md space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="ghost"
              className="h-16 rounded-[1.5rem] border border-red-300/20 bg-red-500/90 text-white hover:bg-red-500"
              onClick={() => void declineCall()}
            >
              <PhoneOff className="mr-3 h-5 w-5" />
              Refuser
            </Button>
            <Button
              className="h-16 rounded-[1.5rem] bg-white text-primary hover:bg-white/90"
              onClick={acceptCall}
            >
              {incomingCall.callType === 'audio' ? <Phone className="mr-3 h-5 w-5" /> : <Video className="mr-3 h-5 w-5" />}
              Decrocher
            </Button>
          </div>
          <p className="text-xs text-white/45">eNkamba Miyiki Call</p>
        </div>
      </div>
    </div>
  );
}
