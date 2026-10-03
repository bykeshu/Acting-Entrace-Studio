(() => {
  const form = document.querySelector('#musicPlayerForm');
  const host = document.querySelector('#musicPlayerHost');
  const status = document.querySelector('#musicPlayerStatus');
  function stop() {
    host.replaceChildren();
    status.textContent = 'Playback stopped. Load a link to listen again.';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    let url;
    try { url = new URL(document.querySelector('#musicLink').value.trim()); } catch {
      status.textContent = 'Enter a valid YouTube Music or YouTube link.'; return;
    }
    const allowed = ['music.youtube.com', 'www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'];
    if (url.protocol !== 'https:' || !allowed.includes(url.hostname)) {
      status.textContent = 'Use an HTTPS YouTube Music or YouTube song or playlist link.'; return;
    }
    const video = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
    const list = url.searchParams.get('list');
    if ((video && !/^[\w-]{11}$/.test(video)) || (list && !/^[\w-]{1,200}$/.test(list)) || (!video && !list)) {
      status.textContent = 'Copy a song or playlist link using Share in YouTube Music.'; return;
    }
    if (location.protocol === 'file:') {
      status.textContent = 'The embedded player needs the app served over localhost or HTTPS. Open YouTube Music above when using a local file.'; return;
    }
    const embed = new URL('https://www.youtube-nocookie.com/embed/' + (video || 'videoseries'));
    if (list) embed.searchParams.set('list', list);
    const frame = document.createElement('iframe');
    frame.src = embed.href;
    frame.title = 'YouTube music live player';
    frame.allow = 'encrypted-media; fullscreen; picture-in-picture';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    frame.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;min-height:220px;border:0;margin-top:16px';
    host.replaceChildren(frame);
    status.textContent = 'Press play in the player. If YouTube reports this track is unavailable, open it in YouTube Music.';
  });
  document.querySelector('#musicStop').addEventListener('click', stop);
  new MutationObserver(() => {
    if (document.body.dataset.room !== 'music' && host.childElementCount) stop();
  }).observe(document.body, {attributes:true, attributeFilter:['data-room']});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && host.childElementCount) stop();
  });
})();
