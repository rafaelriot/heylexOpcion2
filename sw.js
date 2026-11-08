// HEYLEX PWA Service Worker (sw.js)
const CACHE_NAME = 'heylex-pwa-v5';

const STATIC_ASSETS = [
  './',
  'index.html',
  'admin.html',
  'manifest.json',
  'api.js',
  'portal.js',
  'admin.js',
  'ui-dialogs.js',
  'qrcode.min.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable.png',
  'icons/apple-touch-icon.png',
  'icons/icon.svg'
];

// Install: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: No se pudieron cachear algunos recursos iniciales:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network First, fallback to cache
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Do not cache API endpoints or external POST requests
  if (req.method !== 'GET' || req.url.includes('/backend/api.php') || req.url.includes('api.heylex.mx')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Cache successful response
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') {
            return caches.match('index.html');
          }
        });
      })
  );
});

