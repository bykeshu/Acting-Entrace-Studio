# Acting Entrance Studio

A local-first FTII Screen Acting, NSD Dramatics and Bengal theatre preparation dashboard. The static app includes a syllabus checklist, source-labelled resource library, 24-week roadmap, practice and test logs, NSD evidence tracker, daily-review ledger, JSON backup, and an installable Android-width PWA.

The **cinema-poster design** follows the user's images and updated Pinterest board: dark stages, acid-yellow Anton mastheads, heavy Archivo Black titles, Cormorant italic accents, readable DM Sans controls and original SVG/CSS frames. Font matches are approximate, not exact attributions. Fonts are licensed, self-hosted and precached. Android uses a room selector; existing features/progress keys are retained. See [DESIGN_NOTES.md](DESIGN_NOTES.md) for linked inspiration, credits and accessibility. `poster-theme.css` loads after base styles; bump its release URL with app/catalogue assets and matching service-worker entries when publishing.

The **World cinema** studio adds thirty linked films, thirty-one directors, a twelve-film foundation route, cultural-context/acting prompts, filters, watched ticks and reflection logging. It is supplementary, not an official exam watchlist. See [INTERNATIONAL_CINEMA_COURSE.md](INTERNATIONAL_CINEMA_COURSE.md). India streaming availability remains unverified; source links are bibliographic references.

The separate **Movie bucket list** imports 59 title labels from six saved pins on the user's public board, including 11 catharsis titles and nine Van Gogh film/TV entries. Episode/series/segment scope notes are visible and attributed to the pin. See [MOVIE_BUCKET_LIST.md](MOVIE_BUCKET_LIST.md) and `bucket-data.js` for provenance and metadata limits. **Enjoyment first:** no viewing quota, compulsory analysis or automatic quiz. Optional feelings/moment memories are ungraded, excluded from practice minutes and learning streaks, and kept in private progress/backup records. Shared course titles reuse watched ticks, not mastery. Pinterest changes require a fresh import; no Pinterest auto-sync is implemented.

The roadmap and course offer film study only as an opt-in activity after viewing. Analysis prompts and forms are collapsed by default. Existing module/progress keys are preserved, and personal memories use the existing session sync format. Release-versioned assets and matching service-worker precache URLs must be bumped together when app code changes.

New date defaults use the user's India calendar (`Asia/Kolkata`), including after midnight. Previously stored dates are not rewritten.

`cinema-data.js` is the public catalogue. From this directory, `node scripts/sync-cinema-data.cjs` mechanically updates the parent research JSON; it does not touch personal progress. `node --test tests/cinema.test.cjs` checks the catalogue and storage flows without a real cloud account.

Open `index.html` directly for local-only use. For PWA installation, serve this directory over localhost or publish it over HTTPS. See [ANDROID_DEPLOYMENT.md](ANDROID_DEPLOYMENT.md) for GitHub Pages, Firebase sync status, Android installation, and reminders.

Personal submissions and reviews must not be committed. The local daily coach writes `daily-log.js`, which is ignored by Git. The GitHub-hosted app does not load that private file; completed reviews are imported through the laptop's local app and queued for the signed-in account once sync is enabled.

## Weekly cloud design

`weekly-theme.css` is a design-only overlay. Four original styles interpret actual
saved pins in the dated public `design/presets.json` snapshot. No reference artwork
is copied. `design/active.json` and `design/history.json` record public releases,
not learning records. The builder validates text contrast, existing fonts and
reviewed layouts, writes five public files and refreshes the PWA cache.

GitHub Actions runs a no-API rotation on Mondays at 09:00 Asia/Kolkata (scheduled
runs can be delayed), and supports Run workflow for a manual cloud test. It runs
the same Node builder/tests as a local test and deploys the tested tracked public
site to Pages. Normal main-branch pushes deploy without another rotation. Fresh
AI variations use included ChatGPT cloud Work reasoning, not paid API calls; see
[WEEKLY_DESIGN.md](WEEKLY_DESIGN.md). A cloud AI schedule must be verified in the
user's account before it is described as active. `npm test` checks all tests.
# Film logbook and deck redesign — 27 September 2026

Room 11 stores private, enjoyment-first film cards with half-star/no-rating,
optional genres/moments, rewatches and an unwatched watchlist. Wikidata search has
an offline/manual fallback. Letterboxd is a clearly labelled CSV handoff, not an
automatic API connection. Read [FILM_LOGBOOK.md](FILM_LOGBOOK.md).

Weekly design contract v2 now rotates full page compositions and original app
icons, and lets cloud AI author responsive composition CSS. The expanded CI gate
checks all 11 rooms across all 4 base compositions plus the candidate release,
functional workflows and offline logging. Current details in WEEKLY_DESIGN.md
supersede earlier five-file/token-skin descriptions below.
