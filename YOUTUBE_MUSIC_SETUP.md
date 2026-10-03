# YouTube listening room

Room 13 uses an original vinyl interface with the official YouTube IFrame player. Paste a YouTube or YouTube Music track/playlist link, load the record, then press Play. The video remains visible; a small video dock follows scrolling. Playback pauses when the room or browser tab is left. Shuffle, repeat, previous/next, seeking and volume use the official player API; queues built from search or playlist tracks also support repeat-one. A pasted playlist supports repeat-all/off.

Connect Google account to search music-category YouTube videos and browse account-owned YouTube playlists. Sign-in loads on the first click; click Connect again once ready. Read-only scope: `https://www.googleapis.com/auth/youtube.readonly`. Account tokens, API results and the listening queue are held only in memory and clear on refresh or disconnect. The public browser OAuth client is configured for `https://bykeshu.github.io` and `http://localhost:8765`. No browser client secret is used. The Google app is in testing; only registered test users can currently consent.

This is a custom YouTube-powered player, with limits: Google does not expose the complete YouTube Music personalised home, saved albums or Music library through these APIs. Playlist ownership differs from saved/subscribed playlists. Playback availability and embedding restrictions still apply. Track artwork uses the thumbnail supplied by YouTube and may be a video image rather than an album cover. Artwork colours are sampled locally; unavailable images fall back to the room's neutral palette. Search happens only on explicit submission or a mood-button click to conserve quota. More-results replaces the current search result page. Private playlists may require opening YouTube Music.

Disconnect clears account results and playback and requests Google permission revocation. Listening never creates study credit, watched history, logs or public records. Existing study/Firebase sign-in is separate.

## Maintenance

Public deployment includes versioned music assets and a new service-worker cache. After deployment, close and reopen all installed app windows and reload the website to allow the new worker to take over; do not clear site data, which contains personal progress. A deployment to the website is required before Chrome or the installed PWA receives the feature.

Daily cloud maintenance is already configured separately. It can test public source and propose repairs; it cannot run the laptop while offline or asleep, complete Google consent, or guarantee music availability.

Official references: [IFrame player API](https://developers.google.com/youtube/iframe_api_reference), [YouTube search](https://developers.google.com/youtube/v3/docs/search/list), [owned playlists](https://developers.google.com/youtube/v3/docs/playlists/list), [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
