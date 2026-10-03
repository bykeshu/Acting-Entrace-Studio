# YouTube account playlist connection

This integration uses Google Identity Services and read-only YouTube Data API access. It lists account-owned YouTube playlists, not the full YouTube Music library. OAuth does not authenticate the embedded player: private playlists, Premium benefits and restricted tracks may still require the official YouTube Music app.

## Google project setup

Configured on 3 October 2026: YouTube Data API v3 is enabled in the existing project, and the app includes its public web OAuth client ID. The JavaScript origins are `https://bykeshu.github.io` and `http://localhost:8765`. The Google application remains in Testing mode; only its configured test users can connect. No client secret is included or required.

Open Room 13 and choose **Connect Google account**. If Google sign-in needs to load, press the button again when the status says it is ready. Choose the account that was added as a test user and grant read-only YouTube access. Connection details is an optional advanced override, not a required setup step on each device. Google settings can take time to propagate after creation.

1. In Google Cloud Console, select the existing `acting-studio-entrance` project (or a project you manage) and enable **YouTube Data API v3**.
2. Configure Google Auth Platform branding, audience and consent for `https://www.googleapis.com/auth/youtube.readonly`. While in Testing, add your Google account as a test user. Follow any verification requirements Google displays before making this available to others.
3. Create an OAuth client of type **Web application**. Add `https://bykeshu.github.io` as an authorized JavaScript origin. For local preview, also add the exact localhost origin, including its port. Origins do not include a path. This popup token flow does not need a redirect URI.
4. Copy the public client ID ending in `.apps.googleusercontent.com` into Room 13 → Account connection setup. Do not enter a client secret, password or API key.
5. Save setup, press Connect Google account, then press it again when Google sign-in is ready. Choose your account and grant read-only access.

The default client ID is public app configuration shared across devices. An optional override is saved only on that device. Tokens and playlist metadata stay in page memory, are not written to local storage, study backups or Firebase, and disappear on reload. Reconnect when the token expires. Disconnect clears the page and attempts to revoke Google consent.

The integration needs an online HTTPS/localhost app. No real account connection is verified until Google project setup and human consent are completed.

References: [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [account-owned playlists](https://developers.google.com/youtube/v3/docs/playlists/list).
