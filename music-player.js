(() => {
  const M=window.ACTING_MUSIC, $=id=>document.getElementById(id), room=$('view-music'), host=$('musicPlayerHost'), status=$('musicPlayerStatus'), queue=new M.Queue();
  let player, ready=false, loading, pending, activeSource, generation=0, artGeneration=0, playing=false, embeddedList=false, refill=null, refillPending=null, queueRun=0;
  function controls(enabled){for(const id of ['musicToggle','musicPrevious','musicNext','musicShuffle','musicRepeat','musicSeek','musicVolume','musicDockToggle'])$(id).disabled=!enabled;}
  function state(on){playing=on;$('musicDockToggle').textContent=on?'Pause':'Play';room.classList.toggle('music-playing',on);$('musicToggle').textContent=on?'Ⅱ':'▶';$('musicToggle').setAttribute('aria-label',on?'Pause':'Play');}
  function dock(){
    const loaded=!!(player||pending), away=document.body.dataset.room!=='music', rect=$('musicVideoAnchor').getBoundingClientRect();
    const floating=loaded&&(away||rect.bottom<0||rect.top<0||rect.bottom>window.innerHeight);
    const target=$('musicVideoDock');target.hidden=!loaded;target.classList.toggle('music-floating',floating);
    target.style.setProperty('--music-dock-left',rect.left+'px');target.style.setProperty('--music-dock-top',rect.top+'px');target.style.setProperty('--music-dock-width',rect.width+'px');
    document.body.classList.toggle('music-dock-active',loaded&&away);
  }
  function metadata(track){
    room.classList.toggle('music-empty',false);const run=++artGeneration;
    $('musicTitle').textContent=track.title;$('musicArtist').textContent=track.artist;
    $('musicCover').hidden=true;$('musicCover').removeAttribute('src');
    $('musicOpen').href=track.id?'https://music.youtube.com/watch?v='+encodeURIComponent(track.id)+(track.list?'&list='+encodeURIComponent(track.list):''):track.list?'https://music.youtube.com/playlist?list='+encodeURIComponent(track.list):'https://music.youtube.com/';
    $('musicDockOpen').href=$('musicOpen').href;
    if(!track.art)return;const img=new Image();
    img.onload=()=>{if(run!==artGeneration)return;$('musicCover').src=track.art;$('musicCover').hidden=false;};
    img.src=track.art;
  }
  function drawQueue(){const list=$('musicQueue');list.replaceChildren();$('musicQueueCount').textContent=queue.tracks.length+' tracks · this visit';queue.tracks.forEach((track,i)=>{const button=document.createElement('button');button.type='button';button.className='music-queue-track';button.setAttribute('aria-current',String(i===queue.index));button.textContent=(i===queue.index?'● ':'')+track.title+' — '+track.artist;button.addEventListener('click',()=>{queueRun++;refillPending=null;queue.index=i;queue.resetShuffle();cueCurrent(false);});list.append(button);});}
  async function advance(ended=false){
    if(embeddedList){player.nextVideo();return;}
    if(refillPending)return;
    let next=queue.next(ended);
    if(!next&&refill){
      const run=queueRun, provider=refill, auto=ended||playing;
      status.textContent='Finding more tracks for your mix…';
      const task=Promise.resolve().then(provider);refillPending=task;
      try{const tracks=await task;if(run!==queueRun)return;queue.append(tracks||[]);drawQueue();next=queue.next(ended);if(next)cueCurrent(auto);else status.textContent='You have reached the end of this mix. Choose another mood or song.';}
      catch(error){if(run===queueRun)status.textContent=error.message;}
      finally{if(refillPending===task)refillPending=null;}
    }else if(next)cueCurrent(ended||playing);
  }
  function cueCurrent(auto){const track=queue.current();if(!track)return;embeddedList=false;activeSource={id:track.id};metadata(track);drawQueue();prepare({videoId:track.id},auto);}
  function sdk(){if(window.YT?.Player)return Promise.resolve();if(loading)return loading;loading=new Promise((resolve,reject)=>{const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve();};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{loading=null;script.remove();reject(Error('YouTube could not load. Check your connection and try again.'));};document.head.append(script);});return loading;}
  async function prepare(data,auto=false){pending={data,auto};dock();status.textContent='Loading the YouTube player…';const run=generation;try{await sdk();if(run!==generation||!pending)return;if(player&&ready){applyPending();return;}if(player)return;host.replaceChildren();const target=document.createElement('div');host.append(target);player=new YT.Player(target,{host:'https://www.youtube-nocookie.com',width:'100%',height:'240',playerVars:{origin:location.origin,playsinline:1,autoplay:0},events:{onReady:()=>{if(run!==generation)return;ready=true;controls(false);applyPending();dock();},onStateChange:e=>{if(run!==generation)return;if([1,2,3,5].includes(e.data))controls(true);state(e.data===1);status.textContent=({1:'Playing. Enjoy the moment.',2:'Paused.',3:'Buffering…',5:'Ready. Press Play to listen.',0:'This record has ended.'})[e.data]||'Ready. Press Play to listen.';if(e.data===0&&!embeddedList)advance(true);if(embeddedList&&[1,2,5].includes(e.data)){const ids=player.getPlaylist()||[];const id=ids[player.getPlaylistIndex()];if(id&&id!==activeSource?.id){activeSource={id,list:activeSource?.list};metadata({id,list:activeSource?.list,title:'Playlist track',artist:'YouTube playlist',art:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'});}}const frameTitle=player.getIframe?.()?.title;if(activeSource?.id&&frameTitle&&frameTitle!=='YouTube video player')$('musicTitle').textContent=frameTitle;},onError:e=>{if(run!==generation)return;state(false);status.textContent='YouTube cannot play this item ('+e.data+'). Try another track or open it on YouTube Music.';},onAutoplayBlocked:()=>{if(run!==generation)return;state(false);status.textContent='Press Play to start this track.';}}});}catch(error){status.textContent=error.message;}}
  function applyPending(){if(!pending)return;const {data,auto}=pending;pending=null;if(data.list){player.cuePlaylist({listType:'playlist',list:data.list});player.setShuffle(queue.shuffle);player.setLoop(queue.repeat==='all');}else if(auto&&!document.hidden)player.loadVideoById(data);else player.cueVideoById(data);status.textContent='Preparing your record…';}
  function stop(){queueRun++;refill=null;refillPending=null;room.classList.toggle('music-empty',true);generation++;pending=null;ready=false;player?.destroy();player=null;host.replaceChildren();state(false);controls(false);queue.load([]);embeddedList=false;activeSource=null;artGeneration++;$('musicCover').hidden=true;$('musicCover').removeAttribute('src');$('musicTitle').textContent='Choose your first record';$('musicArtist').textContent='A little space for whatever you feel like hearing.';$('musicSeek').value=0;$('musicElapsed').textContent='0:00';$('musicDuration').textContent='0:00';$('musicVideoDock').classList.remove('music-floating');drawQueue();dock();status.textContent='Playback cleared.';}
  $('musicPlayerForm').addEventListener('submit',event=>{event.preventDefault();try{if(location.protocol==='file:')throw Error('Open the app over localhost or HTTPS to play.');const src=M.source($('musicLink').value.trim());queueRun++;refill=null;refillPending=null;const track={id:src.id||'',list:src.list,title:src.list?'Your YouTube playlist':'Your YouTube track',artist:'Loaded from your link',art:src.id?'https://i.ytimg.com/vi/'+src.id+'/hqdefault.jpg':''};queue.load(src.list?[]:[track]);drawQueue();activeSource=src;embeddedList=!!src.list;if(embeddedList&&queue.repeat==='one'){queue.repeat='all';$('musicRepeat').textContent='↻';$('musicRepeat').setAttribute('aria-label','Repeat: all');}metadata(track);prepare(src.list?{list:src.list}:{videoId:src.id});}catch(error){status.textContent=error.message;}});
  $('musicToggle').addEventListener('click',()=>{if(!ready||$('musicToggle').disabled)return;playing?player.pauseVideo():player.playVideo();});
  $('musicDockToggle').addEventListener('click',()=>{if(!ready||$('musicDockToggle').disabled)return;playing?player.pauseVideo():player.playVideo();});
  $('musicNext').addEventListener('click',()=>advance());
  $('musicPrevious').addEventListener('click',()=>{queueRun++;refillPending=null;if(embeddedList)player.previousVideo();else if(queue.previous())cueCurrent(playing);});
  $('musicShuffle').addEventListener('click',()=>{queue.shuffle=!queue.shuffle;queue.resetShuffle();$('musicShuffle').setAttribute('aria-pressed',String(queue.shuffle));if(embeddedList)player.setShuffle(queue.shuffle);});
  $('musicRepeat').addEventListener('click',()=>{queue.repeat=embeddedList?(queue.repeat==='all'?'off':'all'):({off:'all',all:'one',one:'off'}[queue.repeat]);$('musicRepeat').textContent=queue.repeat==='one'?'↻ 1':'↻';$('musicRepeat').setAttribute('aria-pressed',String(queue.repeat!=='off'));$('musicRepeat').setAttribute('aria-label','Repeat: '+queue.repeat);if(embeddedList)player.setLoop(queue.repeat==='all');});
  $('musicSeek').addEventListener('change',()=>{if(ready)player.seekTo(Number($('musicSeek').value),true);});
  $('musicVolume').addEventListener('input',()=>{if(ready)player.setVolume(Number($('musicVolume').value));});
  $('musicStop').addEventListener('click',stop);
  setInterval(()=>{if(!ready)return;const duration=player.getDuration()||0,current=player.getCurrentTime()||0;$('musicSeek').max=duration||1;if(document.activeElement!==$('musicSeek'))$('musicSeek').value=current;$('musicElapsed').textContent=M.time(current);$('musicDuration').textContent=M.time(duration);},1000);
  new MutationObserver(dock).observe(document.body,{attributes:true,attributeFilter:['data-room']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&ready){player.pauseVideo();state(false);status.textContent='Paused while this app is hidden. Press Play to resume, or continue in YouTube Music for background listening.';}});
  new IntersectionObserver(dock,{threshold:0}).observe($('musicVideoAnchor'));
  window.addEventListener('scroll',dock,{passive:true});
  window.addEventListener('resize',dock);
  $('musicReturn').addEventListener('click',()=>{document.querySelector('.nav-item[data-view=music]').click();room.scrollIntoView({behavior:'smooth'});});
  room.classList.toggle('music-empty',true);window.ACTING_MUSIC_PLAYER={loadTracks(tracks,index=0,options={}){queueRun++;refill=options.more||null;refillPending=null;queue.load(tracks,index);cueCurrent(!!options.auto);},stop};controls(false);drawQueue();dock();
})();
