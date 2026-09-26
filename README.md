# Acting Entrance Studio

A local-first FTII Screen Acting, NSD Dramatics and Bengal theatre preparation dashboard. The static app includes a syllabus checklist, source-labelled resource library, 24-week roadmap, practice and test logs, NSD evidence tracker, daily-review ledger, JSON backup, and an installable Android-width PWA.

The **World cinema** studio adds thirty linked films, thirty-one directors, a twelve-film foundation route, cultural-context/acting prompts, filters, watched ticks and reflection logging. It is supplementary, not an official exam watchlist. See [INTERNATIONAL_CINEMA_COURSE.md](INTERNATIONAL_CINEMA_COURSE.md). India streaming availability remains unverified; source links are bibliographic references.

The separate **Movie bucket list** imports 39 title labels from four saved pins on the user's public board. See [MOVIE_BUCKET_LIST.md](MOVIE_BUCKET_LIST.md) and `bucket-data.js` for provenance and metadata limits. **Enjoyment first:** no viewing quota, compulsory analysis or automatic quiz. Optional feelings/moment memories are ungraded, excluded from practice minutes and learning streaks, and kept in private progress/backup records. Shared course titles reuse watched ticks, not mastery. Pinterest changes require a fresh import; no Pinterest auto-sync is implemented.

The roadmap and course offer film study only as an opt-in activity after viewing. Analysis prompts and forms are collapsed by default. Existing module/progress keys are preserved, and personal memories use the existing session sync format. Release-versioned assets and matching service-worker precache URLs must be bumped together when app code changes.

New date defaults use the user's India calendar (`Asia/Kolkata`), including after midnight. Previously stored dates are not rewritten.

`cinema-data.js` is the public catalogue. From this directory, `node scripts/sync-cinema-data.cjs` mechanically updates the parent research JSON; it does not touch personal progress. `node --test tests/cinema.test.cjs` checks the catalogue and storage flows without a real cloud account.

Open `index.html` directly for local-only use. For PWA installation, serve this directory over localhost or publish it over HTTPS. See [ANDROID_DEPLOYMENT.md](ANDROID_DEPLOYMENT.md) for GitHub Pages, Firebase sync status, Android installation, and reminders.

Personal submissions and reviews must not be committed. The local daily coach writes `daily-log.js`, which is ignored by Git. The GitHub-hosted app does not load that private file; completed reviews are imported through the laptop's local app and queued for the signed-in account once sync is enabled.
