# Weekly cinema design: subscription-only cloud workflow

The user has ChatGPT Plus and has explicitly declined paid API calls. The weekly
agent must use included cloud Work/Codex usage. Google Drive is not an execution
engine and is not needed: this public GitHub repo is the source of truth.

## Same workflow locally and in the cloud

1. Read AGENTS.md and DESIGN_NOTES.md. Check Git status and preserve user edits.
2. Revisit https://in.pinterest.com/maddyman296/graphic-design/. Only actual saves
   belong to the pool. `design/presets.json` is a dated four-pin snapshot, not a
   live sync. If newly saved pins can be inspected, add an original licensed-font
   interpretation and record its observation date. Do not import suggestions.
3. Select an unused saved-pin style with the exported selectPreset function. Build
   only the final chosen design once, so one run records exactly one history entry.
   For rotation-only runs use `node scripts/refresh-design.cjs --runner chatgpt-cloud`.
4. For a fresh AI variation, inspect that pin and create a small JSON design file
   with `presetId`, `mode: "fresh-ai"`, `rationale` and `tokens`. Tokens must include
   exactly stage, accent, paper, panel, ink, line, mark, soft (six-digit hex colours),
   display (archivo, anton or serif) and layout (collage, editorial, ribbon or
   specimen). This is an original variation of a reviewed layout, not a claim of
   a ground-up UX replacement or exact font identification. Use included agent
   reasoning, never an API key. Run
   `node scripts/refresh-design.cjs --design PATH --runner chatgpt-cloud`.
   For local tests use `--runner local`. The runner label is provenance, not proof:
   independently record the actual cloud task, tests and GitHub deployment.
5. If the board is inaccessible, rotate the verified snapshot and label the
   source stale; do not claim a newly observed/fresh pin interpretation. If the
   fresh variation is invalid, use the tested fallback and explain why.
6. Run `node --test tests/*.test.cjs`. Check desktop and approximately 360px phone
   layouts, keyboard focus, all ten rooms, no horizontal overflow, offline assets
   and existing tracker behaviour. A failing check must block publication.
7. Publish the five generated outputs together: weekly-theme.css, design/active.json,
   design/history.json, index.html and sw.js. Optional catalogue/design-note updates
   must contain only public references. Prefer an atomic GitHub commit or a tested
   pull request; reread main before writing to avoid overwriting concurrent edits.
   Use the existing Pages publication. Do not change security settings or purchase
   anything. If an approval is necessary, report it rather than bypassing it.
8. Confirm the Pages run succeeded and the live CSS/active.json match the new
   revision at https://bykeshu.github.io/Acting-Entrace-Studio/. Record actual test
   and deployment evidence. Report inspiration, mode (rotation/fresh-ai), commit,
   live link and any blocker. The phone receives releases after reopening online
   and accepting Update, not through a forced reinstall.

The builder performs no network request and touches no personal storage. It
validates text contrast and constrains all fonts/layouts/colours. It writes only
five public design files and bumps the stylesheet URL and service-worker cache.
`design/history.json` contains design releases, not personal learning logs.

## Cloud schedule acceptance

Run weekly on Mondays at 09:00 Asia/Kolkata using ChatGPT Work cloud with the
GitHub plugin. The local weekly task is not considered migrated until an actual
cloud run and a cloud schedule have been verified. A repository commit made by
the desktop agent is NOT proof of cloud execution. Do not require this laptop's
Windows path, signed-in browser or installed local skills in the cloud prompt.
No paid API workflow is configured or authorized.

GitHub Actions provides the independent no-API rotation at Monday 09:00 IST.
Run workflow dispatches it manually; an authorized main-branch commit containing
`[run-weekly-design]` also runs the full rotation for an end-to-end cloud test.
Other main pushes test and deploy the current design without rotating it again.
The separate fresh-AI cloud Work schedule should run Monday 09:15 IST, after the
fallback rotation. GitHub schedule execution may be delayed; no exact-time SLA
is implied. Both paths use main as the source of truth, not this laptop.
