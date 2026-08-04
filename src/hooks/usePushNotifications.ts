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
  try {
    await savePushTokenFn({ token, platform });
  } catch (error) {
    console.error('Erreur enregistrement token push:', error);
  }
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
    const isCallNotification = payload.data?.type === 'incoming_call';
    const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
      body,
      icon: '/enkamba-logo.png',
      badge: '/favicon.png',
      data: payload.data || {},
      requireInteraction: isCallNotification,
      vibrate: isCallNotification ? [300, 150, 300, 150, 300] : undefined,
    };
    new Notification(title, notificationOptions);
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
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;

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
      console.error('Initialisation push échouée:', error);
    });

    return () => {
      if (cleanup) {
        void cleanup();
      }
    };
  }, [user]);
}
