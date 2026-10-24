// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAVP0wrWoP_w3gr2DNrNcLEjWuvebrW2W8",
  authDomain: "event-management-system-96a62.firebaseapp.com",
  projectId: "event-management-system-96a62",
  storageBucket: "event-management-system-96a62.firebasestorage.app",
  messagingSenderId: "753212983637",
  appId: "1:753212983637:web:36388d5d0ce6e82a90c7dc"
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification ? payload.notification.title : 'New Notification';
  const notificationOptions = {
    body: payload.notification ? payload.notification.body : '',
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
