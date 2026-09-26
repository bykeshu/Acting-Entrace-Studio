# The cinema journal — design notes

Updated 27 September 2026 for the laptop website and installed Android PWA.

## Inspiration, not copied artwork

The user's public [Cinema to Watch board](https://www.pinterest.com/maddyman296/cinema-to-watch/) contains four movie-list cover designs from The Cinema Stories. The visible references informed the direction: large high-contrast serif headlines, expressive italic titles, mint/peach/blush/ivory colour fields, thin editorial rules, generous margins and starburst motifs.

This implementation is an original interface, not a replica or a claim of affiliation. No Pinterest poster images, film stills, textures, logos or downloaded clips are bundled. Decorative graphics are drawn with CSS and SVG. The exact typefaces in the pins have not been identified; the fonts below are a deliberate visual interpretation, not an attribution of those covers' fonts.

## Typography and licensing

- **Cormorant Garamond:** display headings, italics and movie-card titles. Source: [Google Fonts family repository](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond). Copyright 2015 the Cormorant Project Authors. The unmodified Google Fonts WOFF2 builds are distributed with [Cormorant-OFL.txt](fonts/Cormorant-OFL.txt).
- **DM Sans:** body copy, forms, navigation and controls. Source: [Google Fonts family repository](https://github.com/google/fonts/tree/main/ofl/dmsans). Copyright 2014 The DM Sans Project Authors. The unmodified Google Fonts WOFF2 builds are distributed with [DM-Sans-OFL.txt](fonts/DM-Sans-OFL.txt).

Both fonts use the SIL Open Font License 1.1. Latin and Latin-extended builds retain accents in the film/director catalogue. Browser/system fallback fonts cover unsupported scripts. Fonts are self-hosted and precached; the app makes no Google Fonts or Pinterest request to render its interface.

## Interaction and accessibility

- All ten rooms remain available. Desktop uses the sidebar; Android-width screens use a labelled room selector instead of a long scrolling tab strip.
- Focus indicators, labelled native controls, readable body fonts and reduced-motion support are retained. Pastel fields use dark text; data/controls are not encoded by colour alone.
- Form inputs are 16px on narrow screens. Primary controls have at least 44px targets; compact backup/account controls remain available in the mobile header.
- The 39-title bucket list uses collection-specific colour fields, not scores or rankings. Watching for enjoyment remains separate from learning metrics; analysis is still optional and collapsed.
- No state/storage keys, Firestore rules or personal records change in this redesign. Existing backups and sync events remain compatible.

The public website and installed PWA use the same responsive app and versioned assets. Reopen online and accept the Update prompt to receive the theme. Android may refresh launcher icons independently of website updates; there is no promise of an immediate icon change.

Launcher PNGs are rendered from the original `icons/studio-journal.svg` by `scripts/render-journal-icons.cjs`. It uses an installed `sharp` module, or a bundled module path passed through `ACTING_SHARP_PATH`; it is a development step, not a runtime app dependency.
