(() => {
  const core=window.ACTING_JOURNAL,store=window.ACTING_FILM_STORE;
  const $=s=>document.querySelector(s),form=$('#journalForm');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const catalogue=[...window.ACTING_BUCKET.films.map(f=>({...f,filmKey:core.identity(f)})),...window.ACTING_CINEMA.films.map(f=>({...f,filmKey:`cinema-watched:${f.id}`}))];
  let selected=null,request=0,searchBusy=false,artRequest=0,artBusy=false,draftFullPoster='';
  const artwork=f=>core.poster(f,store.read());
  const thoughtDrafts=new Map();
  function thoughtMarkup(s,i){
    const draft=thoughtDrafts.get(s.id);
    return `<details class="diary-afterword" data-journal-thought="${esc(s.id)}"${draft?.open?' open':''}><summary>${s.note?'My thought ↗':'Leave a thought ↗'}</summary>${s.note?`<blockquote class="diary-carved" tabindex="0">${esc(s.note)}</blockquote>`:''}<form data-journal-note="${esc(s.id)}"><label for="journalThought-${i}">What stayed with me?</label><textarea id="journalThought-${i}" name="thought" rows="4" maxlength="3000" placeholder="A realization, an epiphany, a moment. Or nothing at all.">${esc(draft?draft.value:s.note||'')}</textarea><small>Optional · private · not homework.</small><div class="diary-thought-actions"><button type="submit">Save thought ↗</button><button type="button" data-thought-cancel>Cancel</button></div><p class="diary-thought-status" role="status"></p></form></details>`;
  }
  const posterDialog=$('#journalPosterDialog'),fullPoster=$('#journalFullPoster');
  function viewPoster(s){
    const art=artwork(s);if(!art)return;
    $('#journalPosterHeading').textContent=s.title+(s.year?' ('+s.year+')':'');
    fullPoster.alt='Poster artwork for '+s.title;fullPoster.hidden=false;fullPoster.src=art.url;
    $('#journalFullPosterCredit').innerHTML=art.source?`<a href="${esc(art.source)}" target="_blank" rel="noopener noreferrer">${esc(art.credit)} ↗</a>`:esc(art.credit);
    $('#journalFullPosterStatus').textContent='Full artwork, without the card overlay or crop.';
    if(!posterDialog.open)posterDialog.showModal();
  }
  fullPoster.onerror=()=>{fullPoster.hidden=true;$('#journalFullPosterStatus').textContent='This artwork could not load. Use its credited source link, or choose another poster.';};
  $('#journalPosterClose').onclick=()=>posterDialog.close();
  posterDialog.addEventListener('click',e=>{if(e.target===posterDialog)posterDialog.close();});
  posterDialog.addEventListener('close',()=>{fullPoster.removeAttribute('src');});
  function dateState(){const unknown=form.elements.watchedDateUnknown.checked;form.elements.date.disabled=unknown;form.elements.date.required=!unknown;}
  form.elements.watchedDateUnknown.addEventListener('change',dateState);
  function handoff(s){
    if(s.letterboxdStatus==='observed')return `<details><summary>From your Letterboxd watched list</summary><p>Checked during import, not continuously live-linked. Already on Letterboxd; excluded from pending exports.</p><a href="${esc(core.uri(s.letterboxdURI))}" target="_blank" rel="noopener noreferrer">Film on Letterboxd ↗</a></details>`;
    return `<details><summary>Letterboxd handoff</summary><p>${s.letterboxdStatus==='confirmed'?'Marked imported by you — not remotely verified.':!s.date?'Watched date not recorded. Add a date before a diary export.':'Not posted to Letterboxd. Export the pending diary CSV, check its matches, then confirm there.'}</p><button type="button" class="text-btn" data-journal-confirm="${esc(s.id)}">${s.letterboxdStatus==='confirmed'?'Return to pending':'I imported this entry'}</button></details>`;
  }
  function setColours(p){for(const [key,name] of [['ink','posterInk'],['text','posterText'],['accent','posterAccent']])form.elements[name].value=p[key];}
  function artworkValues(){const v=Object.fromEntries(new FormData(form));return {...v,posterVariants:core.variants(v.posterVariants),posterPalette:{ink:v.posterInk,text:v.posterText,accent:v.posterAccent}};}
  function clearPreview(){const p=$('#journalPosterPreview');p.hidden=true;p.innerHTML='';$('#journalPosterStatus').textContent='';}
  function artMarkup(s){
    const art=artwork(s);if(!art)return '';
    return `<img class="diary-poster" src="${esc(art.url)}" data-art-source="${esc(art.source)}" data-art-credit="${esc(art.credit)}" alt="" aria-hidden="true" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  }
  function cardMarkup(s,i=0,withJournal=true){
    const art=artwork(s),p=art?.palette;
    const credit=art?`<small class="diary-art-credit">${art.source?`<a href="${esc(art.source)}" target="_blank" rel="noopener noreferrer">${esc(art.credit)} ↗</a>`:esc(art.credit)}</small>`:'';
    return `<article class="diary-card${art?' poster-card':''}" data-card="${i%4}"${art?` data-journal-art="${esc(s.id)}"`:''}${p?` style="--poster-ink:${p.ink};--poster-text:${p.text};--poster-accent:${p.accent}"`:''}>${artMarkup(s)}<div class="diary-ticket"><span>${s.watchedDateUnknown?'WATCHED / DATE NOT RECORDED':'ADMIT ONE / '+esc(s.date)}</span><span>${s.rewatch?'REWATCH':'A VIEWING'}</span></div><span class="diary-reel" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div class="diary-content"><h3>${esc(s.title)}</h3>${withJournal?thoughtMarkup(s,i):''}<p class="diary-year">${esc(s.year||'Edition not specified')}</p><p class="diary-rating" aria-label="${s.rating==null?'No rating':esc(s.rating)+' out of five stars'}">${s.rating==null?'UNRATED':esc(s.rating)+' / 5 ★'}</p><div class="meta">${(s.genres||[]).map(g=>`<span class="tag">${esc(g)}</span>`).join('')}</div>${handoff(s)}<button type="button" class="text-btn" data-journal-edit="${esc(s.id)}">Edit this card ↗</button>${s.posterVariants?.length?`<button type="button" class="text-btn" data-journal-poster="${esc(s.id)}">Change poster ↻</button>`:''}${art?`<button type="button" class="text-btn" data-journal-view="${esc(s.id)}">View poster ↗</button>`:''}${credit}</div></article>`;
  }
  function loadArtwork(root,onLoad,onError){
    root.querySelectorAll('.diary-poster').forEach(img=>{
      const loaded=()=>{img.closest('.diary-card').classList.add('has-poster');onLoad?.();};
      const failed=()=>{img.closest('.diary-card').classList.remove('has-poster','poster-card');img.hidden=true;onError?.();};
      img.addEventListener('load',loaded,{once:true});img.addEventListener('error',failed,{once:true});
      if(img.complete&&img.naturalWidth)loaded();
    });
  }
  $('#journalTitles').innerHTML=[...new Set(catalogue.map(f=>f.title))].map(t=>`<option value="${esc(t)}"></option>`).join('');
  function choose(f){
    artRequest++;artBusy=false;draftFullPoster='';
    selected=f;
    form.elements.title.value=f.title;
    form.elements.year.value=f.year||'';
    form.elements.genres.value=(f.genres||[]).join(', ');
    form.elements.letterboxdURI.value=f.letterboxdURI||'';
    form.elements.posterURL.value=core.imageURL(f.posterURL);
    form.elements.posterSourceURL.value=core.imageURL(f.posterSourceURL);
    form.elements.posterCredit.value=f.posterCredit||'';
    form.elements.posterHidden.checked=!!f.posterHidden;
    form.elements.posterData.value=core.posterData(f.posterData);
    form.elements.posterAssetId.value=f.posterAssetId||'';
    form.elements.posterVariantIndex.value=f.posterVariantIndex||0;
    form.elements.posterVariants.value=JSON.stringify(f.posterVariants||[],null,2);
    form.elements.watchedDateUnknown.checked=!!f.watchedDateUnknown;
    form.elements.letterboxdObserved.checked=f.letterboxdStatus==='observed';dateState();
    setColours(core.palette(f.posterPalette)||artwork({...f,posterHidden:false})?.palette||{ink:'#111111',text:'#ffffff',accent:'#ff9b86'});
    clearPreview();
    $('#journalIdentity').textContent=f.wikidataId?`Selected Wikidata ${f.wikidataId} · check the edition/year before saving.`:'Selected from your shelf · confirm the edition/year if known.';
  }
  function offer(f){
    form.reset();choose(f);form.elements.date.value=store.today();
    store.open('journal');$('#journalForm').scrollIntoView({behavior:'smooth',block:'start'});form.elements.rating.focus();
    $('#journalStatus').textContent='How did it feel? Choose a rating or No rating. A watched tick is saved already; a dated diary card is saved only when you confirm.';
  }
  function render(){
    const sessions=store.read(),diary=sessions.filter(s=>s.mode==='Film diary').slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))),list=core.watchlist(window.ACTING_BUCKET.films,sessions,store.watched());
    const q=$('#journalFilter').value.trim().toLowerCase(),shown=diary.filter(s=>`${s.title} ${s.year} ${(s.genres||[]).join(' ')} ${s.note}`.toLowerCase().includes(q));
    $('#journalCount').textContent=`${diary.length} viewings · ${list.length} on your watchlist · pleasure is not productivity`;
    $('#journalCards').innerHTML=shown.length?shown.map((s,i)=>cardMarkup(s,i)).join(''):'<div class="journal-empty"><span aria-hidden="true">✳</span><h3>THE END.<br>OR A BEGINNING.</h3><p>Your first film card goes here. Nothing to analyse. Just your cinema.</p></div>';
    loadArtwork($('#journalCards'));
    $('#journalWatchlist').innerHTML=list.map(f=>`<div class="watch-ticket"><div><strong>${esc(f.title)}</strong><small>${esc(f.year||'Confirm edition in Letterboxd')}${f.genres?.length?' · '+esc(f.genres.join(', ')):''}</small></div><button type="button" class="text-btn" data-journal-watch="${esc(f.filmKey)}">Watched ↗</button></div>`).join('')||'<p class="empty">An empty watchlist is fine too.</p>';
    $('#journalPending').textContent=`${diary.filter(core.pending).length} dated diary entries pending handoff · ${diary.filter(s=>s.letterboxdStatus==='observed').length} checked Letterboxd imports. Exports never include your private moments or genres as reviews/tags.`;
  }
  function values(){
    const v=artworkValues();
    const f=selected?.title===v.title?selected:catalogue.find(f=>f.title.toLowerCase()===v.title.trim().toLowerCase());
    return {...v,filmKey:f?.filmKey,wikidataId:f?.wikidataId,entryNote:f?.entryNote};
  }
  function save(watchlist=false){
    try{
      if(artBusy)throw Error('Please wait for the poster to finish processing before saving.');
      const v=values(),editing=form.elements.entryId.value;
      const record=core.entry(v,{id:watchlist?crypto.randomUUID():editing||crypto.randomUUID(),date:store.today(),watchlist});
      if(!watchlist && store.read().some(s=>s.mode==='Film diary'&&s.id!==record.id&&core.sameFilm(s,record)&&(s.date===record.date||(!record.date&&record.letterboxdStatus==='observed')))){throw Error('This viewing already has a card. Edit it instead of importing the same film twice.');}
      const chunks=draftFullPoster?core.artworkChunks(draftFullPoster,{id:`poster:${crypto.randomUUID()}`,date:store.today()}):[];
      if(chunks.length)record.posterAssetId=chunks[0].posterAssetId;
      store.put(record,chunks);draftFullPoster='';
      if(!watchlist)store.mark(record.filmKey,true);
      form.reset();dateState();clearPreview();form.elements.date.value=store.today();selected=null;$('#journalIdentity').textContent='Manual entry works offline. Metadata is optional.';
      $('#journalStatus').textContent=watchlist?'Added to your private watchlist. Export watchlist CSV to add it to Letterboxd.':record.letterboxdStatus==='observed'?'Your checked Letterboxd import is saved privately and queued for app-account sync. Already listed as watched there; excluded from pending exports.':'Saved to your private app logbook and queued for app-account sync. Letterboxd has NOT been updated: complete its separate handoff.';
      render();
    }catch(e){$('#journalStatus').textContent=e.message;}
  }
  form.addEventListener('submit',e=>{e.preventDefault();save();});
  $('#journalAddWatchlist').onclick=()=>save(true);
  form.elements.title.addEventListener('input',()=>{request++;artRequest++;artBusy=false;draftFullPoster='';selected=null;form.elements.entryId.value='';form.elements.posterURL.value='';form.elements.posterSourceURL.value='';form.elements.posterCredit.value='';form.elements.posterData.value='';form.elements.posterAssetId.value='';form.elements.posterVariants.value='';form.elements.posterVariantIndex.value=0;form.elements.posterHidden.checked=false;clearPreview();$('#journalMatches').innerHTML='';$('#journalIdentity').textContent='Manual entry works offline. Metadata is optional.';});
  form.elements.title.addEventListener('change',()=>{const f=catalogue.find(f=>f.title.toLowerCase()===form.elements.title.value.trim().toLowerCase());if(f)choose(f);});
  $('#journalReset').onclick=()=>{artRequest++;artBusy=false;draftFullPoster='';form.reset();dateState();clearPreview();selected=null;form.elements.date.value=store.today();$('#journalStatus').textContent='New card — previous saved cards are unchanged.';};
  function readImage(url,cors=false){return new Promise((resolve,reject)=>{
    const img=new Image(),timer=setTimeout(()=>{img.src='';reject(Error('Image lookup timed out. Upload the poster instead.'));},12000);
    if(cors)img.crossOrigin='anonymous';img.referrerPolicy='no-referrer';
    img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(Error('This host blocks image loading or colour sampling. Upload the poster or choose colours manually.'));};img.src=url;
  });}
  function sampleColours(img){const canvas=document.createElement('canvas');canvas.width=64;canvas.height=96;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0,64,96);return core.paletteFromPixels(context.getImageData(0,0,64,96).data);}
  function compactJPEG(img,highQuality=false){
    if(img.naturalWidth*img.naturalHeight>24000000)throw Error('Please choose a poster smaller than 24 megapixels.');
    const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
    for(const longest of highQuality?[1280,1080,960,800,720]:[720,600,480,360,280]){
      const scale=Math.min(1,longest/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));context.fillStyle='#111111';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(img,0,0,canvas.width,canvas.height);
      for(const quality of highQuality?[.9,.85,.8]:[.8,.65,.5,.35]){const data=canvas.toDataURL('image/jpeg',quality);if(highQuality?core.fullPosterData(data):core.posterData(data))return data;}
    }
    throw Error('Could not fit this artwork into a safe sync-sized thumbnail. Try a smaller image.');
  }
  $('#journalPosterFile').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;const mine=++artRequest;artBusy=true;clearPreview();$('#journalPosterStatus').textContent='Preparing your private poster and picking its colours…';let url;
    try{
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12000000)throw Error('Choose a JPG, PNG or WebP image smaller than 12 MB.');
      url=URL.createObjectURL(file);const img=await readImage(url),data=compactJPEG(img),full=compactJPEG(img,true),p=sampleColours(img);if(mine!==artRequest)return;
      draftFullPoster=full;form.elements.posterAssetId.value='';form.elements.posterVariantIndex.value=0;
      form.elements.posterData.value=data;form.elements.posterURL.value='';form.elements.posterSourceURL.value='';form.elements.posterCredit.value='Your chosen poster · rights belong to its owner';form.elements.posterHidden.checked=false;setColours(p);
      $('#journalPreviewPoster').click();$('#journalPosterStatus').textContent='Higher-quality poster and palette ready. Save to keep them privately; the original file is not uploaded.';
    }catch(error){if(mine===artRequest)$('#journalPosterStatus').textContent=error.message;}
    finally{if(url)URL.revokeObjectURL(url);if(mine===artRequest)artBusy=false;}
  };
  $('#journalRemovePosterFile').onclick=()=>{artRequest++;artBusy=false;draftFullPoster='';form.elements.posterData.value='';form.elements.posterAssetId.value='';$('#journalPosterFile').value='';clearPreview();$('#journalPosterStatus').textContent='Uploaded artwork removed from this draft. Save to update the card; an existing default cover may return.';};
  $('#journalMatchPosterColours').onclick=async()=>{
    if(artBusy)return;let art;try{art=artwork({...artworkValues(),posterHidden:false});}catch(e){$('#journalPosterStatus').textContent=e.message;return;}if(!art){$('#journalPosterStatus').textContent='Upload or link a poster first.';return;}const mine=++artRequest;artBusy=true;$('#journalPosterStatus').textContent='Picking contrasting colours from your poster…';
    try{const img=await readImage(art.url,!art.uploaded);const p=sampleColours(img);if(mine!==artRequest)return;setColours(p);$('#journalPreviewPoster').click();}
    catch(error){if(mine===artRequest)$('#journalPosterStatus').textContent=error.message;}
    finally{if(mine===artRequest)artBusy=false;}
  };
  form.elements.posterURL.addEventListener('input',()=>{artRequest++;artBusy=false;draftFullPoster='';form.elements.posterAssetId.value='';form.elements.posterVariantIndex.value=0;form.elements.posterData.value='';$('#journalPosterFile').value='';clearPreview();});
  $('#journalPreviewPoster').onclick=()=>{
    clearPreview();let v;try{v=artworkValues();}catch(e){$('#journalPosterStatus').textContent=e.message;return;}
    if(v.posterURL?.trim()&&!core.imageURL(v.posterURL)){$('#journalPosterStatus').textContent='Use a public HTTPS image URL without credentials or a custom port.';return;}
    const art=artwork(v);if(!art){$('#journalPosterStatus').textContent=v.posterHidden?'Text-only selected.':'No built-in cover for this film yet. Paste a direct poster-image link, or keep your paper card.';return;}
    if(!core.palette(v.posterPalette)){$('#journalPosterStatus').textContent='These colours need more contrast. Match poster colours or choose lighter text and a darker background.';return;}
    const p=$('#journalPosterPreview');p.hidden=false;p.innerHTML=cardMarkup({...v,id:'preview-only',title:v.title||'Your film',date:v.date||store.today(),rating:v.rating&&v.rating!=='none'?Number(v.rating):null,genres:[]},0,false);
    p.querySelectorAll('button').forEach(b=>b.remove());p.querySelector('details')?.remove();
    loadArtwork(p,()=>{$('#journalPosterStatus').textContent='Backdrop preview only — save the card to keep your choice.';},()=>{$('#journalPosterStatus').textContent='Image unavailable or blocked by its host. The paper card still works; try another image link.';});
  };
  $('#journalFilter').addEventListener('input',render);
  $('#journalCards').addEventListener('toggle',e=>{
    const details=e.target;if(!details.matches('[data-journal-thought]')||!details.isConnected)return;
    const id=details.dataset.journalThought,s=store.read().find(s=>s.id===id&&s.mode==='Film diary');
    if(s&&(details.open||thoughtDrafts.has(id)))thoughtDrafts.set(id,{...(thoughtDrafts.get(id)||{value:s.note||'',baseNote:s.note||''}),open:details.open});
  },true);
  $('#journalCards').addEventListener('input',e=>{
    const f=e.target.closest('[data-journal-note]');if(!f||e.target.name!=='thought')return;
    const id=f.dataset.journalNote,s=store.read().find(s=>s.id===id&&s.mode==='Film diary');
    if(s)thoughtDrafts.set(id,{value:e.target.value,baseNote:thoughtDrafts.get(id)?.baseNote??s.note??'',open:true});
  });
  $('#journalCards').addEventListener('submit',e=>{
    const f=e.target.closest('[data-journal-note]');if(!f)return;e.preventDefault();
    const id=f.dataset.journalNote,s=store.read().find(s=>s.id===id&&s.mode==='Film diary'),draft=thoughtDrafts.get(id),status=f.querySelector('[role="status"]');
    try{
      if(draft&&(s?.note||'')!==draft.baseNote)throw Error('This thought changed on another device. Your draft is safe here: copy it, then Cancel to reload the latest thought.');
      store.put(core.withThought(s,f.elements.thought.value));thoughtDrafts.delete(id);render();
      $('#journalStatus').textContent='Your thought is carved into this film deck and saved privately. It uses existing account sync and backups; nothing was posted to Letterboxd.';
      $('#journalCards').querySelectorAll('[data-journal-thought]').forEach(d=>{if(d.dataset.journalThought===id)d.querySelector('summary').focus({preventScroll:true});});
    }catch(error){status.textContent=error.message;}
  });
  $('#journalWatchlist').addEventListener('click',e=>{const key=e.target.closest('[data-journal-watch]')?.dataset.journalWatch;const f=core.watchlist(window.ACTING_BUCKET.films,store.read(),store.watched()).find(f=>f.filmKey===key);if(f)offer(f);});
  $('#journalCards').addEventListener('click',e=>{
    const thoughtSummary=e.target.closest('[data-journal-thought] > summary');
    if(thoughtSummary){
      e.preventDefault();const details=thoughtSummary.parentElement,id=details.dataset.journalThought,s=store.read().find(s=>s.id===id&&s.mode==='Film diary');
      details.open=!details.open;
      // Capture the disclosure state immediately; native toggle events are queued and can lose a race with sync renders.
      if(s)thoughtDrafts.set(id,{...(thoughtDrafts.get(id)||{value:s.note||'',baseNote:s.note||''}),open:details.open});
      return;
    }
    if(e.target.closest('[data-thought-cancel]')){const f=e.target.closest('[data-journal-note]'),id=f.dataset.journalNote;thoughtDrafts.delete(id);f.elements.thought.value=store.read().find(s=>s.id===id)?.note||'';f.querySelector('[role="status"]').textContent='';f.closest('details').open=false;f.closest('details').querySelector('summary').focus({preventScroll:true});return;}
    const view=e.target.closest('[data-journal-view]')?.dataset.journalView||(!e.target.closest('button,a,summary,details,input,textarea,select,.diary-moment')?e.target.closest('[data-journal-art]')?.dataset.journalArt:null);
    if(view){const s=store.read().find(s=>s.mode==='Film diary'&&s.id===view);if(s)viewPoster(s);return;}
    const swap=e.target.closest('[data-journal-poster]')?.dataset.journalPoster;
    if(swap){const s=store.read().find(s=>s.mode==='Film diary'&&s.id===swap);if(s?.posterVariants?.length){try{store.put({...s,...core.nextPoster(s)});render();$('#journalStatus').textContent='Random poster selected from your '+(s.posterVariants.length+1)+' saved choices. The selection syncs privately; this is not a fresh internet search.';}catch(error){$('#journalStatus').textContent=error.message;}}return;}
    const edit=e.target.closest('[data-journal-edit]')?.dataset.journalEdit,confirmed=e.target.closest('[data-journal-confirm]')?.dataset.journalConfirm;
    const s=store.read().find(s=>s.mode==='Film diary'&&s.id===(edit||confirmed));if(!s)return;
    if(confirmed){store.put({...s,letterboxdStatus:s.letterboxdStatus==='confirmed'?'diary-pending':'confirmed'});render();return;}
    form.reset();choose(s);form.elements.entryId.value=s.id;form.elements.date.value=s.date;form.elements.rating.value=s.rating==null?'none':String(s.rating);form.elements.note.value=s.note||'';form.elements.rewatch.checked=!!s.rewatch;form.scrollIntoView({behavior:'smooth'});form.elements.title.focus();
  });
  function download(text,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('#journalExportDiary').onclick=()=>{const pending=store.read().filter(core.pending),rows=core.exportable(pending);if(!rows.length){$('#journalExportStatus').textContent='No eligible pending dated diary entries. Checked Letterboxd imports and undated watches are excluded; scoped entries need an exact film link.';return;}download(core.csv(rows,true),`letterboxd-diary-${store.today()}.csv`);$('#journalExportStatus').textContent=`${rows.length} entries downloaded only; nothing posted. ${pending.length-rows.length} scoped entries omitted. Import to your profile, review matches, then confirm there. Dates/watched status may be publicly visible.`;};
  $('#journalExportWatchlist').onclick=()=>{const list=core.watchlist(window.ACTING_BUCKET.films,store.read(),store.watched()),rows=core.exportable(list);if(!rows.length){$('#journalExportStatus').textContent='No eligible watchlist titles to export.';return;}download(core.csv(rows),`letterboxd-watchlist-${store.today()}.csv`);$('#journalExportStatus').textContent=`${rows.length} titles downloaded. ${list.length-rows.length} scoped episode/series/segment entries omitted unless an exact link is provided. Import to WATCHLIST, not profile. Review ambiguous editions before adding films.`;};
  async function wikidata(params){
    const url=new URL('https://www.wikidata.org/w/api.php');for(const [k,v]of Object.entries({...params,format:'json',origin:'*',maxlag:5}))url.searchParams.set(k,v);
    const response=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{'Api-User-Agent':'ActingEntranceStudio/1.0 (https://bykeshu.github.io/Acting-Entrace-Studio/)'}});
    if(!response.ok)throw Error('Metadata service unavailable. Try later or enter the film manually.');const data=await response.json();if(data.error)throw Error('Metadata service is busy. Please use manual entry for now.');return data;
  }
  $('#journalSearchOnline').onclick=async()=>{
    if(searchBusy)return;const title=form.elements.title.value.trim();if(title.length<2){$('#journalIdentity').textContent='Enter at least two characters to search.';return;}
    const mine=++request;searchBusy=true;$('#journalSearchOnline').disabled=true;$('#journalIdentity').textContent='Searching public Wikidata film metadata…';
    try{
      const d=await wikidata({action:'wbsearchentities',search:title,language:'en',uselang:'en',type:'item',limit:12});if(mine!==request)return;
      const films=(d.search||[]).filter(f=>/film|movie|documentary|cinema/i.test(f.description||''));
      $('#journalMatches').innerHTML=films.map(f=>`<button type="button" class="metadata-match" data-wikidata="${esc(f.id)}"><strong>${esc(f.label)}</strong><small>${esc(f.description)} · ${esc(f.id)}</small></button>`).join('');
      $('#journalIdentity').textContent=films.length?'Pick the intended film below. Wikidata is community metadata, not a complete catalogue.':'No film matches found. Try the original title, or enter it manually.';
    }catch(e){if(mine===request)$('#journalIdentity').textContent='Offline or metadata lookup failed. Manual entry still works; no record was saved.';}
    finally{searchBusy=false;$('#journalSearchOnline').disabled=false;}
  };
  $('#journalMatches').addEventListener('click',async e=>{
    const id=e.target.closest('[data-wikidata]')?.dataset.wikidata;if(!/^Q\d+$/.test(id||''))return;const mine=++request;$('#journalIdentity').textContent='Loading the selected edition…';
    try{
      const data=await wikidata({action:'wbgetentities',ids:id,props:'labels|claims',languages:'en'}),entity=data.entities[id];
      const claims=p=>(entity.claims?.[p]||[]).filter(c=>c.rank!=='deprecated').map(c=>c.mainsnak?.datavalue?.value).filter(Boolean);
      const genreIds=claims('P136').map(g=>g.id).filter(g=>/^Q\d+$/.test(g)).slice(0,12),labels=genreIds.length?(await wikidata({action:'wbgetentities',ids:genreIds.join('|'),props:'labels',languages:'en'})).entities:{};
      if(mine!==request)return;
      const years=claims('P577').map(t=>t.time?.match(/^\+(\d{4})-/)?.[1]).filter(Boolean).sort();
      choose({title:entity.labels?.en?.value||form.elements.title.value,year:years[0]||'',genres:genreIds.map(g=>labels[g]?.labels?.en?.value).filter(Boolean),wikidataId:id,filmKey:`wikidata:${id}`});$('#journalMatches').innerHTML='';
    }catch(e){if(mine===request)$('#journalIdentity').textContent='Could not load this edition. Manual entry remains available.';}
  });
  form.elements.date.value=store.today();form.elements.date.max=store.today();
  window.ACTING_LOGBOOK={render,offer};render();
})();
