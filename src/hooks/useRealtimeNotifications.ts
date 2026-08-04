'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { enkambaRealtime, getRealtimeUrl, type RealtimeStatus } from '@/lib/realtime-client';
import { useToast } from '@/hooks/use-toast';

function getAppFromPath(pathname: string) {
  if (pathname.includes('/miyiki-chat')) return 'Chat';
  if (pathname.includes('/nkampa')) return 'Marché';
  if (pathname.includes('/ugavi')) return 'Logistique';
  if (pathname.includes('/mbongo') || pathname.includes('/wallet') || pathname.includes('/pay-receive')) return 'Paiement';
  if (pathname.includes('/makutano')) return 'Réseau';
  if (pathname.includes('/ai')) return 'eNkamba AI';
  if (pathname.includes('/admin')) return 'Admin';
  return 'eNkamba';
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const pathname = usePathname() || '';
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<RealtimeStatus>('disabled');

  const userPayload = useMemo(() => {
    if (!user?.uid) return null;
    return {
      uid: user.uid,
      name: user.displayName || user.email || 'Utilisateur',
      avatar: user.photoURL || '',
      app: getAppFromPath(pathname),
      path: pathname,
    };
  }, [pathname, user?.displayName, user?.email, user?.photoURL, user?.uid]);

  useEffect(() => {
    enkambaRealtime.configure(getRealtimeUrl());
    return enkambaRealtime.onStatus(setStatus);
  }, []);

  useEffect(() => {
    if (!userPayload) {
      enkambaRealtime.disconnect();
      return;
    }

    enkambaRealtime.connect(userPayload);
    enkambaRealtime.send('presence:ping', {
      app: userPayload.app,
      path: userPayload.path,
    });

    const interval = window.setInterval(() => {
      enkambaRealtime.send('presence:ping', {
        app: userPayload.app,
        path: userPayload.path,
      });
    }, 20000);

    return () => window.clearInterval(interval);
  }, [userPayload]);

  useEffect(() => {
    const unsubscribeNotification = enkambaRealtime.subscribe('notification:realtime', (payload) => {
      const title = String(payload.title || 'eNkamba');
      const message = String(payload.message || 'Nouvelle notification');
      const actionUrl = String(payload.actionUrl || '');

      toast({
        title,
        description: message,
        action: actionUrl
          ? {
              altText: 'Ouvrir',
              onClick: () => router.push(actionUrl),
              children: 'Ouvrir',
            } as any
          : undefined,
      });
    });

    const unsubscribeCall = enkambaRealtime.subscribe('call:ringing', (payload) => {
      const callType = payload.callType === 'audio' ? 'audio' : 'vidéo';
      const actionUrl = String(payload.actionUrl || '');
      toast({
        title: `Appel ${callType}`,
        description: `${String(payload.fromName || 'Un contact')} vous appelle`,
        action: actionUrl
          ? {
              altText: 'Répondre',
              onClick: () => router.push(actionUrl),
              children: 'Répondre',
            } as any
          : undefined,
      });
    });

    return () => {
      unsubscribeNotification();
      unsubscribeCall();
    };
  }, [router, toast]);

  return { status };
}
