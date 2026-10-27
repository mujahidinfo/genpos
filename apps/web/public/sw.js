/*
 * GenPOS service worker.
 *
 * Deliberately conservative. This app shows per-user financial data behind a
 * session cookie, so the cache is limited to versioned build output and static
 * assets. It never caches:
 *   - anything under /api (tRPC — includes sales, customers, finance)
 *   - non-GET requests
 *   - authenticated HTML pages (they differ per user; caching them on a shared
 *     till device would leak one cashier's screen to the next)
 *
 * Its job is installability + fast repeat loads of the shell, plus a friendly
 * offline page — not offline selling.
 */

const VERSION = "v1";
const STATIC_CACHE = `genpos-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("genpos-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Immutable, non-sensitive build output that is safe to serve from cache. */
function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only same-origin GETs are ever touched.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API traffic always goes to the network — never cached, never intercepted.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, with the offline page as the only fallback.
  // We do not cache the response, since page HTML is user-specific.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Static assets: cache-first, then fill the cache in the background.
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});

// Lets the page tell a waiting worker to take over immediately.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
