// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJRQD-lwgNOxlAI-8t-6kuPa9Z8Dxa4v8",
    authDomain: "engineering-hub-3045c.firebaseapp.com",
    projectId: "engineering-hub-3045c",
    storageBucket: "engineering-hub-3045c.firebasestorage.app",
    messagingSenderId: "926550146915",
    appId: "1:926550146915:web:eea3796edf2cab4bc29d56",
    measurementId: "G-SHW0R2QQSP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Caching Logic
const CACHE_NAME = 'enghub-cache-v13';
const urlsToCache = [
  '/',
  '/index.html',
  '/log.jpg',
  '/manifest.json',
  '/static/css/main.[HASH].css',
  '/static/js/main.[HASH].js',
  // Add other assets you want to cache
];

// Install Event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching assets');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache assets during install:', error);
      })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request)
      .then((response) => response || fetch(request))
      .catch(() => caches.match('/index.html'))
  );
});

// Handle Background Messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/log.jpg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://engineeringhub.engineer')
  );
});