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

The app now rotates compositions, not just palettes: cut-paper collage, editorial
broadsheet, electric ribbon, and oversized type specimen. A cloud AI proposal can
author additional original responsive CSS. All room forms and private records
remain intact. The original app icon changes its film/ticket/aperture motif and
palette with each composition; SVG/PNG icon URLs are revisioned, while the manifest
URL stays stable as required by Chrome's update process.
Browser/WebAPK launcher refresh timing is controlled by Android/Chrome, so an
installed icon may lag behind the in-app mark. Updating the app does not require
clearing data or reinstalling. See WEEKLY_DESIGN.md for the cloud release gate.
