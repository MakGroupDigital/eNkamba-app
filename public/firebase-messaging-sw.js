/* eslint-disable no-undef */
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
