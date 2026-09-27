# Your life in films — enjoyment first

Open Film logbook (room 11). Choose a title from your shelf, search public
Wikidata film metadata, or type any title yourself. The catalogue is not every
film ever; manual entry remains available offline. Choose the correct edition
and year. Genres are community metadata or your own labels, not exam categories.

After a watched tick, the logbook asks for 0.5–5 stars or No rating. Confirm
Save my film card to create the dated card. A rating is your opinion, not a
quality grade for your work. Date uses India time. Rewatch, genre and a feeling/
moment/meaning are optional. Watching earns no practice time, mastery or streak.
Your cards, watchlist additions and memories stay in private progress and use
the existing account sync and JSON backup. Nothing private is committed to GitHub.

## Optional personal afterwords

Each film deck has an attached “AFTER THE CREDITS / JUST FOR YOU” strip below its
2:3 poster. Leave a thought opens a small journal; Save thought carves the text
into the strip in the poster's palette and the deck's editorial typography.
Existing feeling/meaning notes appear here automatically, with no data migration.
Edit my thought lets you revise it; saving a blank thought clears it. Cancel
discards the draft, not the last saved thought. All controls work by keyboard.

This uses the existing private `note` field (3,000 characters) and session sync,
not new records, grades, practice minutes or Letterboxd reviews. Unfinished
drafts survive in-page re-renders but are not saved across closing/reloading the
app; press Save thought to persist them. A concurrent change from another device
blocks overwriting and preserves your local draft so you can copy it before
Cancel reloads the latest thought. Saved thoughts are included only in private
backups, not public source files or Letterboxd CSV exports.

## Letterboxd / saltinsea

The linked profile is https://letterboxd.com/saltinsea/. The app has no Letterboxd
API connection. As checked 27 September 2026, [API access policy](https://letterboxd.com/api-beta/)
requires approval and excludes personal and GPT/LLM projects. Do not use hidden
endpoints, browser cookies, passwords or a fabricated background automation.

Supported handoff: download pending diary CSV and import on Letterboxd's
[profile importer](https://letterboxd.com/import/). Review each film match before
the final import: imports have no undo. Ratings/rewatch/watched calendar date are
included; your private feelings, genres as tags, reviews and exam data are NOT.
Date and watched status may be publicly visible on Letterboxd. Once you complete
the import, use “I imported this entry” on the card. This is your attestation,
not remote verification. Return it to pending if necessary. Re-importing the
same film/date may update the existing entry; separate same-day rewatches need
manual Letterboxd handling, so the app prevents accidental same-film/day duplicates.

Download watchlist CSV separately. Import it to YOUR WATCHLIST, never your
profile: profile import marks every entry watched. It contains currently
unwatched saved Pinterest titles plus personal additions. Scoped episode/series/
segment entries are excluded unless you explicitly supply an exact Letterboxd
film link. Title-only matches can be ambiguous. A bucket update refreshes this
export automatically, but cannot update Letterboxd in the background. An agent
can assist through its ordinary signed-in website when explicitly requested;
future visits still require an active authenticated session and your rating.

Sources: [Letterboxd CSV specification](https://letterboxd.com/about/importing-data/),
[Wikidata data access / CC0](https://www.wikidata.org/wiki/Wikidata:Data_access).
No Letterboxd database is scraped or claimed to be open source. No images are
bundled. Metadata searches go directly to Wikidata only when you press Search.

## Poster backdrops

Film diary cards show full-bleed posters with live text in each poster's colours.
Existing Sound of Metal cards use the verified [Criterion cover](https://www.criterion.com/films/32169-sound-of-metal)
(2019 film, artwork by William Laboury; also recognises the 2020 release label).
This is an external artwork reference, not a watched-history seed or an open-license
claim. Other films remain text-only until you upload your preferred artwork or choose
a direct HTTPS image URL under Edit this card → Poster artwork & colours. Uploaded
JPG/PNG/WebP files are sampled on this device into background/text/accent colours.
Body/title/control colours are adjusted to pass 4.5:1 contrast over the card's
>=88% content scrim; the large rating accent passes 3:1, preserving vivid hues.
the exposed artwork stays vivid. Three colour pickers, a live card preview, credits
and a text-only override are available. No key, new account or paid service is required.

Artwork rights remain with their owners; choose images you are permitted to display.
Images load directly from their host with no referrer, but the host still sees your
IP. No private notes or ratings are sent with the image request. Images are not
committed or added to its service-worker cache. Remote hosts may [block canvas colour sampling](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image);
Match poster colours handles this safely, without a proxy or bypass. Upload instead
for reliable sampling, or pick colours manually. Unavailable remote images leave
the paper card usable; offline remote artwork is not guaranteed.

User-selected uploads become compact JPEG thumbnails, not public site assets.
The original file, filename and EXIF metadata are not uploaded. Maximum source
size is 12 MB / 24 megapixels; the JPEG data URL is bounded to 30,000 characters
and the whole card to 48,000 UTF-8 bytes, below the existing 50,000-byte event rule.
Upload processing/preview does not save or sync anything until Save my film card.
Thumbnails, palette, custom URL/credit and text-only choice use the existing private
session sync and JSON backup. Uploaded images work offline on devices that have
received the saved card. They are not included in Letterboxd CSV exports. No diary
date, rating, film identity, learning credit or account rules are changed.

## Weekly visual update and Android icon

Poster cards have an invariant 2:3 canvas on phone, desktop and previews. The
same `cover` crop and focal point apply at every width. Content scrolls inside
the overlay when necessary, rather than stretching the poster. Text-only cards
remain flexible. Artwork URLs are optional private references, never bundled
Pinterest or Letterboxd assets; alternative artwork must match the exact film.

Checked Letterboxd watched-list imports retain the observed rating and actual
diary date when available. If a watched film has no diary date, select Date not
recorded: its saved date is empty, not today's date. These checked snapshot cards
use `letterboxdStatus: observed`, distinct from a live API connection or the user's
manual imported confirmation. They are excluded from pending diary exports, as
are undated watches. Identity/title/year checks prevent same-viewing duplicates
and keep imported watched films out of the unwatched shelf. No private watched
titles, ratings or dates belong in public seed files or this documentation.

The app now rotates compositions, not just palettes: cut-paper collage, editorial
broadsheet, electric ribbon, and oversized type specimen. A cloud AI proposal can
author additional original responsive CSS. All room forms and private records
remain intact. The original app icon changes its film/ticket/aperture motif and
palette with each composition; SVG/PNG icon URLs are revisioned, while the manifest
URL stays stable as required by Chrome's update process.
Browser/WebAPK launcher refresh timing is controlled by Android/Chrome, so an
installed icon may lag behind the in-app mark. Updating the app does not require
clearing data or reinstalling. See WEEKLY_DESIGN.md for the cloud release gate.
# Poster quality and private alternatives (27 September 2026)

Cards are capped at 320 CSS pixels wide on desktop and retain the same 2:3
aspect ratio and crop on phones. Uploaded artwork retains a JPEG up to 1280px
on its long edge (never upscaled), bounded to 288,000 base64 characters. It is
split into immutable `Film artwork` session events of at most 24,000 characters,
using the existing owner-only event path and unchanged Firebase rules. A diary
card references one immutable artwork ID and retains a small fallback thumbnail
until all parts arrive. Artwork is excluded from learning, practice clearing,
Letterboxd exports and the visible diary count; backups include it privately.
This increases per-image sync reads/writes, with no paid storage/API added.
Older compressed images cannot regain lost detail: upload the original again.

Each private card may hold up to 30 credited HTTPS alternate poster references
within its 48,000-byte sync limit, with contrast-checked palettes and duplicate
image links removed. “Change poster” uses a random shuffle bag containing the
original and alternatives. Each image appears once per cycle, with no immediate
repeat at a cycle boundary. Changing the pool or saving an edited card resets the
bag. The chosen index and remaining bag sync privately without changing rating/date/memory or
posting anything to Letterboxd. It is a manual control, not an automatic
Pinterest scraper or a recurring AI redesign. Source hosts must remain online;
linked art is not bundled into GitHub. A local private reference gallery is kept
outside the public repository.

Wide desktop screens (1050px and above) show four cards across. Phones retain a
single compact column with the same 2:3 card ratio. Clicking the artwork, title or
ticket opens a native modal showing the uncropped source image and its credit.
The explicit View poster button provides keyboard access; Escape, Close and the
backdrop dismiss it. Editing, changing art and Letterboxd controls remain separate.
