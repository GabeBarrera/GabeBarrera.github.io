// ── PWNYXPRESS Service Worker ──
// Bump CACHE_VERSION after every deploy to trigger client update detection.
const CACHE_VERSION = 'v1';
const CACHE_NAME    = 'pwnyxpress-' + CACHE_VERSION;

const PAGES = [
  '/',
  '/index.html',
  '/budget.html',
  '/tracker.html',
  '/camera.html',
  '/budget-hero.html',
  '/budget-tracker.html',
  '/budget-helper.html',
  '/logger.html',
  '/tic-tac-toe.html',
  '/travel-data.html',
  '/classifier.html',
  '/404.html',
];

// ── Install: cache all pages ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PAGES))
  );
});

// ── Activate: remove stale caches, claim all clients ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for same-origin HTML, pass-through for everything else ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // don't intercept CDN/fonts
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

// ── Message: skip waiting so new SW activates immediately ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
