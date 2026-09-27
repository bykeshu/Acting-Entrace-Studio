# App audit — 27 September 2026

The film logbook and composition-version-2 release were trialled with synthetic
records on an isolated localhost origin. A public Wikidata title search also
returned a selectable film edition; the selected real film was not logged.
No test diary entries were sent to Letterboxd or to a real Firebase account.

Both cloud paths completed and verified their published release:

- [Rotation run](https://github.com/bykeshu/Acting-Entrace-Studio/actions/runs/36294905093): Blue Note / collage.
- [Fresh cloud-AI run](https://github.com/bykeshu/Acting-Entrace-Studio/actions/runs/36295207560): original Red Pencil / contact-sheet editorial composition; revision `weekly-20260927044507-febbe558`.
- [Fresh-AI visual evidence](https://github.com/bykeshu/Acting-Entrace-Studio/actions/runs/36295207560/artifacts/10923762086): 38 screenshots plus metrics; artifact retention is seven days.

Each successful cloud run passed:

- 38 regression tests before and after generation, with zero failures.
- 110 room/viewport checks: eleven rooms at desktop and 360px phone widths,
  across the current release and four base compositions.
- 37 functional flows covering tasks, syllabus, practice, scores, resources,
  evidence, personal film cards, explicit rating/no-rating, CSV privacy,
  watchlist filtering, daily review, backup round trips and malformed imports.
- A real service-worker offline reload and offline film-card save in an isolated
  test browser; keyboard navigation and dark-header contrast checks.
- No uncaught page errors during those browser checks.

Fixes include rejecting impossible scores, validating imported/replayed records
before applying them, preserving private film records when practice is cleared,
handling missing daily-task status, preventing stale metadata-search results,
and avoiding a reload on the first service-worker claim. The manifest URL stays
stable so icon updates do not create a different installed app.

## Boundaries of the result

This is a broad regression audit, not a guarantee of every possible input or
device. Auth controls and private event replay were tested with isolated fixtures;
real account sign-in, Firestore rule deployment and two physical devices syncing
were not re-tested during this audit. No such success is claimed.

Letterboxd remains a normal signed-in website/CSV handoff, not an automatic API
integration. Private feelings are excluded from export. Imports require film-match
review; no real watchlist or diary import was performed while signed out. Android
launcher/WebAPK icon refresh is controlled by Chrome and was not verified on the
user's physical phone. Paid AI API calls remain disabled.

The observed Pinterest movie board still contained six saved pins (59 title
labels). Related recommendations were not imported. The cloud redesign used the
dated verified graphic-board snapshot because it could not re-inspect that board;
the release records this limitation rather than claiming new-board access.
