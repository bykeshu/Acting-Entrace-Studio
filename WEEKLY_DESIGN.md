# Weekly cinema design: subscription-only cloud workflow

Use included ChatGPT Plus cloud Work reasoning and the connected GitHub plugin.
No paid AI/API calls, API keys, purchases or extra subscription is authorized.
GitHub is the source of truth; neither the laptop nor Google Drive runs the task.

## Cloud stages

GitHub Actions rotates a verified fallback Monday 09:00 Asia/Kolkata. Cloud Work
proposes a fresh original variation Monday 09:15. Schedules can be delayed.
The cloud Work local browser preview was unavailable in the acceptance test.
Therefore Work proposes public token JSON; GitHub's installed Chrome checks the
layout before generated files are committed or deployed. Do not require a browser
download, localhost permission, laptop path or local skills each week.

## Fresh-AI task

1. Read AGENTS.md, DESIGN_NOTES.md, this file, design/presets.json and
   design/history.json from current main. Preserve concurrent edits; never force
   push. Keep course/bucket/seed data, app.js, Firebase/security, storage keys,
   manifest identity and private records unchanged.
2. Reinspect https://in.pinterest.com/maddyman296/graphic-design/ when accessible.
   Count only actual saves, not related pins or suggestions. The catalogue is a
   dated four-pin snapshot, not live sync. If inaccessible, use that snapshot
   honestly. A fresh interpretation of an old observed pin is allowed; claiming
   a new observation is not. Select an eligible unused pin with selectPreset's
   logic; avoid repeats until the pool is exhausted and immediate repetition.
3. Create an original cinematic palette/type/composition variation of a reviewed
   layout using included agent reasoning and existing licensed fonts. No copied
   Pinterest art or logos. This is not an unbounded ground-up UX rebuild.
4. Atomically write only design/proposal.json to main. Its exact top-level fields
   are proposalId (unique, 8–80 lowercase letters/digits/hyphens) and design.
   Design has exactly presetId, mode "fresh-ai", rationale and tokens. Tokens have
   exactly stage, accent, paper, panel, ink, line, mark, soft (six-digit hex colours),
   display (archivo, anton or serif), and layout (collage, editorial, ribbon or
   specimen). Use a commit message containing [fresh-ai-proposal]. A proposal
   commit is NOT a published theme. No local builder/browser is needed in Work.
5. Wait for the resulting Weekly cinema theme Actions run. It validates and
   consumes each proposalId once, runs the builder once, then tests all existing
   progress/course behaviours. Installed CI Chrome checks all ten rooms at 1280px
   and 360px, horizontal overflow, dark-header contrast, keyboard access and
   uncaught app errors. It saves 20 screenshots plus metrics.json in the
   design-layout-checks artifact. Review that evidence when available.
   Failure blocks generated-file commit and deployment; leave the last verified
   live theme unchanged and report the exact blocker.
6. On a pass, Actions atomically commits exactly weekly-theme.css,
   design/active.json, design/history.json, index.html and sw.js, deploys the tested
   tracked public site and verifies the live revision. Independently confirm the
   run and https://bykeshu.github.io/Acting-Entrace-Studio/design/active.json before
   reporting publication. Report pin/source date, actual mode, proposal/generated
   commits, tests and live link. Actual builder runner is github-actions;
   designAuthor records chatgpt-cloud. A runner label is not proof by itself.
7. Keep the recurring task enabled. A failing run is evidence to report, not
   permission to silently disable the user's schedule. Notify on completed
   updates, failures or required user action, not unchanged-state checks.

Preserve all ten rooms, cinema/enjoyment-first controls, accessibility, offline
assets and private progress. Watching adds no automatic homework, quizzes,
mastery, hours or learning streak. Never publish watched history, movie memories,
daily logs, backups, credentials, private pins, .env or ignored files.

## Rotation, local tests and acceptance

Use node scripts/refresh-design.cjs --runner local and
node --test tests/*.test.cjs locally, then inspect desktop/360px in the normal
browser. The CI browser script is CI-only and never attaches to a user's browser.
The builder makes no network/API call and writes only five public design outputs.
It validates text contrast/fonts/layouts and refreshes stylesheet/PWA cache URLs.

Run workflow dispatches a rotation manually. An authorized main commit containing
[run-weekly-design] also runs a complete cloud rotation. Normal pushes test and
deploy without re-rotating. [fresh-ai-proposal] consumes a new AI proposal instead.
Never combine both trigger markers in one commit. Reopen the phone online and
accept Update; no reinstall or progress reset is needed.

Pause the old local heartbeat only after a cloud run and cloud schedule have been
verified. Initial rotation acceptance succeeded with 29 tests before and after,
a bot-generated five-file commit and verified live revision:
https://github.com/bykeshu/Acting-Entrace-Studio/actions/runs/36278390485
Fresh-AI acceptance is separate and must not be inferred from that rotation.
