const CACHE_NAME = 'mas-v2';
const ASSETS = ['./', './index.html', './manifest.json'];
const MARKED = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) =>
      Promise.all([c.addAll(ASSETS), c.add(MARKED).catch(() => {})])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the app's own files so updates show immediately; cache is the offline fallback.
// The pinned marked.js library is cached so the app still renders reports offline.
// Other cross-origin calls (OpenRouter, r.jina.ai, fonts) are never intercepted.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && req.url !== MARKED) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
