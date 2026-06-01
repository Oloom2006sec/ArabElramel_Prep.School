const CACHE_NAME = 'arab-elramel-v6';
const urlsToCache = [
  'index.html',
  'results.html',
  'certificate.html',
  'certificate.css',
  'certificate.js',
  'about.html',
  'contact.html',
  'news.html',
  'attendance.html',
  'admin-attendance.html',
  'attendance-system.js',
  'top students.html',
  'style.css',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'images/logo.jpg',
  'images/hero-panorama.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
