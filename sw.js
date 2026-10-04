const CACHE_NAME = "acting-entrance-studio-shell-weekly-20260928034844-1e770310-bengali-plays-20261001-music-20261004-vinyl-admissions-20261004-audit-20261004-moods-dock-free-pdfs-inline-20261005";
const PDF_CACHE = "acting-entrance-studio-library-pdf-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=20261004-audit",
  "./library.css?v=20260928-library",
  "./music.css?v=20261005-inline",
  "./bengali-plays.css?v=20261001",
  "./library-core.js?v=20261004-free-pdfs",
  "./study-material-data.js?v=20261004-free-pdfs",
  "./study-material-ui.js?v=20261004-free-pdfs",
  "./daily.css",
  "./cinema.css?v=20260927",
  "./poster-theme.css?v=20260927-cinema",
  "./deck.css?v=20260927-sort-fix",
  "./weekly-theme.css?v=weekly-20260928034844-1e770310",
  "./design/active.json",
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
  "./bucket-data.js?v=20260927-van-gogh",
  "./INTERNATIONAL_CINEMA_COURSE.md",
  "./MOVIE_BUCKET_LIST.md",
  "./FILM_LOGBOOK.md",
  "./LETTERBOXD_IMPORTS.md",
  "./DESIGN_NOTES.md",
  "./journal-core.js?v=20260927-film-sort",
  "./letterboxd-core.js?v=20260927-daily-inbox",
  "./admissions-data.js?v=20261004",
  "./admissions-ui.js?v=20261004",
  "./admissions.css?v=20261004",
  "./ADMISSIONS_CHEAT_SHEET.md",
  "./admissions-spec.json",
  "./app.js?v=20261004-admissions",
  "./music-core.js?v=20261004-moods",
  "./music-player.js?v=20261005-inline",
  "./music-account.js?v=20261004-moods",
  "./YOUTUBE_MUSIC_SETUP.md",
  "./journal-ui.js?v=20260927-sort-fix",
  "./cloud.bundle.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icons/rehearsal-frame.svg",
  "./icons/cinema-studio.svg?v=weekly-20260928034844-1e770310",
  "./icons/cinema-studio-192.png?v=weekly-20260928034844-1e770310",
  "./icons/cinema-studio-512.png?v=weekly-20260928034844-1e770310"
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
    const isLibraryPdf=url.pathname.includes('/study-material/open-texts/')&&url.pathname.endsWith('.pdf');
    // These fixed historical and open-licensed editions are cached in full on first opening, independently of weekly themes.
    const pdfCache=isLibraryPdf?await caches.open(PDF_CACHE):null;
    if(pdfCache){const saved=await pdfCache.match(url.href);if(saved)return saved;}
    try {
      let networkRequest=request;
      if(isLibraryPdf&&request.headers.has('range')){const headers=new Headers(request.headers);headers.delete('range');networkRequest=new Request(request,{headers});}
      const response = await fetch(networkRequest);
      // PDF viewers may request byte ranges; CacheStorage cannot store a 206 response.
      if (response.status === 200) {
        const cache = pdfCache||await caches.open(CACHE_NAME);
        try{await cache.put(pdfCache?url.href:request, response.clone());}catch{/* A full or unavailable cache must not prevent online reading. */}
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate" && !url.pathname.endsWith('.pdf')) return caches.match("./index.html");
      return Response.error();
    }
  })());
});
