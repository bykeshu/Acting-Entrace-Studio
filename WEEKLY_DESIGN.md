# Weekly cinema decks: included-subscription cloud workflow

Use included ChatGPT Plus cloud Work reasoning and the connected GitHub plugin.
No paid API, API key, purchase or additional subscription is authorised. The
laptop and Google Drive are not task runners. Keep the existing cloud task enabled.

GitHub Actions rotates a verified fallback Monday 09:00 Asia/Kolkata; cloud Work
authors a fresh original proposal Monday 09:15. Scheduled starts may be delayed.
The cloud agent does not need a local browser, Node installation or laptop files:
GitHub's installed Chrome performs the actual layout/functional release gate.

## Fresh original redesign contract — version 2, 27 September 2026

1. Read current main's AGENTS.md, DESIGN_NOTES.md, this document,
   design/presets.json, design/history.json, deck.css, journal-ui.js (read-only),
   scripts/composition-treatments.cjs and scripts/refresh-design.cjs. Preserve
   concurrent edits, all eleven rooms, stable IDs, storage keys, course/bucket
   data, authentication, security rules, sync, backup formats and app identity.
2. Reinspect https://in.pinterest.com/maddyman296/graphic-design/ when accessible.
   Only actual saved pins count. Four observed pins are a dated fallback snapshot,
   not live Pinterest sync. Never claim a new observation when inaccessible. Use
   an eligible unused pin, exhausting the current cycle before repeats and avoiding
   immediate repetition; follow selectPreset in scripts/refresh-design.cjs.
3. The user wants the WHOLE DECK re-composed, not a colour swap. Interpret the
   saved pin as original cinematic typography, negative space, zine/collage
   geometry, navigation tickets, hero arrangement, film cards, resource spreads,
   syllabus/roadmap/evidence layouts and film-logbook cards. Existing licensed
   Archivo Black, Anton, Cormorant Garamond and DM Sans are available offline.
   Use no copied Pinterest artwork, poster photos, brand logos or remote fonts.
4. Atomically write only design/proposal.json to current main, with a unique
   proposalId (8–80 lowercase letters/digits/hyphens) and design. Design fields:
   presetId, mode "fresh-ai", rationale (max 1000 chars), tokens, and optional
   compositionCss. For a fresh AI run, author a nonempty ORIGINAL compositionCss
   extension: meaningful desktop/mobile changes in at least three component
   families, not only colour/font overrides. Use a [fresh-ai-proposal] commit.
   A proposal commit is not proof of publication.
5. Tokens have exactly stage, accent, paper, panel, ink, line, mark, soft (six-digit
   hex colours), display (archivo / anton / serif), layout (collage / editorial /
   ribbon / specimen). These four base compositions now have different shells,
   navigation, hero/stat arrangements, roadmap flows and card grids. Choose a
   base composition appropriate to the pin, then extend it with original CSS.
6. compositionCss is at most 16000 characters. Use CSS palette variables for
   colours: --ink, --paper, --panel, --stage, --acid, --weekly-mark, --weekly-soft.
   Use live-text typography and responsive grid/flex/spacing/border treatments.
   No URLs, imports, font-face, escape sequences, HTML, scripts, generated content,
   absolute/fixed positioning, hidden controls, zero opacity or pointer blocking.
   Do not style private content by value. Keep form controls, labels and navigation
   readable and reachable; preserve reduced-motion and focus states. The validator
   is defence in depth, not a claim of a universal CSS security sandbox.
7. Wait for the resulting Weekly cinema theme Actions run. The runner consumes
   proposalId once, validates palette/contrast/CSS, generates nine public files,
   then runs Node regression tests and installed Chrome. Chrome checks the release
   AND all four base compositions, all eleven rooms, at 1280px and 360px: 110
   room/viewport checks, overflow, dark headings, keyboard access and uncaught
   errors. Synthetic functional flows cover tasks, syllabus, roadmap, practice,
   tests, resources, NSD evidence, watched-to-rating prompts, film-card editing,
   CSV privacy, watchlists, private event replay, daily assessments, backups and
   an actual service-worker offline film save. No real account is signed in and
   no synthetic film is posted to Letterboxd or Firestore. Screenshots/metrics
   are saved in the design-layout-checks artifact. Review evidence when available.
8. Failure blocks generated commit/deployment; leave the last verified live deck
   unchanged and report the exact blocker. On success, Actions commits only:
   weekly-theme.css, design/active.json, design/history.json, index.html, sw.js,
   manifest.webmanifest, icons/cinema-studio.svg, icons/cinema-studio-192.png and
   icons/cinema-studio-512.png. Manifest appearance may change, never id/start_url/
   scope. Weekly icons are original film/aperture/ticket/star motifs, mask-safe
   geometry, PNG 192/512, and revisioned icon URLs. Keep the manifest URL stable.
   Android may delay installed launcher
   icon updates; do not promise immediate OS icon replacement or reset progress.
9. Confirm successful Actions deployment and the public design/active.json revision
   independently. Report the source pin/date, actual mode, originalComposition,
   proposal/generated commits, test evidence and live link. runner identifies the
   builder (github-actions); designAuthor identifies the cloud proposer. Never
   infer success solely from a metadata label. Keep the recurring task enabled;
   notify on completion, failures or required user action, not routine polling.

Watching is enjoyment first. No automatic assignments, quizzes, mastery, practice
hours or learning streaks. Never publish watched history, film diary, memories,
daily logs, backups, credentials, private pins, .env, ignored files or node_modules.

## Local and cloud acceptance

Locally: node scripts/refresh-design.cjs --runner local, then
node --test tests/*.test.cjs, then desktop/360px in the normal browser. The CI
browser is CI-only and never attaches to the user's browser. The dependency-free
builder makes no network/API calls; only nine public outputs are changed.

workflow_dispatch or [run-weekly-design] in an authorised main commit runs a cloud
rotation. Normal pushes test/deploy without rotation. [fresh-ai-proposal] consumes
an original AI proposal; never combine both trigger markers. Reopen the phone
online, accept Update if offered. No uninstall, data reset or new subscription.

Earlier cloud acceptance: rotation run 36278390485; fresh-AI token bridge run
36279285760, both successful. Those were version-1 skins, not evidence that this
expanded version-2 deck/icon/film-log release has passed; verify the new run.
