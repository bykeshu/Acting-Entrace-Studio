const CACHE_NAME = "acting-entrance-studio-shell-v7-cinema-poster";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./daily.css",
  "./cinema.css?v=20260927",
  "./poster-theme.css?v=20260927-cinema",
  "./fonts/anton-latin.woff2",
  "./fonts/anton-latin-ext.woff2",
  "./fonts/archivo-black-latin.woff2",
  "./fonts/archivo-black-latin-ext.woff2",
  "./fonts/Anton-OFL.txt",
  "./fonts/Archivo-Black-OFL.txt",
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
  "./bucket-data.js?v=20260927-cinema",
  "./INTERNATIONAL_CINEMA_COURSE.md",
  "./MOVIE_BUCKET_LIST.md",
  "./DESIGN_NOTES.md",
  "./app.js?v=20260927-cinema",
  "./cloud.bundle.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icons/rehearsal-frame.svg",
  "./icons/cinema-studio.svg",
  "./icons/cinema-studio-192.png",
  "./icons/cinema-studio-512.png"
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
