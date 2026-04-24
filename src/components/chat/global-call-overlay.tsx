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
    <div className="fixed inset-0 z-[250] flex items-start justify-center bg-black/35 px-4 pt-8 backdrop-blur-[2px] sm:items-center sm:pt-0">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br from-primary via-emerald-700 to-orange-500 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="bg-black/15 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">Appel entrant</p>
        </div>
        <div className="px-6 pb-6 pt-4 text-center">
          <Avatar className="mx-auto h-24 w-24 border-4 border-white/35 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
            <AvatarImage src={incomingCall.fromAvatar} alt={incomingCall.fromName} />
            <AvatarFallback className="bg-white/15 text-2xl text-white">
              {incomingCall.fromName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-4 text-2xl font-bold">{incomingCall.fromName}</h2>
          <p className="mt-1 text-sm text-white/80">
            Appel {incomingCall.callType === 'audio' ? 'audio' : 'video'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 rounded-full bg-red-500 text-white hover:bg-red-500/90"
              onClick={() => void declineCall()}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-white text-primary hover:bg-white/90"
              onClick={acceptCall}
            >
              {incomingCall.callType === 'audio' ? <Phone className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
