/* eslint-disable no-undef */
const KENZ_CACHE = 'kenz-app-cache-v2';
const KENZ_STATIC_CACHE = 'kenz-static-cache-v2';
const IS_LOCAL_DEVELOPMENT = ['localhost', '127.0.0.1', '::1'].includes(self.location.hostname);
const APP_SHELL_URLS = [
  '/',
  '/dashboard/miyiki-chat',
  '/dashboard/miyiki-chat/new',
  '/dashboard/mbongo-dashboard',
  '/dashboard/wallet',
  '/dashboard/pay-receive',
  '/dashboard/scanner-simple',
  '/dashboard/nkampa',
  '/dashboard/nkampa/orders',
  '/dashboard/ugavi',
  '/dashboard/makutano',
  '/dashboard/ai/chat',
  '/dashboard/settings',
  '/kenz-logo.png',
  '/favicon.png',
  '/site.webmanifest',
];

importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDRhWbrpB1Ss4njot7GYO-CZdkvJtZXGyI',
  authDomain: 'studio-1153706651-6032b.firebaseapp.com',
  projectId: 'studio-1153706651-6032b',
  storageBucket: 'studio-1153706651-6032b.firebasestorage.app',
  messagingSenderId: '60114170881',
  appId: '1:60114170881:web:7805087264e18745ef3c00',
});

const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
  if (IS_LOCAL_DEVELOPMENT) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches
      .open(KENZ_STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => (key.startsWith('enkamba-') || key.startsWith('kenz-')) && key !== KENZ_CACHE && key !== KENZ_STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') return response;
  const cache = await caches.open(KENZ_CACHE);
  await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  // Le serveur de développement doit toujours fournir le HTML et les bundles récents.
  if (IS_LOCAL_DEVELOPMENT) return;

  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(async () => {
          const cache = await caches.open(KENZ_CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match('/dashboard/miyiki-chat')) ||
            (await caches.match('/dashboard/miyiki-chat')) ||
            (await caches.match('/')) ||
            Response.error()
          );
        })
    );
    return;
  }

  if (
    url.pathname.startsWith('/_next/') ||
    /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|json|webmanifest)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => cacheResponse(request, response))
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Kenz';
  const body = payload.notification?.body || 'Nouvelle notification';
  const actionUrl = payload?.data?.actionUrl || '/dashboard';
  const isCall = payload?.data?.type === 'incoming_call';
  const callId = payload?.data?.callId || '';
  const conversationId = payload?.data?.conversationId || '';
  const callType = payload?.data?.callType || '';

  self.registration.showNotification(title, {
    body,
    icon: '/kenz-logo.png',
    badge: '/favicon.png',
    tag: isCall && callId ? `kenz-call-${callId}` : payload?.data?.notificationId || actionUrl,
    renotify: isCall,
    requireInteraction: isCall,
    vibrate: isCall ? [300, 150, 300, 150, 300] : [180, 80, 180],
    actions: isCall
      ? [
          { action: 'answer', title: 'Répondre' },
          { action: 'decline', title: 'Refuser' },
        ]
      : [{ action: 'open', title: 'Ouvrir' }],
    data: { ...(payload?.data || {}), actionUrl, callId, conversationId, callType },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification?.data || {};
  const actionUrl = data.actionUrl || '/dashboard';
  const isCall = data.type === 'incoming_call';

  let targetUrl = actionUrl;
  if (isCall && event.action !== 'decline') {
    const separator = actionUrl.includes('?') ? '&' : '?';
    targetUrl = `${actionUrl}${separator}webAccepted=1`;
  }

  if (isCall && event.action === 'decline' && data.callId) {
    const params = new URLSearchParams({
      action: 'decline',
      callId: data.callId,
      conversationId: data.conversationId || '',
      callType: data.callType || '',
    });
    targetUrl = `/dashboard/miyiki-chat/call-action?${params.toString()}`;
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const absoluteTarget = new URL(targetUrl, self.location.origin).href;
        for (const client of clientList) {
          if ('focus' in client && new URL(client.url).origin === self.location.origin) {
            if ('navigate' in client && client.url !== absoluteTarget) {
              return client.navigate(absoluteTarget).then((navigatedClient) => navigatedClient?.focus());
            }
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});
