# Android and cloud deployment

## Current state

The same responsive HTML app runs on laptop and Android. Its installable PWA shell works offline after first load. Local progress, JSON export/import, FTII/NSD/Bengal resource links, and daily-review display remain available. Firebase Email/Password and event-by-event Firestore sync code are included, but live sync is **not verified or active until `firestore.rules` is validated and published in the Firebase project**. Push reminders are not implemented yet.

## Publish the app

The repository is `https://github.com/bykeshu/Acting-Entrace-Studio`. Only files in this directory are intended to be committed. `daily-log.js`, exported backups, local files, `tools/`, and `node_modules/` are ignored. The Firebase web config in `cloud/cloud.js` is public client configuration, not an admin key; Firestore rules must protect all personal data.

The repository is public, and GitHub Pages is built from branch **main**, folder **/(root)**. The live address is `https://bykeshu.github.io/Acting-Entrace-Studio/`. Never commit private daily files or backups. See [GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Open that HTTPS address in Chrome on Android, use Chrome menu **Add to Home screen / Install app**, and open the new icon. Chrome may present slightly different wording by version. The app's service worker updates code on future launches and offers an Update button once a new version is ready. Local browser storage belongs to a specific origin: `file://`, localhost, and GitHub Pages do not share it. Export a backup from the old app and import it on the published URL before relying on sync.

## Finish private sync

1. Firebase project Users and permissions confirms `maddyman296@gmail.com` already has the **Owner** role. No additional role grant is needed.
2. Review, syntax-test and publish `firestore.rules` to the project's default Firestore Standard database. The rules allow owner-only read/create of `users/{uid}/events/{eventId}` and deny update/delete and every other path. They are a prototype and need emulator testing before broad sharing.
3. On the published app, use **Sign in to sync** to create a Firebase Email/Password account. This is a new app account, not automatically the Google account used for Firebase Console. Use the same app email/password on Android and laptop. Export a backup before changing accounts.
4. Test a harmless task on one device and verify it appears on the other within seconds; repeat offline and reconnect. Confirm the status changes from Pending sync to Synced. Do not consider cross-device sync verified until this works.

The `cloud.bundle.js` file is built from `cloud/cloud.js` with `pnpm run build:cloud` (or the equivalent local esbuild command) and must be committed with future sync-code changes. UI/CSS/HTML edits are committed and pushed to `main`; GitHub Pages deploys them, then installed devices receive the update on a later launch. Progress is separate in Firestore, so code deployment should not erase it.

## Reminders

The current app does not send background Android push reminders. That requires user-triggered notification permission, a Firebase Cloud Messaging web registration, and a trusted scheduled backend that sends to the signed-in device. Firebase scheduling may require billing. Until that is built and tested, Android Calendar/Clock reminders are a reliable manual stopgap. [Firebase Web Push](https://firebase.google.com/docs/cloud-messaging/web/get-started), [scheduled functions](https://firebase.google.com/docs/functions/schedule-functions).
