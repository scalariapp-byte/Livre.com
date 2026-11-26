/* Service worker Livre : app disponible hors ligne. */
const CACHE = 'livre-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigation : réseau d'abord, repli sur l'app en cache (SPA).
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const isCover = /covers\.openlibrary\.org|books\.google|googleusercontent/.test(url.host);
  const isFont = /fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!sameOrigin && !isCover && !isFont) return; // API de recherche : toujours le réseau

  // Ressources statiques et couvertures : cache d'abord, mise à jour en arrière-plan.
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('/'))));
});
