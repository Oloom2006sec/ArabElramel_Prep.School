const CACHE_NAME = 'arab-elramel-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/results.html',
  '/about.html',
  '/contact.html',
  '/news.html',
  '/style.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
