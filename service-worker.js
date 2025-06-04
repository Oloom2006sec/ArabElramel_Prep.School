const CACHE_NAME = 'v1';

const urlsToCache = [
  'index.html',
  'style.css',
  'manifest.json',
  'results.html',
  'contact.html',
  'about.html',
  'news.html',
  'icon-192.png',
  'icon-512.png'
];

// تثبيت الكاش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// تفعيل الكاش
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
