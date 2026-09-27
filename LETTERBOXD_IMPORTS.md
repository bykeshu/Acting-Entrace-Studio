# Daily private Letterboxd imports

The daily importer and Monday design refresh are separate GitHub Actions jobs.
Paid AI, Firebase Functions, Cloud Scheduler and billing upgrades are not used.
The daily job is guarded by `LETTERBOXD_IMPORT_ENABLED=true`: until setup and a
real private-write trial succeed, it must remain off. A successful RSS check-only
run proves feed parsing, not Firebase writes or end-to-end sync.

## Free setup (one time)

1. In Firebase Authentication → Users, create a separate Email/Password account.
   Choose and submit its new password yourself; do not use the dashboard password.
   The account is NOT a Firebase/GCP project editor or owner. No IAM role is needed.
2. Review, validate and promote the local draft inbox rules into `firestore.rules`,
   then publish them. The draft is currently untracked under `tools/`; the active
   rules file remains unchanged until validation and permission approval. Existing
   owner-only progress rules are unchanged. Until published, the setup UI explains
   that daily imports are not connected; normal progress sync still works.
3. Sign in to the HTTPS app with your normal dashboard account. In Film logbook →
   Daily private imports, enter the separate account's Firebase Auth UID and confirm
   Connect private inbox. This delegates create-only metadata access to your inbox;
   the importer cannot read, update or delete it, or access your progress events.
4. In repository Settings → Secrets and variables → Actions, save these **secrets**:
   `LETTERBOXD_IMPORT_EMAIL`, `LETTERBOXD_IMPORT_PASSWORD`, `LETTERBOXD_OWNER_UID`
   (shown only in your signed-in app), and `LETTERBOXD_WRITER_UID`. Never save the
   primary account password, a Firebase service-account key, browser cookies, or
   your Letterboxd password. Never paste secrets into chat or commit them.
5. Run Daily private Letterboxd import with **check_only unchecked**. Verify its
   generic success count and the private last-check status/cards in your app.
   Then set repository Actions **variable** `LETTERBOXD_IMPORT_ENABLED` to `true`.
   Leave it unset/off until this real trial passes.

## What is and is not automatic

- Scheduled daily around 09:00 India time (03:30 UTC). GitHub may delay or miss a
  scheduled run. This is not immediate Letterboxd sync. Run workflow can refresh
  manually. Public-repository schedules can be disabled after 60 days of repository
  inactivity; check Actions notifications and re-enable if needed.
- The job reads only `https://letterboxd.com/saltinsea/rss/`, a recent-activity
  feed. It is not a full watched-library export and may omit old watches, unlogged
  watched ticks, deleted entries, private entries or entries outside its window.
  This particular feed was verified reachable on 27 September 2026, including
  film title/year, watched calendar date, rating and rewatch fields.
- Cloud fetching works with the laptop off. Metadata is staged in the private
  Firebase inbox. A signed-in, online app must be open to reconcile new film cards;
  then existing owner event listeners sync them across open devices. Offline
  devices catch up after reconnecting. No fixed seconds-level guarantee is made.
- Only new valid feed viewings are imported. Empty/invalid/future watched dates
  are skipped, never replaced by today. Unrated is null, not a fabricated rating.
  Watch and review feed events for the same film/date collapse to one viewing.
- Existing matching cards are left unchanged, including notes, ratings, dates,
  genre labels, poster choices and artwork. Undated snapshots are conservatively
  kept without a duplicate; edition conflicts require manual review. Later edits
  to a rating/review on Letterboxd do not overwrite your app. Two same-day rewatches
  are not distinguishable by this importer and need manual handling.
- Every accepted item gets an owner-only, immutable receipt. A new ordinary private
  session event and receipt are committed atomically, preventing two devices from
  importing it twice. Deleting a previously imported card does not re-import the
  same inbox item. No cards or private history are committed to GitHub or artifacts.
- Imported cards are `Film diary`, Personal, zero minutes and no study scores;
  their source is observed RSS, so they are excluded from pending Letterboxd CSVs.
  No private review text is imported; your optional afterword remains yours.
- No automatic Letterboxd posting/watchlist updates. App → Letterboxd remains an
  explicit rating/date-confirmed website or CSV handoff. Pinterest is separate.

## Revoking and troubleshooting

Disable imports in the app to revoke the writer's inbox/status access immediately
after that setting syncs. Turn off `LETTERBOXD_IMPORT_ENABLED` in Actions to stop
scheduled work too; removing its password secret also stops sign-in. Existing
cards and receipts remain private and untouched. GitHub secrets hold the separate
login; its own Auth account can only reach its own empty owner space plus the
explicitly delegated inbox, never the dashboard owner's event collection.

Errors log only fixed codes and counts, not feed text, film labels, ratings, Auth
responses or UIDs. A permission error needs rule/delegation verification, not
an open/public rule. Rules cannot prove RSS authenticity; a compromised importer
credential could submit bounded false inbox metadata until revoked, but cannot
read or replace journal/progress records. Free Firestore quotas are finite.

Sources: [Letterboxd feed/API policy](https://letterboxd.com/api-beta/),
[Firestore REST authentication](https://firebase.google.com/docs/firestore/use-rest-api),
[Firebase Auth REST](https://firebase.google.com/docs/reference/rest/auth),
[Spark and Blaze](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans),
[GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets),
[scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[schedule inactivity](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).
