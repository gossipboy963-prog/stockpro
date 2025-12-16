const CACHE_NAME = 'zentrade-cache-v1';

// Install event - cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Basic caching for offline capability
      // Note: In a real Vite build, assets have hashed names. 
      // This simple strategy ensures the root HTML is cached.
      return cache.addAll([
        '/',
        '/index.html'
      ]).catch(err => console.error('Cache addAll failed', err));
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Only handle http/https requests
  if (!event.request.url.startsWith('http')) return;

  // 1. DYNAMIC DATA STRATEGY: Network Only (Do NOT cache)
  // We explicitly exclude API calls (corsproxy, yahoo, or any cache-busting params)
  // to prevent cache bloat and ensure fresh data.
  if (
    event.request.url.includes('corsproxy.io') || 
    event.request.url.includes('yahoo.com') ||
    event.request.url.includes('t=') // Timestamped requests
  ) {
    return; // Return nothing = let the browser perform a standard network fetch without SW interference
  }

  // 2. APP SHELL STRATEGY: Stale-While-Revalidate or Network First falling back to Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful response, clone and cache it
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // If network fails, try cache (Offline mode)
        return caches.match(event.request);
      })
  );
});