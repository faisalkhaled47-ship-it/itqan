/* إتقان: يحفظ واجهة التطبيق للعمل دون إنترنت. المحتوى والتقدم لا يمران من هنا؛ هما في تخزين الجهاز. */
const CACHE = 'itqan-2026.11.03.7';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('itqan-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // checked with the server every time; with a copy in the cache a slow network falls back to it after a few seconds, without one the network is waited for
    const net = fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then((res) => { if (res && res.ok) cache.put(req, res.clone()).catch(() => {}); return res; });
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    if (!hit) { try { return await net; } catch (err) { return Response.error(); } }
    try { return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))]); }
    catch (err) { net.catch(() => {}); return hit; }
  })());
});
