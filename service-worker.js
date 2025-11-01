const CACHE_NAME = 'service-l90-cache-v1';
const FILES = ['./','./index.html','./styles.css','./app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', evt => { evt.waitUntil(caches.open(CACHE_NAME).then(cache=> cache.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', evt => { self.clients.claim(); });
self.addEventListener('fetch', evt => { evt.respondWith(caches.match(evt.request).then(resp => resp || fetch(evt.request))); });