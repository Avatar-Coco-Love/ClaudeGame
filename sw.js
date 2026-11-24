// S-38 (D-103): network first, cache fallback, for every same-origin GET. No file list and no build step: each good
// response is copied into `lumen-<VERSION>` (VERSION arrives as ?v= on this script's URL, so a deploy also updates the
// worker), older lumen-* caches are deleted on activate, and an online player always gets the newest files.
const CACHE = 'lumen-' + (new URL(self.location.href).searchParams.get('v') || 'dev');

async function keep(req, res) {
  // Only a same-origin 200 is stored (never an error page, a redirect, an opaque or a cross-origin response).
  if (res && res.status === 200 && res.type === 'basic') await (await caches.open(CACHE)).put(req, res);
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('lumen-') && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

// The page that registered us was fetched before we existed: it sends the URLs it loaded, and we cache them now, so the
// very next visit works offline.
self.addEventListener('message', e => {
  const urls = (e.data && e.data.warm) || [];
  e.waitUntil(Promise.all(urls.filter(u => new URL(u).origin === self.location.origin)
    .map(u => fetch(u, { cache: 'no-cache' }).then(res => keep(u, res)).catch(() => {}))));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // the browser handles it as usual
  e.respondWith(fetch(req).then(res => {
    e.waitUntil(keep(req, res.clone()).catch(() => {}));
    return res;
  }).catch(async () => {
    const hit = await caches.match(req, { cacheName: CACHE });
    if (hit) return hit;
    if (req.mode === 'navigate') { // e.g. a ?seed= link never visited before: the game's own page still opens
      const home = await caches.match(new URL('./', self.registration.scope).href, { cacheName: CACHE });
      if (home) return home;
    }
    return Response.error();
  }));
});
