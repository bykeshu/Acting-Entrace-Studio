(() => {
  const KEY = "acting-entrance-studio-v1";
  const seed = window.ACTING_SEED;
  const cinema = window.ACTING_CINEMA;
  const bucket = window.ACTING_BUCKET;
  const defaults = {
    currentWeek: 1, completedTopics: {}, evidence: {}, dailyReviews: [],
    tasks: [
      {id:"starter-ftii-drill",title:"FTII: 25-question mixed drill",track:"FTII",lane:"Knowledge",done:false},
      {id:"starter-camera-monologue",title:"Record 3-minute monologue, one close-up take",track:"FTII",lane:"Practice",done:false},
      {id:"starter-nsd-scene",title:"Read and score one NSD prescribed-play scene",track:"NSD",lane:"Practice",done:false},
      {id:"starter-bengal-timeline",title:"Bengal timeline: National Theatre to group theatre",track:"Bengal",lane:"Knowledge",done:false}
    ], sessions: [], tests: [], productions: []
  };
  let state;
  function validatedState(input){
    if(!input || typeof input!=="object" || Array.isArray(input))throw Error('Backup must contain a progress object.');
    const result={...structuredClone(defaults),...input};
    for(const key of ['tasks','sessions','tests','productions','dailyReviews']){
      if(!Array.isArray(result[key])||result[key].some(x=>!x||typeof x!=="object"||typeof x.id!=="string"||!/^[a-zA-Z0-9:._-]{1,400}$/.test(x.id)))throw Error(`Invalid ${key} records.`);
      if(new Set(result[key].map(x=>x.id)).size!==result[key].length)throw Error(`Duplicate ${key} IDs.`);
    }
    for(const key of ['completedTopics','evidence'])if(!result[key]||typeof result[key]!=="object"||Array.isArray(result[key]))throw Error(`Invalid ${key}.`);
    if(!Number.isInteger(result.currentWeek)||result.currentWeek<1||result.currentWeek>24)throw Error('Invalid roadmap week.');
    const numeric=(v,min=0,max=100000)=>v===undefined||v===null||(typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max);
    for(const s of result.sessions){if(!numeric(s.minutes)||!numeric(s.rating,0,5)||(s.genres!==undefined&&(!Array.isArray(s.genres)||s.genres.some(g=>typeof g!=='string'))))throw Error('Invalid session or film-card fields.');}
    for(const t of result.tests)if(!numeric(t.score)||!numeric(t.max,1)||t.score>t.max)throw Error('Invalid test scores.');
    for(const r of result.dailyReviews){
      if(r.assigned!==undefined&&(!Array.isArray(r.assigned)||r.assigned.some(t=>!t||typeof t!=='object'||(t.status!==undefined&&typeof t.status!=='string'))))throw Error('Invalid daily task evidence.');
      if(r.carryForward!==undefined&&!Array.isArray(r.carryForward))throw Error('Invalid daily carry-forward.');
      if(r.scores&&Object.values(r.scores).some(v=>!numeric(v)))throw Error('Invalid daily scores.');
    }
    return result;
  }
  try { state = validatedState(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { state = structuredClone(defaults); }
  const stateBeforeFileReviews = JSON.parse(JSON.stringify(state));
  const fileReviews = Array.isArray(window.ACTING_DAILY_LOG) ? window.ACTING_DAILY_LOG : [];
  const reviewMap = new Map([...(state.dailyReviews || []), ...fileReviews].map(r => [r.id, r]));
  state.dailyReviews = [...reviewMap.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if (fileReviews.length) localStorage.setItem(KEY, JSON.stringify(state));
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const MARKER_KEY = "acting-entrance-cloud-uid-v1";
  const outboxKey = uid => `acting-entrance-outbox-v1-${uid}`;
  const kinds = {tasks:"task",sessions:"session",tests:"test",productions:"production",dailyReviews:"dailyReview"};
  let previousState = clone(state);
  let syncUid = null;
  const readOutbox = uid => { try { return JSON.parse(localStorage.getItem(outboxKey(uid)) || "[]"); } catch { return []; } };
  const persistOutbox = (uid,items) => localStorage.setItem(outboxKey(uid),JSON.stringify(items));
  const newEvent = (kind,entityId,action,value) => ({id:crypto.randomUUID(),kind,entityId:String(entityId),action,payload:action==="delete"?"":JSON.stringify(value)});
  function diffState(before,after){
    const changes=[];
    for(const [field,kind] of Object.entries(kinds)){
      const oldMap=new Map((before[field]||[]).map(item=>[item.id,item]));
      const newMap=new Map((after[field]||[]).map(item=>[item.id,item]));
      for(const [id,item] of newMap) if(JSON.stringify(item)!==JSON.stringify(oldMap.get(id))) changes.push(newEvent(kind,id,"put",item));
      for(const id of oldMap.keys()) if(!newMap.has(id)) changes.push(newEvent(kind,id,"delete"));
    }
    for(const [field,kind] of [["completedTopics","topic"],["evidence","evidence"]]){
      const keys=new Set([...Object.keys(before[field]||{}),...Object.keys(after[field]||{})]);
      for(const key of keys) if(Boolean(before[field]?.[key])!==Boolean(after[field]?.[key])) changes.push(newEvent(kind,key,"put",Boolean(after[field]?.[key])));
    }
    if(before.currentWeek!==after.currentWeek) changes.push(newEvent("roadmap","currentWeek","put",after.currentWeek));
    return changes;
  }
  function appendOutbox(uid,events){
    if(!events.length)return;
    persistOutbox(uid,[...readOutbox(uid),...events]);
    window.dispatchEvent(new Event("acting:outbox"));
  }
  if(fileReviews.length && localStorage.getItem(MARKER_KEY)){
    appendOutbox(localStorage.getItem(MARKER_KEY),diffState(stateBeforeFileReviews,state));
  }
  function fullStateEvents(source){
    const events=[];
    for(const [field,kind] of Object.entries(kinds)) for(const item of source[field]||[]) events.push(newEvent(kind,item.id,"put",item));
    for(const [field,kind] of [["completedTopics","topic"],["evidence","evidence"]]) for(const [key,value] of Object.entries(source[field]||{})) events.push(newEvent(kind,key,"put",Boolean(value)));
    events.push(newEvent("roadmap","currentWeek","put",source.currentWeek||1));
    return events;
  }
  function stateFromEvents(events){
    const result={...clone(defaults),tasks:[],sessions:[],tests:[],productions:[],dailyReviews:[],completedTopics:{},evidence:{}};
    if(!events.length)return clone(defaults);
    for(const event of events){
      let value;
      try { value=event.action==="put"?JSON.parse(event.payload):null; } catch { continue; }
      const field=Object.keys(kinds).find(key=>kinds[key]===event.kind);
      if(field){
        const index=result[field].findIndex(item=>item.id===event.entityId);
        if(event.action==="delete") { if(index>=0)result[field].splice(index,1); }
        else if(value && typeof value==="object" && value.id===event.entityId){try{validatedState({[field]:[value]});}catch{continue;}if(index>=0)result[field][index]=value;else result[field].push(value);}
      } else if(event.kind==="topic" || event.kind==="evidence"){
        result[event.kind==="topic"?"completedTopics":"evidence"][event.entityId]=Boolean(value);
      } else if(event.kind==="roadmap" && event.entityId==="currentWeek" && Number.isInteger(value) && value>=1 && value<=24){result.currentWeek=value;}
    }
    return result;
  }
  window.ACTING_SYNC={
    marker:()=>localStorage.getItem(MARKER_KEY),
    hasLocalProgress:()=>diffState(defaults,state).length>0,
    activate(uid){syncUid=uid;localStorage.setItem(MARKER_KEY,uid);previousState=clone(state);},
    deactivate(){syncUid=null;localStorage.removeItem(MARKER_KEY);$("#saveState").textContent="Saved locally";},
    queueCurrent(uid){appendOutbox(uid,fullStateEvents(state));},
    outbox:uid=>readOutbox(uid),
    acknowledge(uid,id){persistOutbox(uid,readOutbox(uid).filter(item=>item.id!==id));},
    applyRemote(uid,events){
      if(syncUid!==uid)return;
      const pending=readOutbox(uid);
      state=stateFromEvents([...events,...pending]);
      previousState=clone(state);
      localStorage.setItem(KEY,JSON.stringify(state));
      $("#saveState").textContent=pending.length?`${pending.length} pending sync`:"Synced";
      renderAll();
    },
    status(message){$("#saveState").textContent=message;}
  };
  const save = () => {
    const queueUid=syncUid||localStorage.getItem(MARKER_KEY);
    if(queueUid) appendOutbox(queueUid,diffState(previousState,state));
    localStorage.setItem(KEY,JSON.stringify(state));
    previousState=clone(state);
    $("#saveState").textContent=queueUid?"Pending sync":"Saved locally";
    renderToday();
  };
  // This user's preparation day follows India time, including after midnight.
  // Keep previously stored dates intact; only new defaults use this calendar.
  const todayISO = (date=new Date()) => {
    const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const value=type=>parts.find(p=>p.type===type).value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  };
  const viewNames = {today:"Today’s rehearsal room",daily:"Daily assessment ledger",roadmap:"Your 24-week route",syllabus:"Syllabus studio",practice:"Practice log",tests:"Test and error lab",resources:"Linked resource library",evidence:"NSD evidence file",cinema:"World cinema studio",bucket:"My movie bucket list",journal:"My life in films"};

  function switchView(id){
    if(!viewNames[id])return;
    $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${id}`));
    $$(".nav-item").forEach(b=>{b.classList.toggle("active",b.dataset.view===id);b.setAttribute("aria-current",b.dataset.view===id?"page":"false");});
    $("#viewTitle").textContent=viewNames[id];
    $("#mobileView").value=id;
    document.body.dataset.room=id;
    if(id==="daily") renderDaily(); if(id==="resources") renderResources(); if(id==="syllabus") renderSyllabus(); if(id==="practice") renderSessions(); if(id==="tests") renderTests(); if(id==="evidence") renderEvidence();
    if(id==="cinema") renderCinema();
    if(id==="bucket") renderBucket();
    if(id==="journal") window.ACTING_LOGBOOK?.render();
    scrollTo({top:0,behavior:"smooth"});
  }
  $("#nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)switchView(b.dataset.view)});
  $("#mobileView").addEventListener("change",e=>switchView(e.target.value));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));

  function renderToday(){
    const done=state.tasks.filter(t=>t.done).length, total=state.tasks.length||1;
    $("#weekProgressLabel").textContent=`${Math.round(done/total*100)}%`;
    $("#weekProgressBar").style.width=`${done/total*100}%`;
    const weekAgo=Date.now()-7*86400000;
    const learningSessions=state.sessions.filter(s=>!['Film memory','Film diary','Film watchlist','Film artwork'].includes(s.mode));
    const recent=learningSessions.filter(s=>new Date(s.date).getTime()>=weekAgo);
    const knowledge=recent.filter(s=>["Written study","Play analysis","Film-performance analysis","Mock test"].includes(s.mode)).reduce((a,s)=>a+Number(s.minutes),0);
    const practice=recent.reduce((a,s)=>a+Number(s.minutes),0)-knowledge;
    $("#knowledgeMins").textContent=`${knowledge}m`; $("#practiceMins").textContent=`${practice}m`;
    const days=new Set(learningSessions.map(s=>s.date)); let streak=0,d=new Date(); while(days.has(todayISO(d))){streak++;d.setDate(d.getDate()-1)} $("#streak").textContent=`${streak}d`;
    $("#todayTasks").innerHTML=state.tasks.length?state.tasks.map(t=>`<div class="task ${t.done?'done':''}"><input type="checkbox" data-task="${t.id}" ${t.done?'checked':''} aria-label="Complete ${esc(t.title)}"><div><div class="task-name">${esc(t.title)}</div><div class="meta"><span class="tag">${esc(t.track)}</span><span>${esc(t.lane)}</span>${t.due?`<span>${esc(t.due)}</span>`:''}</div></div><button class="delete" data-delete-task="${t.id}" aria-label="Delete task">×</button></div>`).join(""):`<p class="empty">No tasks yet. Add the next physical action.</p>`;
    const doneTopics=seed.tracks.flatMap(t=>t.modules).reduce((n,m)=>n+m.topics.filter(x=>state.completedTopics[`${m.id}:${x}`]).length,0);
    const pulse=[['FTII papers',seed.tracks.find(t=>t.id==='ftii').modules.find(m=>m.id==='ftii-papers').topics.filter(x=>state.completedTopics[`ftii-papers:${x}`]).length+'/10'],['NSD plays',seed.tracks.find(t=>t.id==='nsd').modules.find(m=>m.id==='nsd-plays').topics.filter(x=>state.completedTopics[`nsd-plays:${x}`]).length+'/27'],['Syllabus',doneTopics+' topics'],['Productions',state.productions.length+'/6']];
    $("#pulseGrid").innerHTML=pulse.map(([a,b])=>`<div class="pulse"><strong>${b}</strong><small>${a}</small></div>`).join("");
    $("#recentSessions").innerHTML=learningSessions.length?learningSessions.slice(-4).reverse().map(s=>`<div class="session-mini"><strong>${esc(s.title)}</strong><small>${esc(s.mode)} · ${s.minutes}m · ${esc(s.track)}</small></div>`).join(""):`<p class="empty">Your first logged rehearsal will appear here.</p>`;
  }
  $("#todayTasks").addEventListener("change",e=>{if(e.target.dataset.task){const t=state.tasks.find(x=>x.id===e.target.dataset.task);if(!t)return;t.done=e.target.checked;save()}});
  $("#todayTasks").addEventListener("click",e=>{const id=e.target.dataset.deleteTask;if(id){state.tasks=state.tasks.filter(t=>t.id!==id);save()}});

  const taskDialog=$("#taskDialog"); const openTask=()=>taskDialog.showModal(); $("#addTaskTop").onclick=openTask; $("#addTaskInline").onclick=openTask;
  $("#taskForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target);state.tasks.push({id:crypto.randomUUID(),title:fd.get("title"),track:fd.get("track"),lane:fd.get("lane"),due:fd.get("due"),done:false});e.target.reset();taskDialog.close();save()});

  function renderRoadmap(){
    $("#currentWeek").value=state.currentWeek; $("#currentWeekLabel").textContent=`Week ${state.currentWeek}`;
    $("#roadmapTimeline").innerHTML=seed.phases.map(p=>`<article class="phase ${state.currentWeek>p.end?'complete':state.currentWeek>=p.start&&state.currentWeek<=p.end?'current':''}"><small>WEEKS ${p.start}${p.end>p.start?`–${p.end}`:''}</small><h3>${p.name}</h3><ul>${p.items.map(i=>`<li>${i}</li>`).join('')}</ul></article>`).join('');
  }
  $("#currentWeek").addEventListener("input",e=>{state.currentWeek=Number(e.target.value);save();renderRoadmap()});

  function renderDaily(){
    const reviews=(state.dailyReviews||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const latest=reviews[0];
    if(!latest){
      $("#dailySummary").innerHTML=`<article class="focus-card dark"><p class="eyebrow">NO REVIEW YET</p><h2>Complete your first daily loop</h2><p>Ask the daily coach for tasks, submit your summary file, answer the assessment, then reload.</p></article>`;
      $("#dailyReviewList").innerHTML=`<p class="empty">Completed daily assessments will appear here.</p>`;
      return;
    }
    const totals=reviews.map(r=>Number(r.scores?.total||0));
    const avg=Math.round(totals.reduce((a,b)=>a+b,0)/totals.length*10)/10;
    const completed=latest.assigned?.filter(t=>t.status==='complete').length||0;
    const total=latest.assigned?.length||0;
    $("#dailySummary").innerHTML=`<article class="focus-card dark"><p class="eyebrow">LATEST REVIEW · ${esc(latest.date)}</p><h2>${esc(latest.rating)}</h2><p>${esc(latest.repair||'Keep the loop honest and specific.')}</p></article><article class="stat-card"><span>Latest score</span><strong>${latest.scores?.total||0}/20</strong><small>Evidence + assessment</small></article><article class="stat-card"><span>Task completion</span><strong>${completed}/${total}</strong><small>Fully evidenced</small></article><article class="stat-card"><span>Average</span><strong>${avg}</strong><small>${reviews.length} review${reviews.length===1?'':'s'}</small></article>`;
    $("#dailyReviewList").innerHTML=reviews.map(r=>`<article class="daily-review"><div class="daily-review-head"><div><p class="eyebrow">${esc(r.date)} · WEEK ${esc(r.roadmapWeek||'—')}</p><h2>${esc(r.rating||'Daily review')}</h2></div><div class="daily-review-score">${r.scores?.total||0}/20</div></div><div class="score-breakdown"><span class="tag">Tasks ${r.scores?.taskEvidence||0}/10</span><span class="tag">MCQ ${r.scores?.mcq||0}/5</span><span class="tag">Objective ${r.scores?.objective||0}/5</span></div><div class="daily-task-grid">${(r.assigned||[]).map(t=>`<div class="daily-task ${esc(t.status)}"><strong>${esc(t.title)}</strong><small>${esc(t.track)} · ${esc(t.lane)} · ${esc(String(t.status||'pending').replaceAll('_',' '))}${t.evidence?' · '+esc(t.evidence):''}</small></div>`).join('')}</div><div class="daily-insight"><div><span>Strength</span><strong>${esc(r.strength||'—')}</strong></div><div><span>Priority repair</span><strong>${esc(r.repair||'—')}</strong></div></div>${r.carryForward?.length?`<p><strong>Carry forward:</strong> ${r.carryForward.map(esc).join(' · ')}</p>`:''}</article>`).join('');
  }

  function renderSyllabus(){
    const track=$("#syllabusTrack").value, q=$("#syllabusSearch").value.trim().toLowerCase();
    const chosen=seed.tracks.filter(t=>track==='all'||t.id===track);
    let total=0,done=0,html='';
    chosen.forEach(t=>t.modules.forEach(m=>{const topics=m.topics.filter(x=>!q||`${t.name} ${m.title} ${x}`.toLowerCase().includes(q));if(!topics.length)return; total+=topics.length;done+=topics.filter(x=>state.completedTopics[`${m.id}:${x}`]).length;html+=`<article class="module"><div class="module-head"><div><small>${esc(t.name)}</small><h3>${esc(m.title)}</h3></div><span class="tag">${topics.filter(x=>state.completedTopics[`${m.id}:${x}`]).length}/${topics.length}</span></div><div class="topic-list">${topics.map(x=>`<label class="topic"><input type="checkbox" data-topic="${esc(m.id+':'+x)}" ${state.completedTopics[`${m.id}:${x}`]?'checked':''}><span>${esc(x)}</span></label>`).join('')}</div></article>`}))
    $("#syllabusGrid").innerHTML=html||`<p class="empty">No syllabus topics match.</p>`; $("#syllabusSummary").textContent=`${done} of ${total} visible topics complete · official, evidence-based and regional layers remain labelled in the research pack`;
  }
  $("#syllabusTrack").onchange=renderSyllabus; $("#syllabusSearch").oninput=renderSyllabus;
  $("#syllabusGrid").addEventListener("change",e=>{if(e.target.dataset.topic){state.completedTopics[e.target.dataset.topic]=e.target.checked;save();renderSyllabus()}});

  $("#sessionForm").addEventListener("submit",e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));state.sessions.push({id:crypto.randomUUID(),date:todayISO(),...o,minutes:Number(o.minutes),rating:Number(o.rating)});e.target.reset();e.target.minutes.value=45;save();renderSessions()});
  const personalFilmRecord=s=>['Film memory','Film diary','Film watchlist','Film artwork'].includes(s.mode);
  function renderSessions(){ const sessions=state.sessions.filter(s=>!personalFilmRecord(s)); $("#sessionList").innerHTML=sessions.length?sessions.slice().reverse().map(s=>`<article class="history-item"><div class="history-item-head"><strong>${esc(s.title)}</strong><span class="tag">${s.minutes}m</span></div><div class="meta"><span>${esc(s.date)}</span><span>${esc(s.mode)}</span><span>${esc(s.track)}</span><span>Quality ${s.rating}/5</span></div>${s.note?`<p>${esc(s.note)}</p>`:''}</article>`).join(''):`<p class="empty">No sessions logged yet.</p>`; }
  $("#clearSessions").onclick=()=>{if(confirm("Clear all practice sessions? Your film diary, watchlist and memories will be kept.")){state.sessions=state.sessions.filter(personalFilmRecord);save();renderSessions();renderCinema()}};

  $("#testForm").addEventListener("submit",e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target)),score=Number(o.score),max=Number(o.max);if(!Number.isFinite(score)||!Number.isFinite(max)||max<=0||score<0||score>max){$("#testStatus").textContent="Score must be between zero and the maximum.";return;}state.tests.push({id:crypto.randomUUID(),date:todayISO(),...o,score,max});e.target.reset();e.target.max.value=100;$("#testStatus").textContent="Test result saved.";save();renderTests()});
  function renderTests(){
    const last=state.tests.slice(-10), maxHeight=180; $("#scoreChart").innerHTML=last.length?last.map(t=>{const p=Math.max(0,Math.min(100,t.score/t.max*100));return `<div class="bar" style="height:${Math.max(4,p/100*maxHeight)}px" title="${esc(t.exam)}: ${p.toFixed(0)}%"><span>${p.toFixed(0)}%</span></div>`}).join(''):`<p class="empty">Log a test to see the trend.</p>`;
    $("#testList").innerHTML=state.tests.slice().reverse().map(t=>`<article class="history-item"><div class="history-item-head"><strong>${esc(t.exam)}</strong><span class="tag">${t.score}/${t.max}</span></div><div class="meta"><span>${esc(t.date)}</span><span>${esc(t.error)}</span></div>${t.repair?`<p>Repair: ${esc(t.repair)}</p>`:''}</article>`).join('');
  }

  function renderResources(){
    const track=$("#resourceTrack").value, access=$("#resourceAccess").value, q=$("#resourceSearch").value.trim().toLowerCase();
    const rows=seed.resources.filter(r=>(track==='all'||r.track.includes(track))&&(access==='all'||r.access===access)&&(!q||`${r.title} ${r.category} ${r.publisher}`.toLowerCase().includes(q)));
    $("#resourceCount").textContent=`${rows.length} resources · check dates shown per source; reference links do not guarantee streaming access`;
    $("#resourceList").innerHTML=rows.map(r=>`<article class="resource"><div><h3>${esc(r.title)}</h3><p>${esc(r.publisher)} · ${esc(r.category)} · checked ${esc(r.verifiedOn)}</p></div><span class="status">${esc(r.track)} · ${esc(r.access)}</span><a href="${esc(r.url)}" target="_blank" rel="noopener">Open ↗</a></article>`).join('')||`<p class="empty">No resources match.</p>`;
  }
  $("#resourceTrack").onchange=renderResources; $("#resourceAccess").onchange=renderResources; $("#resourceSearch").oninput=renderResources;

  const filmWatched = id => Boolean(state.completedTopics[`cinema-watched:${id}`]);
  const filmReviews = id => state.sessions.filter(s=>s.filmId===id && s.mode==="Film-performance analysis");
  const cinemaFilters = ["Region","Director","Focus","Path","Progress","Search"];
  for (const [suffix,values] of [["Region",cinema.films.map(f=>f.region)],["Director",cinema.films.flatMap(f=>f.directors)],["Focus",cinema.films.map(f=>f.focus)]]) {
    $("#cinema"+suffix).insertAdjacentHTML("beforeend",[...new Set(values)].sort((a,b)=>a.localeCompare(b)).map(x=>`<option>${esc(x)}</option>`).join(""));
  }
  $("#cinemaReviewFilm").innerHTML=cinema.films.map(f=>`<option value="${esc(f.id)}">${esc(f.title)} (${f.year})</option>`).join("");
  $("#cinemaReviewDate").value=todayISO();
  $("#cinemaScope").textContent=cinema.scopeNote;
  $("#cinemaAccess").textContent=cinema.accessNote;
  $("#cinemaMapping").innerHTML=Object.entries(cinema.mapping).map(([track,note])=>`<div><strong>${esc(track.toUpperCase())}</strong><p>${esc(note)}</p></div>`).join("");

  function renderCinema(){
    const get=suffix=>$("#cinema"+suffix).value;
    const q=get("Search").trim().toLowerCase();
    const rows=cinema.films.filter(f=>(get("Region")==="all"||f.region===get("Region")) && (get("Director")==="all"||f.directors.includes(get("Director"))) && (get("Focus")==="all"||f.focus===get("Focus")) && (get("Path")==="all"||f.path===get("Path")) && (get("Progress")==="all"||get("Progress")==="watched"&&filmWatched(f.id)||get("Progress")==="unwatched"&&!filmWatched(f.id)||get("Progress")==="reflected"&&filmReviews(f.id).length>0) && (!q||`${f.title} ${f.directors.join(" ")} ${f.region} ${f.countries} ${f.movement} ${f.context}`.toLowerCase().includes(q)));
    const watched=cinema.films.filter(f=>filmWatched(f.id)).length;
    const reflected=cinema.films.filter(f=>filmReviews(f.id).length).length;
    const stats=[[cinema.films.length,"linked films"],[new Set(cinema.films.flatMap(f=>f.directors)).size,"directors"],[watched,"marked watched"],[reflected,"with reflection"]];
    $("#cinemaStats").innerHTML=stats.map(([n,label])=>`<div><strong>${n}</strong><span>${esc(label)}</span></div>`).join("");
    const next=cinema.starterIds.map(id=>cinema.films.find(f=>f.id===id)).find(f=>!filmWatched(f.id));
    $("#cinemaNext").textContent=next?`Optional starter suggestion: ${next.title}`:"All foundation films marked watched — enjoy a rewatch or choose something else";
    $("#cinemaCount").textContent=`${rows.length} of ${cinema.films.length} films · metadata checked ${cinema.version} · all preparation mappings are supplementary`;
    $("#cinemaFilms").innerHTML=rows.map(f=>{
      const reviews=filmReviews(f.id), planned=state.tasks.some(t=>t.id===`cinema-task-${f.id}`);
      const position=cinema.starterIds.indexOf(f.id);
      return `<article class="panel cinema-film"><div class="meta"><span class="tag">${esc(f.region)}</span><span class="tag">${esc(f.path)}</span>${position>=0?`<span class="tag">Starter ${position+1}/12</span>`:""}</div><div class="film-cover"><span class="cover-caption">The cinema journal</span><h3>${esc(f.title)} <small>(${f.year})</small></h3><span class="cover-art" aria-hidden="true"></span></div><p class="cinema-credits">${esc(f.directors.join(" / "))}<br>${esc(f.language)} · about ${f.minutes}m · ${esc(f.countries)}</p><p><strong>${esc(f.movement)}</strong><br>${esc(f.context)}</p><details><summary>Optional after watching: acting ideas &amp; Bengal bridge</summary><p class="cinema-focus">Actor lens: ${esc(f.focus)}</p><p>${esc(f.question)}</p><p>${esc(f.bengalBridge)}</p><p>If you feel like practising: write a note, or try a safe original scene at stage and close-up scale. Neither is needed to enjoy or mark the film watched.</p><button type="button" class="text-btn" data-film-plan="${esc(f.id)}" ${planned?"disabled":""}>${planned?"In task list":"Choose an optional study task"}</button><button type="button" class="text-btn" data-film-reflect="${esc(f.id)}">Optional reflection</button><span> · ${reviews.length} saved reflection${reviews.length===1?"":"s"}</span></details><p class="cinema-advisory">Content heads-up (not a rating): ${esc(f.advisory)}</p><a class="cinema-source" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.publisher)} reference ↗</a><small class="cinema-source-note">Supplementary · metadata checked ${esc(f.verifiedOn)} · ${esc(f.availability)}.</small><div class="cinema-controls"><label><input type="checkbox" data-film-watched="${esc(f.id)}" ${filmWatched(f.id)?"checked":""}> Watched full film — no notes needed</label></div></article>`;
    }).join("")||'<p class="empty">No films match these filters. Try Whole library or another region.</p>';
    const recent=state.sessions.filter(s=>cinema.films.some(f=>f.id===s.filmId)).slice().reverse().slice(0,8);
    $("#cinemaReviews").innerHTML=recent.length?recent.map(s=>`<article class="history-item"><strong>${esc(s.title)}</strong><div class="meta">${esc(s.date)} · ${esc(s.minutes)}m · ${esc(s.scope||"Analysis")}</div><p class="cinema-note">${esc(s.note)}</p></article>`).join(""):'<p class="empty">Your saved reflections will appear here and in Practice log. No viewing history has been assumed.</p>';
    const directors=[...new Set(cinema.films.flatMap(f=>f.directors))].sort((a,b)=>a.localeCompare(b));
    $("#cinemaDirectors").innerHTML=directors.map(d=>{const films=cinema.films.filter(f=>f.directors.includes(d));return `<article><h3>${esc(d)}</h3><p>${films.map(f=>`${esc(f.region)} · <a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.title)} (${f.year})</a> · ${esc(f.movement)}`).join("<br>")}</p></article>`}).join("");
  }
  cinemaFilters.forEach(suffix=>$("#cinema"+suffix).addEventListener(suffix==="Search"?"input":"change",renderCinema));
  $("#cinemaStarter").onclick=()=>{cinemaFilters.forEach(s=>$("#cinema"+s).value=s==="Search"?"":s==="Path"?"Foundation":"all");renderCinema();};
  $("#cinemaFilms").addEventListener("change",e=>{
    const id=e.target.dataset.filmWatched;
    if(!id||!cinema.films.some(f=>f.id===id))return;
    state.completedTopics[`cinema-watched:${id}`]=e.target.checked;save();renderCinema();renderBucket();
    if(e.target.checked){const film=cinema.films.find(f=>f.id===id);if(film)window.ACTING_LOGBOOK?.offer({...film,filmKey:`cinema-watched:${id}`});}
  });
  $("#cinemaFilms").addEventListener("click",e=>{
    const button=e.target.closest("button");if(!button)return;
    const id=button.dataset.filmPlan||button.dataset.filmReflect,film=cinema.films.find(f=>f.id===id);if(!film)return;
    if(button.dataset.filmPlan){
      if(!state.tasks.some(t=>t.id===`cinema-task-${id}`))state.tasks.push({id:`cinema-task-${id}`,title:`Optional study of ${film.title}: explore ${film.focus.toLowerCase()} after watching; notes if wanted`,track:"Shared",lane:"Review",done:false});
      save();renderCinema();
    }else{
      $("#cinemaStudy").open=true;$("#cinemaReviewFilm").value=id;$("#cinemaReviewForm").scrollIntoView({behavior:"smooth",block:"start"});$("#cinemaReviewFilm").focus();
    }
  });
  $("#cinemaReviewForm").addEventListener("submit",e=>{
    e.preventDefault();if(!e.target.reportValidity())return;
    const values=Object.fromEntries(new FormData(e.target)),film=cinema.films.find(f=>f.id===values.filmId);if(!film)return;
    if(!["context","observation","interpretation","repair"].some(k=>values[k]?.trim())){$("#cinemaReviewStatus").textContent="Add any one note to save a reflection, or skip this optional form.";return;}
    state.sessions.push({id:crypto.randomUUID(),date:values.date,mode:"Film-performance analysis",track:"Shared",minutes:Number(values.minutes),rating:Number(values.rating),title:`${film.title} (${film.year}) — performance dossier`,filmId:film.id,scope:values.scope,note:`Context/source: ${values.context.trim()}\nObserved: ${values.observation.trim()}\nInterpretation: ${values.interpretation.trim()}\nNext practice/repair: ${values.repair.trim()}`});
    save();renderCinema();renderSessions();e.target.reset();$("#cinemaReviewFilm").value=film.id;$("#cinemaReviewDate").value=todayISO();
    $("#cinemaReviewStatus").textContent="Reflection saved locally and queued through existing sync if signed in. No full-film tick or assessment score was added.";
  });

  // Personal viewing is separate from study time, streaks and assessments. It uses
  // existing topic/session events so older backups and owner-only sync still work.
  const bucketWatchKey = film => film.courseId?`cinema-watched:${film.courseId}`:`bucket-watched:${film.id}`;
  const bucketWatched = film => Boolean(state.completedTopics[bucketWatchKey(film)]);
  $("#bucketPreference").textContent=bucket.preference;
  $("#bucketBoard").href=bucket.boardUrl;
  $("#bucketSourceNote").textContent=`Checked ${bucket.checkedOn}. ${bucket.note}`;
  $("#bucketCollection").insertAdjacentHTML("beforeend",bucket.collections.map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join(""));
  $("#bucketMemoryFilm").innerHTML=bucket.films.map(f=>`<option value="${esc(f.id)}">${esc(f.title)}</option>`).join("");
  $("#bucketMemoryDate").value=todayISO();
  function renderBucket(){
    const collection=$("#bucketCollection").value,progress=$("#bucketProgress").value,q=$("#bucketSearch").value.trim().toLowerCase();
    const films=bucket.films.filter(f=>(collection==="all"||f.collectionId===collection)&&(!q||f.title.toLowerCase().includes(q))&&(progress==="all"||progress==="watched"&&bucketWatched(f)||progress==="unwatched"&&!bucketWatched(f)));
    $("#bucketCount").textContent=`${films.length} of ${bucket.films.length} titles · ${bucket.films.filter(bucketWatched).length} marked watched · no quotas, scores or compulsory notes`;
    $("#bucketFilms").innerHTML=films.length?films.map(f=>{
      const c=bucket.collections.find(c=>c.id===f.collectionId);
      return `<article class="panel cinema-film bucket-film" data-collection="${esc(c.id)}"><span class="tag">${esc(c.title)}</span><div class="film-cover"><span class="cover-caption">For the joy of watching</span><h3>${esc(f.title)}</h3><span class="cover-art" aria-hidden="true"></span></div><p>Personal bucket list · enjoy it however you like.</p>${f.entryNote?`<p class="cinema-source-note">Scope note from saved pin: ${esc(f.entryNote)}</p>`:""}<a class="cinema-source" href="${esc(c.pinUrl)}" target="_blank" rel="noopener">Saved Pinterest list ↗</a><small class="cinema-source-note">Title imported from pin · not a streaming link${f.courseId?" · also in World cinema":" · edition details not independently verified"}.</small><div class="cinema-controls"><label><input type="checkbox" data-bucket-watched="${esc(f.id)}" ${bucketWatched(f)?"checked":""}> Watched — no notes needed</label><button class="text-btn" type="button" data-bucket-memory="${esc(f.id)}">Optional: keep a moment</button></div></article>`;
    }).join(""):'<p class="empty">No titles match. Try another collection or search.</p>';
    const memories=state.sessions.filter(s=>s.mode==="Film memory"&&bucket.films.some(f=>f.id===s.filmId)).slice().reverse();
    $("#bucketMemories").innerHTML=memories.length?memories.map(s=>`<article class="history-item"><strong>${esc(s.title)}</strong><p class="meta">${esc(s.date)} · personal, ungraded</p><p class="cinema-note">${esc(s.note)}</p><button type="button" class="text-btn" data-memory-remove="${esc(s.id)}">Remove this memory</button></article>`).join(""):'<p class="empty">No memories saved — and that is completely fine.</p>';
  }
  for(const id of ["Collection","Progress","Search"])$("#bucket"+id).addEventListener(id==="Search"?"input":"change",renderBucket);
  $("#bucketFilms").addEventListener("change",e=>{
    const film=bucket.films.find(f=>f.id===e.target.dataset.bucketWatched);if(!film)return;
    state.completedTopics[bucketWatchKey(film)]=e.target.checked;save();renderBucket();renderCinema();
    if(e.target.checked)window.ACTING_LOGBOOK?.offer({...film,filmKey:bucketWatchKey(film)});
  });
  $("#bucketFilms").addEventListener("click",e=>{
    const button=e.target.closest("[data-bucket-memory]");if(!button)return;
    const film=bucket.films.find(f=>f.id===button.dataset.bucketMemory);if(!film)return;
    $("#bucketMemory").open=true;$("#bucketMemoryFilm").value=film.id;$("#bucketMemory").scrollIntoView({behavior:"smooth",block:"start"});$("#bucketMemoryFilm").focus();
  });
  $("#bucketMemoryForm").addEventListener("submit",e=>{
    e.preventDefault();if(!e.target.reportValidity())return;
    const v=Object.fromEntries(new FormData(e.target)),film=bucket.films.find(f=>f.id===v.filmId);if(!film)return;
    if(!v.feeling?.trim()&&!v.moment?.trim()){$("#bucketMemoryStatus").textContent="Add a feeling or moment to keep a memory, or simply skip this optional form.";return;}
    state.sessions.push({id:crypto.randomUUID(),filmId:film.id,date:v.date,title:film.title,mode:"Film memory",track:"Personal",minutes:0,rating:null,note:[v.feeling?.trim()?`How it felt: ${v.feeling.trim()}`:"",v.moment?.trim()?`A moment: ${v.moment.trim()}`:""].filter(Boolean).join("\n")});
    save();renderBucket();e.target.reset();$("#bucketMemoryFilm").value=film.id;$("#bucketMemoryDate").value=todayISO();
    $("#bucketMemoryStatus").textContent="Memory saved locally and queued through existing sync if signed in. No watched tick, practice minutes or assessment score was added.";
  });
  $("#bucketMemories").addEventListener("click",e=>{
    const id=e.target.dataset.memoryRemove;if(!id)return;
    if(!confirm("Remove this movie memory? Export a backup first if you want to keep a copy."))return;
    state.sessions=state.sessions.filter(s=>!(s.id===id&&s.mode==="Film memory"));save();renderBucket();
  });

  function renderEvidence(){
    $("#evidenceChecklist").innerHTML=seed.evidence.map(x=>`<article class="evidence-card"><label><input type="checkbox" data-evidence="${x.id}" ${state.evidence[x.id]?'checked':''}><span>${esc(x.title)}</span></label><p>${esc(x.note)}</p></article>`).join('');
    $("#productionList").innerHTML=state.productions.length?state.productions.map((p,i)=>`<article class="production"><h3>${i+1}. ${esc(p.title)}</h3><p>${esc(p.role)}</p><p>Proof: ${esc(p.proof)}</p><button class="text-btn" data-delete-production="${p.id}">Remove</button></article>`).join(''):`<p class="empty">Add your first production and its proof.</p>`;
  }
  $("#evidenceChecklist").addEventListener("change",e=>{if(e.target.dataset.evidence){state.evidence[e.target.dataset.evidence]=e.target.checked;save()}});
  $("#productionForm").addEventListener("submit",e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));state.productions.push({id:crypto.randomUUID(),...o});e.target.reset();save();renderEvidence()});
  $("#productionList").addEventListener("click",e=>{const id=e.target.dataset.deleteProduction;if(id){state.productions=state.productions.filter(p=>p.id!==id);save();renderEvidence()}});

  $("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({app:"Acting Entrance Studio",version:seed.version,exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`acting-entrance-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href)};
  $("#importInput").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const payload=JSON.parse(await file.text());const imported=validatedState(Object.prototype.hasOwnProperty.call(payload||{},'state')?payload.state:payload);state=imported;save();renderAll();alert("Backup imported.")}catch{alert("That file is not a valid backup. Existing progress is unchanged.")}};
  function renderAll(){renderToday();renderDaily();renderRoadmap();renderSyllabus();renderSessions();renderTests();renderResources();renderEvidence();renderCinema();renderBucket();window.ACTING_LOGBOOK?.render()}
  window.ACTING_FILM_STORE={read:()=>clone(state.sessions),watched:()=>clone(state.completedTopics),today:todayISO,open:switchView,
    put(record,artwork=[]){
      const next=clone(state);for(const item of [...artwork,record]){const i=next.sessions.findIndex(s=>s.id===item.id);if(i<0)next.sessions.push(item);else next.sessions[i]=item;}
      // Preflight storage before changing state or queuing cloud events.
      try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw Error('Device storage is full. Export a backup and use an image URL instead; this card was not changed.');}
      state=next;save();
    },
    mark(key,value){state.completedTopics[key]=value;save();renderCinema();renderBucket();}};
  renderAll();
})();
