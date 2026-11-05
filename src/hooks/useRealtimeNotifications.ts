'use client';

import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { enkambaRealtime, getRealtimeUrl, type RealtimeStatus } from '@/lib/realtime-client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction, type ToastActionElement } from '@/components/ui/toast';

function getAppFromPath(pathname: string) {
  if (pathname.includes('/miyiki-chat')) return 'Chat';
  if (pathname.includes('/nkampa')) return 'Marché';
  if (pathname.includes('/ugavi')) return 'Logistique';
  if (pathname.includes('/mbongo') || pathname.includes('/wallet') || pathname.includes('/pay-receive')) return 'Paiement';
  if (pathname.includes('/makutano')) return 'Réseau';
  if (pathname.includes('/ai')) return 'Kenz AI';
  if (pathname.includes('/admin')) return 'Admin';
  return 'Kenz';
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const pathname = usePathname() || '';
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<RealtimeStatus>('disabled');
  const displayedNotificationsRef = useRef<Set<string>>(new Set());

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
    const shouldDisplay = (payload: Record<string, unknown>, fallbackKey: string) => {
      const notificationId = String(payload.notificationId || fallbackKey);
      if (displayedNotificationsRef.current.has(notificationId)) return false;
      displayedNotificationsRef.current.add(notificationId);
      if (displayedNotificationsRef.current.size > 80) {
        displayedNotificationsRef.current = new Set(Array.from(displayedNotificationsRef.current).slice(-40));
      }
      return true;
    };

    const showSystemNotification = (
      title: string,
      message: string,
      actionUrl: string,
      isCall = false,
      notificationId = ''
    ) => {
      if (typeof window === 'undefined') return;
      if (document.visibilityState === 'visible') return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const targetUrl = isCall && actionUrl ? `${actionUrl}${actionUrl.includes('?') ? '&' : '?'}webAccepted=1` : actionUrl;
      const notification = new Notification(title, {
        body: message,
        icon: '/kenz-logo.png',
        badge: '/favicon.png',
        tag: notificationId || actionUrl || title,
        renotify: isCall,
        requireInteraction: isCall,
        data: { actionUrl: targetUrl },
        vibrate: isCall ? [300, 150, 300, 150, 300] : [180, 80, 180],
      } as NotificationOptions & { renotify?: boolean; requireInteraction?: boolean; vibrate?: number[] });
      notification.onclick = () => {
        window.focus();
        if (targetUrl) router.push(targetUrl);
        notification.close();
      };
    };

    const unsubscribeNotification = enkambaRealtime.subscribe('notification:realtime', (payload) => {
      const title = String(payload.title || 'Kenz');
      const message = String(payload.message || 'Nouvelle notification');
      const actionUrl = String(payload.actionUrl || '');
      if (!shouldDisplay(payload, `${title}:${message}:${actionUrl}`)) return;

      toast({
        title,
        description: message,
        action: actionUrl
          ? (createElement(ToastAction, { altText: 'Ouvrir', onClick: () => router.push(actionUrl) }, 'Ouvrir') as unknown as ToastActionElement)
          : undefined,
      });
      showSystemNotification(title, message, actionUrl, false, String(payload.notificationId || ''));
    });

    const unsubscribeCall = enkambaRealtime.subscribe('call:ringing', (payload) => {
      const callType = payload.callType === 'audio' ? 'audio' : 'vidéo';
      const actionUrl = String(payload.actionUrl || '');
      const title = `Appel ${callType}`;
      const message = `${String(payload.fromName || 'Un contact')} vous appelle`;
      if (!shouldDisplay(payload, `call:${String(payload.callId || actionUrl)}`)) return;

      toast({
        title,
        description: message,
        action: actionUrl
          ? (createElement(ToastAction, { altText: 'Répondre', onClick: () => router.push(actionUrl) }, 'Répondre') as unknown as ToastActionElement)
          : undefined,
      });
      showSystemNotification(title, message, actionUrl, true, String(payload.callId || ''));
    });

    return () => {
      unsubscribeNotification();
      unsubscribeCall();
    };
  }, [router, toast]);

  return { status };
}
