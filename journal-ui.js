(() => {
  const core=window.ACTING_JOURNAL,store=window.ACTING_FILM_STORE;
  const $=s=>document.querySelector(s),form=$('#journalForm');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const catalogue=[...window.ACTING_BUCKET.films.map(f=>({...f,filmKey:core.identity(f)})),...window.ACTING_CINEMA.films.map(f=>({...f,filmKey:`cinema-watched:${f.id}`}))];
  let selected=null,request=0,searchBusy=false;
  $('#journalTitles').innerHTML=[...new Set(catalogue.map(f=>f.title))].map(t=>`<option value="${esc(t)}"></option>`).join('');
  function choose(f){
    selected=f;
    form.elements.title.value=f.title;
    form.elements.year.value=f.year||'';
    form.elements.genres.value=(f.genres||[]).join(', ');
    form.elements.letterboxdURI.value=f.letterboxdURI||'';
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
    $('#journalCards').innerHTML=shown.length?shown.map((s,i)=>`<article class="diary-card" data-card="${i%4}"><div class="diary-ticket"><span>ADMIT ONE / ${esc(s.date)}</span><span>${s.rewatch?'REWATCH':'A VIEWING'}</span></div><span class="diary-reel" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h3>${esc(s.title)}</h3><p class="diary-year">${esc(s.year||'Edition not specified')}</p><p class="diary-rating" aria-label="${s.rating==null?'No rating':esc(s.rating)+' out of five stars'}">${s.rating==null?'UNRATED':esc(s.rating)+' / 5 ★'}</p><div class="meta">${(s.genres||[]).map(g=>`<span class="tag">${esc(g)}</span>`).join('')}</div>${s.note?`<p class="diary-moment">${esc(s.note)}</p>`:'<p class="diary-moment">A film can stay with you without a note.</p>'}<details><summary>Letterboxd handoff</summary><p>${s.letterboxdStatus==='confirmed'?'Marked imported by you — not remotely verified.':'Not posted to Letterboxd. Export the pending diary CSV, check its matches, then confirm there.'}</p><button type="button" class="text-btn" data-journal-confirm="${esc(s.id)}">${s.letterboxdStatus==='confirmed'?'Return to pending':'I imported this entry'}</button></details><button type="button" class="text-btn" data-journal-edit="${esc(s.id)}">Edit this card ↗</button></article>`).join(''):'<div class="journal-empty"><span aria-hidden="true">✳</span><h3>THE END.<br>OR A BEGINNING.</h3><p>Your first film card goes here. Nothing to analyse. Just your cinema.</p></div>';
    $('#journalWatchlist').innerHTML=list.map(f=>`<div class="watch-ticket"><div><strong>${esc(f.title)}</strong><small>${esc(f.year||'Confirm edition in Letterboxd')}${f.genres?.length?' · '+esc(f.genres.join(', ')):''}</small></div><button type="button" class="text-btn" data-journal-watch="${esc(f.filmKey)}">Watched ↗</button></div>`).join('')||'<p class="empty">An empty watchlist is fine too.</p>';
    $('#journalPending').textContent=`${diary.filter(s=>s.letterboxdStatus!=='confirmed').length} diary entries pending handoff. Exports never include your private moments or genres as reviews/tags.`;
  }
  function values(){
    const v=Object.fromEntries(new FormData(form));
    const f=selected?.title===v.title?selected:catalogue.find(f=>f.title.toLowerCase()===v.title.trim().toLowerCase());
    return {...v,filmKey:f?.filmKey,wikidataId:f?.wikidataId,entryNote:f?.entryNote};
  }
  function save(watchlist=false){
    try{
      const v=values(),editing=form.elements.entryId.value;
      const record=core.entry(v,{id:watchlist?crypto.randomUUID():editing||crypto.randomUUID(),date:store.today(),watchlist});
      if(!watchlist && store.read().some(s=>s.mode==='Film diary'&&s.id!==record.id&&s.filmKey===record.filmKey&&s.date===record.date)){throw Error('You already have this film on this date. Edit that card; Letterboxd combines same-film, same-day imports.');}
      store.put(record);
      if(!watchlist)store.mark(record.filmKey,true);
      form.reset();form.elements.date.value=store.today();selected=null;$('#journalIdentity').textContent='Manual entry works offline. Metadata is optional.';
      $('#journalStatus').textContent=watchlist?'Added to your private watchlist. Export watchlist CSV to add it to Letterboxd.':'Your film card is saved privately and queued through existing account sync when signed in. Letterboxd posting is still pending.';
      render();
    }catch(e){$('#journalStatus').textContent=e.message;}
  }
  form.addEventListener('submit',e=>{e.preventDefault();save();});
  $('#journalAddWatchlist').onclick=()=>save(true);
  form.elements.title.addEventListener('input',()=>{request++;selected=null;form.elements.entryId.value='';$('#journalMatches').innerHTML='';$('#journalIdentity').textContent='Manual entry works offline. Metadata is optional.';});
  form.elements.title.addEventListener('change',()=>{const f=catalogue.find(f=>f.title.toLowerCase()===form.elements.title.value.trim().toLowerCase());if(f)choose(f);});
  $('#journalReset').onclick=()=>{form.reset();selected=null;form.elements.date.value=store.today();$('#journalStatus').textContent='New card — previous saved cards are unchanged.';};
  $('#journalFilter').addEventListener('input',render);
  $('#journalWatchlist').addEventListener('click',e=>{const key=e.target.closest('[data-journal-watch]')?.dataset.journalWatch;const f=core.watchlist(window.ACTING_BUCKET.films,store.read(),store.watched()).find(f=>f.filmKey===key);if(f)offer(f);});
  $('#journalCards').addEventListener('click',e=>{
    const edit=e.target.closest('[data-journal-edit]')?.dataset.journalEdit,confirmed=e.target.closest('[data-journal-confirm]')?.dataset.journalConfirm;
    const s=store.read().find(s=>s.mode==='Film diary'&&s.id===(edit||confirmed));if(!s)return;
    if(confirmed){store.put({...s,letterboxdStatus:s.letterboxdStatus==='confirmed'?'diary-pending':'confirmed'});render();return;}
    form.reset();choose(s);form.elements.entryId.value=s.id;form.elements.date.value=s.date;form.elements.rating.value=s.rating==null?'none':String(s.rating);form.elements.note.value=s.note||'';form.elements.rewatch.checked=!!s.rewatch;form.scrollIntoView({behavior:'smooth'});form.elements.title.focus();
  });
  function download(text,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('#journalExportDiary').onclick=()=>{const pending=store.read().filter(s=>s.mode==='Film diary'&&s.letterboxdStatus!=='confirmed'),rows=core.exportable(pending);if(!rows.length){$('#journalExportStatus').textContent='No eligible pending diary entries. Scoped episode/series/segment entries need an exact Letterboxd link before export.';return;}download(core.csv(rows,true),`letterboxd-diary-${store.today()}.csv`);$('#journalExportStatus').textContent=`${rows.length} entries downloaded only; nothing posted. ${pending.length-rows.length} scoped entries omitted. Import to your profile, review matches, then confirm there. Dates/watched status may be publicly visible.`;};
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
