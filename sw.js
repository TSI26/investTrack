const CACHE_NAME = 'portfolio-tracker-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/config.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install: cache core assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', function(event) {
  // Don't intercept Supabase or Yahoo Finance calls
  var url = event.request.url;
  if (url.includes('supabase.co') || url.includes('workers.dev') || url.includes('yahoo')) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Cache successful GET responses for local assets
      if (event.request.method === 'GET' && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Offline: serve from cache
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('/index.html');
      });
    })
  );
});
