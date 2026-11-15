// ShowReady service worker: lets the installed app open, and shows the last copy of a page when offline.
// Always tries the internet first, so updates appear straight away. Never stores sign-in or account data.
var CACHE = 'showready-v2';
var CORE = ['/', '/app/', '/suppliers/', '/settings.json', '/icon-192.png', '/favicon.svg'];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  // Keep a first copy of the main pages so the installed app opens even without a signal.
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); })); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Supabase, fonts and the rest go straight to the internet
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
      return hit || new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ShowReady: offline</title><body style="font-family:system-ui,sans-serif;padding:24px;color:#15231C;background:#F3F5F0"><h1 style="font-size:22px">You’re offline</h1><p>ShowReady needs the internet to open this page for the first time. Check your connection and try again.</p></body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    });
  }));
});
