// Bump this version on each deploy to refresh the cached app shell.
const CACHE = "my-planner-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  // No auto-skipWaiting: a new version waits until the page's "Refresh" toast
  // (or all tabs close), so we never swap code out from under an open tab.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

// The page tells us to activate now when the user taps "Refresh".
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Cross-origin (weather + MVG APIs, fonts) → straight to network.
  if (url.origin !== location.origin) return;

  // Page navigations → network-first so deploys show immediately, fall back
  // to cache when offline.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Static same-origin assets → cache-first.
  e.respondWith(caches.match(e.request).then((c) => c || fetch(e.request)));
});
