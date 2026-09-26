const CACHE_NAME = "acting-entrance-studio-shell-v6-poster-journal";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./daily.css",
  "./cinema.css?v=20260927",
  "./poster-theme.css?v=20260927-poster",
  "./fonts/cormorant-roman-latin.woff2",
  "./fonts/cormorant-roman-latin-ext.woff2",
  "./fonts/cormorant-italic-latin.woff2",
  "./fonts/cormorant-italic-latin-ext.woff2",
  "./fonts/dm-sans-latin.woff2",
  "./fonts/dm-sans-latin-ext.woff2",
  "./fonts/Cormorant-OFL.txt",
  "./fonts/DM-Sans-OFL.txt",
  "./seed-data.js?v=20260927",
  "./cinema-data.js?v=20260927",
  "./bucket-data.js?v=20260927",
  "./INTERNATIONAL_CINEMA_COURSE.md",
  "./MOVIE_BUCKET_LIST.md",
  "./DESIGN_NOTES.md",
  "./app.js?v=20260927-poster",
  "./cloud.bundle.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icons/studio-journal.svg",
  "./icons/studio-journal-192.png",
  "./icons/studio-journal-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("acting-entrance-studio-shell-") && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return caches.match("./index.html");
      return Response.error();
    }
  })());
});
