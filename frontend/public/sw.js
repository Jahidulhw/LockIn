// LockIn Service Worker — cache-first for static assets, network-first for API
const CACHE = 'lockin-assets-v1';

const STATIC_PATTERNS = [
  /\.(?:js|css|woff2?|ttf|otf|svg|png|ico|webp)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Never cache API or auth calls — always go to network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Cache-first for static assets and fonts
  if (STATIC_PATTERNS.some((p) => p.test(url.href))) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // HTML navigation — network-first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
  }
});
