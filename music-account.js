(() => {
  const scope = 'https://www.googleapis.com/auth/youtube.readonly';
  const status = document.querySelector('#musicAccountStatus');
  const playlists = document.querySelector('#musicPlaylists');
  const connect = document.querySelector('#musicConnect');
  const disconnect = document.querySelector('#musicDisconnect');
  const more = document.querySelector('#musicMore');
  const input = document.querySelector('#musicClientId');
  const key = 'acting-youtube-oauth-client-v1';
  // Public browser client ID; the client secret is never needed by this app.
  const defaultClientId = '1085322780975-maflpvek590kd8rke0rq3v6bsc7i8jll.apps.googleusercontent.com';
  let token = '', expires = 0, generation = 0, next = '', loading = false, sdk;
  input.value = defaultClientId;
  try { input.value = localStorage.getItem(key) || defaultClientId; } catch {}
  function clear(message) {
    generation++; token = ''; expires = 0; next = ''; loading = false;
    playlists.replaceChildren(); disconnect.hidden = true; more.hidden = true;
    connect.disabled = false; status.textContent = message;
  }
  document.querySelector('#musicSaveClient').addEventListener('click', () => {
    if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(input.value.trim())) {
      status.textContent = 'Enter a Google web OAuth client ID, not an API key or client secret.'; return;
    }
    try { localStorage.setItem(key, input.value.trim()); status.textContent = 'Connection setup saved. Press Connect Google account.'; }
    catch { status.textContent = 'Setup could not be saved; you can still connect for this visit.'; }
  });
  function loadSdk() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    if (!sdk) sdk = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = () => { script.remove(); sdk = null; reject(new Error('Google sign-in could not load. Check your connection and try again.')); };
      document.head.append(script);
    });
    return sdk;
  }
  async function loadPlaylists() {
    if (loading) return;
    if (!token || Date.now() >= expires) { clear('Your connection expired. Connect again to continue.'); return; }
    const run = generation, access = token;
    loading = true; more.disabled = true; status.textContent = 'Loading account playlists…';
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
      url.search = new URLSearchParams({part:'snippet,contentDetails',mine:'true',maxResults:'50',...(next ? {pageToken:next} : {})});
      const response = await fetch(url, {headers:{Authorization:'Bearer ' + access},cache:'no-store',credentials:'omit'});
      if (run !== generation) return;
      if (response.status === 401) { clear('Your connection expired. Connect again.'); return; }
      if (!response.ok) throw new Error(response.status === 403 ? 'Playlist access was denied. Check consent, API enablement and quota in the Google project.' : 'Playlists could not load. Try connecting again.');
      const data = await response.json();
      if (run !== generation) return;
      for (const item of data.items || []) {
        if (!/^[\w-]{1,200}$/.test(item.id)) continue;
        const row = document.createElement('div'); row.className = 'panel';
        const title = document.createElement('p'); title.textContent = item.snippet?.title || 'Untitled playlist';
        const play = document.createElement('button'); play.type = 'button'; play.className = 'quiet'; play.textContent = 'Load in player';
        play.addEventListener('click', () => {
          document.querySelector('#musicLink').value = 'https://music.youtube.com/playlist?list=' + encodeURIComponent(item.id);
          document.querySelector('#musicPlayerForm').requestSubmit();
        });
        const link = document.createElement('a'); link.textContent = 'Open in YouTube Music ↗';
        link.href = 'https://music.youtube.com/playlist?list=' + encodeURIComponent(item.id); link.target = '_blank'; link.rel = 'noopener noreferrer';
        row.append(title, play, document.createTextNode(' '), link); playlists.append(row);
      }
      next = data.nextPageToken || ''; more.hidden = !next;
      status.textContent = playlists.childElementCount ? 'Account playlists loaded. Private playlists may require playback on YouTube Music.' : 'No account-owned playlists were returned. Saved Music albums and recommendations are not included.';
    } catch (error) { if (run === generation) status.textContent = error.message; }
    finally { if (run === generation) { loading = false; more.disabled = false; } }
  }
  connect.addEventListener('click', async () => {
    if (location.protocol === 'file:') { status.textContent = 'Account linking requires localhost or the HTTPS app.'; return; }
    const clientId = input.value.trim();
    if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
      status.textContent = 'Google account connection needs the app’s OAuth client ID. Open Account connection setup.'; return;
    }
    // Load first, then require another user click so popup creation keeps a user gesture.
    if (!window.google?.accounts?.oauth2) {
      connect.disabled = true;
      try { await loadSdk(); status.textContent = 'Google sign-in is ready. Press Connect Google account to choose your account.'; }
      catch (error) { status.textContent = error.message; }
      finally { connect.disabled = false; }
      return;
    }
    clear('Choose your Google account and grant read-only YouTube access.');
    const run = generation;
    const client = google.accounts.oauth2.initTokenClient({
      client_id:clientId,scope,include_granted_scopes:false,
      callback: response => {
        if (run !== generation) return;
        if (response.error || !response.access_token || !google.accounts.oauth2.hasGrantedAllScopes(response, scope)) {
          clear('Connection was not granted. You can still use song and playlist links.'); return;
        }
        token = response.access_token; expires = Date.now() + Number(response.expires_in || 3600) * 1000;
        disconnect.hidden = false; loadPlaylists();
      },
      error_callback: () => { if (run === generation) clear('Sign-in closed or blocked. Press Connect to try again.'); }
    });
    client.requestAccessToken({prompt:'select_account'});
  });
  more.addEventListener('click', loadPlaylists);
  disconnect.addEventListener('click', () => {
    const access = token;
    clear('Disconnected. Account playlists cleared from this page.');
    document.querySelector('#musicStop').click();
    if (access && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(access, result => {
      if (!result.successful) status.textContent = 'Disconnected locally. To remove Google permission, visit your Google Account’s third-party connections.';
    });
  });
})();
