const CACHE_NAME = 'ffxiv-timers-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/app.css',
  '/src/App.svelte',
  '/alarm-clock.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
