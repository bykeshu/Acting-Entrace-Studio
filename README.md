# Acting Entrance Studio

A local-first FTII Screen Acting, NSD Dramatics and Bengal theatre preparation dashboard. The static app includes a syllabus checklist, source-labelled resource library, 24-week roadmap, practice and test logs, NSD evidence tracker, daily-review ledger, JSON backup, and an installable Android-width PWA.

Open `index.html` directly for local-only use. For PWA installation, serve this directory over localhost or publish it over HTTPS. See [ANDROID_DEPLOYMENT.md](ANDROID_DEPLOYMENT.md) for GitHub Pages, Firebase sync status, Android installation, and reminders.

Personal submissions and reviews must not be committed. The local daily coach writes `daily-log.js`, which is ignored by Git. The GitHub-hosted app does not load that private file; completed reviews are imported through the laptop's local app and queued for the signed-in account once sync is enabled.
