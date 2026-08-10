import { useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { app, functions } from '@/lib/firebase';
import { useAuth } from './useAuth';

type PushPlatform = 'web' | 'android' | 'ios';

const savePushTokenFn = httpsCallable(functions, 'savePushToken');

declare global {
  interface Window {
    eNkambaNativePush?: {
      isAvailable?: () => boolean;
      getToken?: (requestId: string) => void;
    };
    __eNkambaNativePushTokenResolve?: (
      requestId: string,
      payload: { success?: boolean; token?: string; error?: string }
    ) => void;
  }
}

async function saveToken(token: string, platform: PushPlatform) {
  if (!token) return;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await savePushTokenFn({ token, platform });
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => window.setTimeout(resolve, attempt * 900));
    }
  }
  console.error('Erreur enregistrement token push:', lastError);
}

async function setupWebPush() {
  if (typeof window === 'undefined') return () => {};
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return () => {};

  const [{ isSupported, getMessaging, getToken, onMessage }] = await Promise.all([
    import('firebase/messaging'),
    navigator.serviceWorker.register('/firebase-messaging-sw.js'),
  ]);

  const supported = await isSupported();
  if (!supported) return () => {};

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return () => {};

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('NEXT_PUBLIC_FIREBASE_VAPID_KEY manquant: push web désactivé');
    return () => {};
  }

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await saveToken(token, 'web');
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    if (Notification.permission !== 'granted') return;
    const title = payload.notification?.title || 'eNkamba';
    const body = payload.notification?.body || 'Nouvelle notification';
    const data = payload.data || {};
    const actionUrl = data.actionUrl || '/dashboard';
    const isCallNotification = data.type === 'incoming_call';
    const callId = data.callId || '';
    type RichNotificationOptions = NotificationOptions & {
      actions?: Array<{ action: string; title: string }>;
      renotify?: boolean;
      vibrate?: number[];
    };
    const notificationOptions: RichNotificationOptions = {
      body,
      icon: '/enkamba-logo.png',
      badge: '/favicon.png',
      data,
      tag: isCallNotification && callId ? `enkamba-call-${callId}` : actionUrl,
      renotify: isCallNotification,
      requireInteraction: isCallNotification,
      vibrate: isCallNotification ? [300, 150, 300, 150, 300] : [180, 80, 180],
      actions: isCallNotification
        ? [
            { action: 'answer', title: 'Répondre' },
            { action: 'decline', title: 'Refuser' },
          ]
        : undefined,
    };
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      window.focus();
      if (isCallNotification && actionUrl) {
        const separator = actionUrl.includes('?') ? '&' : '?';
        window.location.href = `${actionUrl}${separator}webAccepted=1`;
      } else if (actionUrl) {
        window.location.href = actionUrl;
      }
      notification.close();
    };
  });

  return () => unsubscribe();
}

async function setupNativePush() {
  if (typeof window === 'undefined') return () => {};
  const [{ Capacitor }, { PushNotifications }] = await Promise.all([
    import('@capacitor/core'),
    import('@capacitor/push-notifications'),
  ]);

  if (!Capacitor.isNativePlatform()) return () => {};

  await PushNotifications.createChannel({
    id: 'enkamba_general',
    name: 'eNkamba Général',
    description: 'Notifications eNkamba',
    importance: 5,
    visibility: 1,
    vibration: true,
  }).catch(() => undefined);

  await PushNotifications.createChannel({
    id: 'enkamba_calls',
    name: 'eNkamba Appels',
    description: 'Appels audio et vidéo entrants',
    importance: 5,
    visibility: 1,
    vibration: true,
    sound: 'default',
  }).catch(() => undefined);

  PushNotifications.addListener('registration', async (token) => {
    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    await saveToken(token.value, platform);
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Erreur enregistrement push natif:', error);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const actionUrl = (event.notification?.data as { actionUrl?: string } | undefined)?.actionUrl;
    if (actionUrl && typeof window !== 'undefined') {
      window.location.href = actionUrl;
    }
  });

  const permStatus = await PushNotifications.requestPermissions();
  if (permStatus.receive === 'granted') {
    await PushNotifications.register();
  }

  return async () => {
    await PushNotifications.removeAllListeners();
  };
}

async function setupTauriAndroidPush() {
  if (typeof window === 'undefined') return null;
  const bridge = window.eNkambaNativePush;
  if (!bridge?.getToken || bridge.isAvailable?.() === false) return null;
  const requestNativeToken = bridge.getToken.bind(bridge);

  const requestId = `push-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const token = await new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      if (window.__eNkambaNativePushTokenResolve === resolver) {
        delete window.__eNkambaNativePushTokenResolve;
      }
      reject(new Error('Token push natif expire.'));
    }, 15000);

    const previousResolver = window.__eNkambaNativePushTokenResolve;
    const resolver = (responseRequestId: string, payload: { success?: boolean; token?: string; error?: string }) => {
      if (responseRequestId !== requestId) {
        previousResolver?.(responseRequestId, payload);
        return;
      }

      window.clearTimeout(timeout);
      if (previousResolver) {
        window.__eNkambaNativePushTokenResolve = previousResolver;
      } else {
        delete window.__eNkambaNativePushTokenResolve;
      }

      if (payload.success && payload.token) {
        resolve(payload.token);
      } else {
        reject(new Error(payload.error || 'Token push natif indisponible.'));
      }
    };

    window.__eNkambaNativePushTokenResolve = resolver;
    requestNativeToken(requestId);
  });

  await saveToken(token, 'android');
  return () => {};
}

export function usePushNotifications() {
  const { user } = useAuth();
  const initializedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || initializedUserRef.current === user.uid) return;
    initializedUserRef.current = user.uid;

    let cleanup: undefined | (() => void | Promise<void>);
    (async () => {
      const tauriCleanup = await setupTauriAndroidPush();
      if (tauriCleanup) {
        cleanup = tauriCleanup;
        return;
      }

      const isNative = Boolean((window as any)?.Capacitor?.isNativePlatform?.());
      cleanup = isNative ? await setupNativePush() : await setupWebPush();
    })().catch((error) => {
      initializedUserRef.current = null;
      console.error('Initialisation push échouée:', error);
    });

    return () => {
      if (cleanup) {
        void cleanup();
      }
    };
  }, [user]);
}
