/* Mendez Driver — Service Worker */
const CACHE = 'mendez-driver-v2';
const SHELL = [
  '/driver.html',
  '/css/base.css',
  '/css/driver.css',
  '/js/driver.js',
  '/manifest.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  /* API calls: network first, no cache */
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }
  /* Shell assets: cache first, fallback network */
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request).then(function (res) {
        return caches.open(CACHE).then(function (c) {
          c.put(e.request, res.clone());
          return res;
        });
      });
    })
  );
});
