import { useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { app, functions } from '@/lib/firebase';
import { useAuth } from './useAuth';

type PushPlatform = 'web' | 'android' | 'ios';

const savePushTokenFn = httpsCallable(functions, 'savePushToken');

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
    new Notification(title, {
      body,
      icon: '/enkamba-logo.png',
      badge: '/favicon.png',
      data: payload.data || {},
    });
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

export function usePushNotifications() {
  const { user } = useAuth();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;

    let cleanup: undefined | (() => void | Promise<void>);
    (async () => {
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
