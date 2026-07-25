const CACHE_VERSION = "v1.0.0-1784988716402";
const STATIC_CACHE = `cardflow-static-${CACHE_VERSION}`;
const PAGE_CACHE = `cardflow-pages-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/offline",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  // Bypass cache completely for all API and authentication requests
  // Do NOT cache: /server/*, /api/*, /server/auth/*, /api/auth/*
  if (
    url.pathname.startsWith("/server/") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Bypass SW cache for authentication routes to ensure direct URL navigation and refresh work fresh
  if (
    url.pathname === "/login" ||
    url.pathname === "/forgot-password" ||
    url.pathname === "/setup-password" ||
    url.pathname.startsWith("/auth/")
  ) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static Assets Cache-First Strategy
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".ttf")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Document navigation Network-First Strategy
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (err) {
    return fetch(request);
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const offlinePage = await caches.match("/offline");
    return (
      offlinePage ||
      new Response("You are offline.", {
        status: 503,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    );
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
