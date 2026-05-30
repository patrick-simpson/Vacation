/* service-worker.js — offline caching so the app keeps working through the
 * 401's cellular dead zones. Cache-first for all app shell assets. */

var CACHE = 'storybook401-v1';
var ASSETS = [
  './',
  'index.html',
  'map.html',
  'game.html',
  'recap.html',
  'manifest.json',
  'css/style.css',
  'js/content.js',
  'js/storage.js',
  'js/players.js',
  'js/settings.js',
  'js/app.js',
  'js/recap.js',
  'icons/icon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        // Cache successful same-origin responses for next time.
        if (response && response.status === 200 && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function () {
        // Offline navigation fallback to the cover page.
        if (event.request.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});
