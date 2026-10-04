# Study Material library

## Bengali playwright shelf · 1 October 2026

The Study Material page now has a separate, ungraded Bengali playwright shelf covering the eight existing syllabus playwrights, Dwijendralal Ray as a supplementary historical playwright, and Kazi Nazrul Islam as an unverified dramatic-writing lead. It distinguishes the one locally hosted Bengali-playwright PDF (*Dak Ghar* in English translation), external historical-text reading, and catalogue-only leads. *Dak Ghar*, *Nabanna* and *Baaki Itihaas* retain their NSD **2026** label; the other titles are Bengal study suggestions. Source research is in `../research/BOIER_THIKANA_BENGALI_PLAYWRIGHTS_2026-10-01.md`.

Boier Thikana supplied discovery leads, including Badal Sircar, Utpal Dutt and Manoj Mitra collections. Its own rights statement does not establish permission to republish modern scans, so the site does not host or link directly to those PDFs. Publisher and Bengali Wikisource references are used where appropriate. The collection contents were not fully inspected, and the site does not claim that a listed title is already held locally. The shelf is static reading guidance; it makes no progress, quiz, practice-hour or private-history writes.

Study Material is a separate learning shelf. Resources defaults to Papers & official guidance; its second shelf contains research and institutional references. Original learning links are preserved under the library's Further reading disclosure, not deleted from seed data.

The 37 book/play cards use the public catalogue in `../data/study-material.json`: the base 2026-09-28 research plus the 2026-09-29 Bengali Natyashastra scan update. Source notes are in `../research/STUDY_MATERIAL_CATALOGUE.md`; scan provenance is preserved in `study-material/bengali-natyashastra-sources.json`. `study-material-data.js` is the direct-file/offline-compatible snapshot. Priorities are study suggestions, except the clearly cycle-labelled NSD 2026 play category. Evidence links do not imply that every book is officially prescribed. Stock and Archive borrowing availability can change.

Bengali Natyashastra Volumes 1 and 2 have external Read scan / Open PDF links. Volume 1 is catalogue-identified; Volume 2 is supported by catalogue and inspected front matter. Their personal local copies were validated on 2026-09-29: 388 and 376 pages, respectively, unencrypted; representative pages render legibly, with some blank outer leaves. A matching unnumbered scan is only **probable Volume 3**, inferred from chapters 19–27, never a verified numbered volume. Archive OCR inspection found a four-volume publisher plan but no explicit third-volume statement. Renewed multilingual/metadata searches found no matching Bengali Volume 4 scan; it has only a retail edition record. No full scan is publicly hosted or precached here. The duplicate DLI records' “In Public Domain” statement is source metadata, not our independent copyright determination; redistribution permission remains unconfirmed. Scans carry no ISBN inferred from a modern retail reprint. External reading requires internet access.

## Personal local scan adapter

Open `index.html` directly as a file on this laptop to see **Open personal local PDF** on the Volume 1 and 2 Natyashastra cards and the *বাংলা নাটকের ইতিহাস* card. The ignored `study-material-local.js` adapter maps their stable IDs to PDFs in the sibling `../study-material/archive-scans/` folder, outside this public repository. It loads only on `file:` pages, never on HTTP/HTTPS or hosted previews. Keep the parent folder layout when moving the local app. External Archive record/PDF links remain available alongside the local action. There is no personal local button for probable Volume 3 or Volume 4.

The adapter and any accidentally copied `study-material/archive-scans/` folder are ignored by Git. Neither is included in the service-worker shell or GitHub Pages' tracked-files-only `git archive HEAD` deployment. The public source pack contains scan validation and provenance, but not personal file paths. No scan binaries were copied into the repository.

No progress schema, stable record ID, authentication, Firebase rules, film history or notes are changed. Viewing, searching, filtering and opening a book do not mark it read or write progress.

An Actor's Work also has a secondary **Publisher preview (77 pages)** link to the Pageplace distributor PDF, checked 2026-09-28. It is an excerpt, not the full book. The downloaded private/local preview is not copied into this repository or precached. Its original Archive borrowing and edition actions are unchanged. The Deccan College Ghosh Natyasastra Volume 2 PDF lead redirects to an error page and is not presented as a working download.

## Public-domain editions

Six previously verified historical/public-domain PDFs were copied, byte-for-byte, from `../study-material/open-texts/` into the same relative directory inside the dashboard. The public-domain, open-access 74-page *Oedipus Rex* PDF from eCampusOntario was added on 2026-10-01, so there are now seven app-hosted PDFs. Originals were left untouched. Each card links its provenance in the catalogue's source record; modern copyrighted books remain external preview/borrow, publisher or catalogue links, never hosted copies. A rights-unverified Archive record is labelled View record, never Download.

These scans total about 68 MB. They are not downloaded at installation. Opening one online caches the full file for later offline use, subject to browser storage availability. This PDF cache is independent of weekly shell/theme updates; clearing site storage also clears it. Ibsen and Ryder are collections, visibly labelled on their cards.

SHA-256 of the seven copies (also verified against originals):

| File | SHA-256 |
| --- | --- |
| Aristotle_Poetics_Margoliouth_1911.pdf | 23F77B9367549851124212D9EDC2DB1557291C275B074CE35A0B57C0186EA679 |
| Chekhov_Three_Sisters_1922.pdf | 1295F60883404DF705DFFABEBFB037C84A9DEB0D6C00A3024245B22416582D01 |
| Ibsen_A_Dolls_House_1903_collection.pdf | BC8EF25AFAAC90EAFB73FCC850312AF5159EFBEA9B4680772D3777CFA7DFD343 |
| Kalidasa_Shakuntala_Ryder_1912.pdf | 4E2B525B44AFE30646157FD16DA8B3D6265090E8494840BCEED12FD66D960A71 |
| Oedipus_Rex_Storr_eCampusOntario.pdf | 8DACCC584F6601BBDAF538B415902E46E239913CAB099317162B001A61215CC4 |
| Shakespeare_Macbeth_1900.pdf | AB8EC95158589BE538BB5E52AABE3C59B2CCFAA22F28BFA7E57F2B37228CAF93 |
| Tagore_The_Post_Office_1914.pdf | 93B955EF41E4DE57638DE73DA159EA1F2A579944288BF9E6ED43D8E28CA6CA56 |

## Free-resource update - 4 October 2026

The catalogue now has 50 cards: the previous 37 plus 13 supplementary resources. Three complete open-licensed PDFs are hosted in the app, bringing its PDF shelf to ten files. Seven IGNOU course-material leads and three publisher/OER leads are labelled External PDF lead (unverified); none is represented as a working download or app-hosted file. Opening links does not write progress.

The new PDFs are cached on first opening, independently of the shell update. No new PDF is precached at installation. The catalogue preserves the original verification dates and adds a separate free-resource date.

| New PDF | Pages | Licence | SHA-256 |
| --- | --- | --- | --- |
| Theatrical Worlds (Beta Version) | 277 | Modified CC BY-NC-ND 3.0: electronic sharing permitted with attribution; printing rights reserved by publisher. | DC6AF1431B4F397B4608C53EC9F3F59DDD4928BBE9FF02C44F417DD0A226A79B |
| Exploring Movie Construction and Production: What's so exciting about movies? | 94 | CC BY-NC-SA 4.0, except where otherwise noted. | 789D951902D630BEAFBB81EC77253CFB2C52111595066EAE97715C9E6983A258 |
| Actors and the Art of Performance: Under Exposure | 131 | CC BY 4.0, except where otherwise noted. | C9BA17D4B1AA6E4824FFDAEF9462078453B62151C4CF2C5CA7472E4D8396C6E6 |

Theatrical Worlds reserves printing rights to University Press of Florida; its permission for electronic sharing allows the unmodified app copy. Reich is CC BY-NC-SA 4.0 and Granzer CC BY 4.0, except for separately credited content. Licence notices remain inside each original PDF, and source/licence links are visible on the cards.
