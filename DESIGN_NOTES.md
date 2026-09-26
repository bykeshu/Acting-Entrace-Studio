# The cinema-poster studio — design research and font matches

Updated 27 September 2026 for the laptop website and Android PWA. The cinema-poster edition supersedes the earlier pastel journal, retaining its offline tracker and enjoyment-first films.

## The two supplied references

| Reference | Visual reading and confidence | App treatment |
| --- | --- | --- |
| “films for catharsis” | Heavy grotesque sans-serif, tight tracking, compact lines and an offset edge. **Archivo Black is a close visual match, not a verified original font.** A raster crop cannot establish an exact family, cut or custom lettering. | Archivo Black for page headings and film titles; subtle offset print edge on title cards. |
| “WE ARE BORN READY” | Very condensed, heavy uppercase display, contrasting serif italics, yellow-on-black and a backlit doorway. **Anton is a visual substitute, not a verified attribution of the campaign font.** | Anton for the masthead and metrics; Cormorant Garamond italics for short expressive lines. |

No original font credit was found in the examined references. Do not claim that these are the precise fonts from the pins or that the app is affiliated with Nike, Parth, Pinterest or any film studio.

## Linked inspiration research

- [Your Cinema to Watch board](https://www.pinterest.com/maddyman296/cinema-to-watch/): observed five saved pins; only saved pins contribute to the personal list.
- [New catharsis pin](https://www.pinterest.com/pin/649292471323038063/): heavy type, red star, white space and framed imagery. Its 11 title labels were read from slides 2–12; mood descriptions are personal curation, not verified metadata.
- [Pinterest search: cinema website bold typography](https://www.pinterest.com/search/pins/?q=cinema%20website%20bold%20typography): visually inspected results, not saved to or imported into your board.
- [Aarman Roy reference pin](https://www.pinterest.com/pin/492649954619757/): the supplied Nike-style reference appeared in search. Borrow contrast and type hierarchy, not logos or campaign copy.
- [Cinematic/Famous type specimen](https://www.pinterest.com/pin/45458277485382105/): observed in search; condensed title paired with heavy wide type and restrained monochrome labels.
- [A Day in a Life poster](https://www.pinterest.com/pin/13862711350399919/): observed in search; film-frame sequencing and oversized red lettering. The app translates sequencing into three static shortcuts, not autoplay or compulsory viewing.
- [Nike: FM Broadcast Presents — We Are Born Ready](https://www.nike.com/at/en/a/wearebornready): official campaign context, not a source for an exact typeface attribution or an app asset.
- [A24](https://a24films.com/): cinema-first catalogue reference with film-led presentation and compact supporting information. Our interpretation: prominent films/feeling with separate tracker controls.
- [BFI: Sight and Sound, June 2026](https://www.bfi.org.uk/sight-and-sound/news/sight-sound-june-2026-issue): editorial cinema structure and linked features including Ghatak. Our interpretation: film-journal labels and clear separation of curation from evidence.

Some web-indexed Pinterest pins redirect or are unavailable; the usable search results above were inspected directly. Search results are inspiration, not the user's saved bucket list.

## Implemented visual system

Near-black stage (#101110), acid-yellow titles (#e9f437), vermilion stars and warm off-white working panels. Oversized uppercase masthead, heavy lowercase-capable headings, expressive italics, frame edges, sprocket marks, printed title cards and an original rehearsal-door SVG. Forms, tasks and source labels remain readable rather than receiving decorative headline fonts.

No Pinterest images, film stills, Nike logo, campaign copy or downloaded textures are bundled. The doorway/silhouette illustration, stars and icon are original SVG/CSS—not an actual film scene or a portrait of the supplied photograph's subject. Rendering requires no remote images or search requests.

## Typography and licensing

- **Archivo Black** — headings/title cards. [Foundry repository](https://github.com/Omnibus-Type/ArchivoBlack), [Google Fonts builds](https://github.com/google/fonts/tree/main/ofl/archivoblack); Copyright 2017 The Archivo Black Project Authors. [Licence](fonts/Archivo-Black-OFL.txt).
- **Anton** — masthead/metrics. [Google Fonts family](https://github.com/google/fonts/tree/main/ofl/anton); Copyright 2020 The Anton Project Authors. [Licence](fonts/Anton-OFL.txt).
- **Cormorant Garamond** — serif italic accents. [Google Fonts family](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond). [Licence](fonts/Cormorant-OFL.txt).
- **DM Sans** — body/controls/forms. [Google Fonts family](https://github.com/google/fonts/tree/main/ofl/dmsans). [Licence](fonts/DM-Sans-OFL.txt).

All are unmodified, self-hosted Google Fonts WOFF2 builds with SIL Open Font License 1.1 text. Latin/Latin-extended builds preserve accented titles; system fallbacks cover unsupported scripts. Rendering makes no runtime Google Fonts or Pinterest request.

## Interaction, privacy and updates

All ten rooms use the desktop sidebar or labelled mobile selector. Native controls, visible focus, 16px mobile inputs, reduced motion and 44px primary targets remain. Headlines wrap on phones; no flashing marquee, forced splash, sound or autoplay. Decoration is hidden from assistive technology.

50 personal titles remain separate from the supplementary World cinema course. Notes/analysis are optional and collapsed; no viewing quotas, automatic quizzes or practice hours from watching. Existing film IDs, storage keys, backups, sync events and Firestore rules are unchanged. No private progress or memories are published.

Website and installed PWA share the responsive app. Reopen online and accept **Update** when offered. Android may refresh launcher icons independently; immediate icon refresh is not guaranteed. `scripts/render-journal-icons.cjs` renders PNGs from `icons/cinema-studio.svg` using installed `sharp` or `ACTING_SHARP_PATH` (development only).
