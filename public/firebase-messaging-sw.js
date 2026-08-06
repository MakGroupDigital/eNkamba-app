/* eslint-disable no-undef */
const ENKAMBA_CACHE = 'enkamba-app-cache-v1';
const ENKAMBA_STATIC_CACHE = 'enkamba-static-cache-v1';
const APP_SHELL_URLS = [
  '/',
  '/dashboard/miyiki-chat',
  '/dashboard/mbongo-dashboard',
  '/dashboard/nkampa',
  '/dashboard/ugavi',
  '/dashboard/makutano',
  '/dashboard/ai/chat',
  '/enkamba-logo.png',
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
  event.waitUntil(
    caches
      .open(ENKAMBA_STATIC_CACHE)
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
            .filter((key) => key.startsWith('enkamba-') && key !== ENKAMBA_CACHE && key !== ENKAMBA_STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') return response;
  const cache = await caches.open(ENKAMBA_CACHE);
  await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
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
          const cache = await caches.open(ENKAMBA_CACHE);
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
  const title = payload.notification?.title || 'eNkamba';
  const body = payload.notification?.body || 'Nouvelle notification';
  const actionUrl = payload?.data?.actionUrl || '/dashboard';

  self.registration.showNotification(title, {
    body,
    icon: '/enkamba-logo.png',
    badge: '/favicon.png',
    data: { actionUrl },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const actionUrl = event.notification?.data?.actionUrl || '/dashboard';
  event.waitUntil(clients.openWindow(actionUrl));
});
