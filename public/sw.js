// Minimal offline support: cache the offline fallback page at install time,
// and serve it for any navigation that fails because there's no connection.
// This doesn't make the whole app work offline (that would mean precaching
// every hashed build asset) -- it just means "Add to Home Screen" leads
// somewhere on-brand instead of the browser's own offline error page.
const CACHE_NAME = "stellar-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
  }
});
