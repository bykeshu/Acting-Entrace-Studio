# Daily cloud maintenance

Runs on GitHub-hosted Ubuntu at approximately 09:00 Asia/Kolkata daily, plus manual runs and changes to the maintenance workflow or live checker. GitHub can delay scheduled starts.

The workflow tests the current main branch, runs synthetic functional/layout/offline checks, and checks the deployed public website at desktop and phone widths, first-party assets, manifest/icons and offline PWA reopening. Fresh browser contexts are signed out; no personal history, memories, backups or credentials are read. Evidence contains only synthetic CI records. Existing GitHub Actions failure notifications use your GitHub notification settings.

This is cloud monitoring and regression testing, not autonomous AI repair. It does not change source code, deploy releases, sign in, write Firestore or make paid API calls. AI investigation requires a separately authorized account connection and budget. Physical Android installation, real cross-device sync, push reminders and files present only on a laptop cannot be verified by this job.

Review runs under Actions / Daily website and app maintenance. Treat any failed check as an outstanding issue; do not claim the app is healthy until the failed check is resolved. The daily cloud job is separate from the existing weekly design and Letterboxd schedules.

Official references: [GitHub schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Codex GitHub Action prerequisites](https://learn.chatgpt.com/docs/github-action).
