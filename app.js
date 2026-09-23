(() => {
  const KEY = "acting-entrance-studio-v1";
  const seed = window.ACTING_SEED;
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
  try { state = {...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}")}; } catch { state = structuredClone(defaults); }
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
        else if(value && typeof value==="object" && value.id===event.entityId){if(index>=0)result[field][index]=value;else result[field].push(value);}
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
  const todayISO = () => new Date().toISOString().slice(0,10);
  const viewNames = {today:"Today’s rehearsal room",daily:"Daily assessment ledger",roadmap:"Your 24-week route",syllabus:"Syllabus studio",practice:"Practice log",tests:"Test and error lab",resources:"Linked resource library",evidence:"NSD evidence file"};

  function switchView(id){
    $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${id}`));
    $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
    $("#viewTitle").textContent=viewNames[id];
    if(id==="daily") renderDaily(); if(id==="resources") renderResources(); if(id==="syllabus") renderSyllabus(); if(id==="practice") renderSessions(); if(id==="tests") renderTests(); if(id==="evidence") renderEvidence();
    scrollTo({top:0,behavior:"smooth"});
  }
  $("#nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)switchView(b.dataset.view)});
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));

  function renderToday(){
    const done=state.tasks.filter(t=>t.done).length, total=state.tasks.length||1;
    $("#weekProgressLabel").textContent=`${Math.round(done/total*100)}%`;
    $("#weekProgressBar").style.width=`${done/total*100}%`;
    const weekAgo=Date.now()-7*86400000;
    const recent=state.sessions.filter(s=>new Date(s.date).getTime()>=weekAgo);
    const knowledge=recent.filter(s=>["Written study","Play analysis","Film-performance analysis","Mock test"].includes(s.mode)).reduce((a,s)=>a+Number(s.minutes),0);
    const practice=recent.reduce((a,s)=>a+Number(s.minutes),0)-knowledge;
    $("#knowledgeMins").textContent=`${knowledge}m`; $("#practiceMins").textContent=`${practice}m`;
    const days=new Set(state.sessions.map(s=>s.date)); let streak=0,d=new Date(); while(days.has(d.toISOString().slice(0,10))){streak++;d.setDate(d.getDate()-1)} $("#streak").textContent=`${streak}d`;
    $("#todayTasks").innerHTML=state.tasks.length?state.tasks.map(t=>`<div class="task ${t.done?'done':''}"><input type="checkbox" data-task="${t.id}" ${t.done?'checked':''} aria-label="Complete ${esc(t.title)}"><div><div class="task-name">${esc(t.title)}</div><div class="meta"><span class="tag">${esc(t.track)}</span><span>${esc(t.lane)}</span>${t.due?`<span>${esc(t.due)}</span>`:''}</div></div><button class="delete" data-delete-task="${t.id}" aria-label="Delete task">×</button></div>`).join(""):`<p class="empty">No tasks yet. Add the next physical action.</p>`;
    const doneTopics=Object.values(state.completedTopics).filter(Boolean).length;
    const pulse=[['FTII papers',seed.tracks.find(t=>t.id==='ftii').modules.find(m=>m.id==='ftii-papers').topics.filter(x=>state.completedTopics[`ftii-papers:${x}`]).length+'/10'],['NSD plays',seed.tracks.find(t=>t.id==='nsd').modules.find(m=>m.id==='nsd-plays').topics.filter(x=>state.completedTopics[`nsd-plays:${x}`]).length+'/27'],['Syllabus',doneTopics+' topics'],['Productions',state.productions.length+'/6']];
    $("#pulseGrid").innerHTML=pulse.map(([a,b])=>`<div class="pulse"><strong>${b}</strong><small>${a}</small></div>`).join("");
    $("#recentSessions").innerHTML=state.sessions.length?state.sessions.slice(-4).reverse().map(s=>`<div class="session-mini"><strong>${esc(s.title)}</strong><small>${esc(s.mode)} · ${s.minutes}m · ${esc(s.track)}</small></div>`).join(""):`<p class="empty">Your first logged rehearsal will appear here.</p>`;
  }
  $("#todayTasks").addEventListener("change",e=>{if(e.target.dataset.task){const t=state.tasks.find(x=>x.id===e.target.dataset.task);t.done=e.target.checked;save()}});
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
    $("#dailyReviewList").innerHTML=reviews.map(r=>`<article class="daily-review"><div class="daily-review-head"><div><p class="eyebrow">${esc(r.date)} · WEEK ${esc(r.roadmapWeek||'—')}</p><h2>${esc(r.rating||'Daily review')}</h2></div><div class="daily-review-score">${r.scores?.total||0}/20</div></div><div class="score-breakdown"><span class="tag">Tasks ${r.scores?.taskEvidence||0}/10</span><span class="tag">MCQ ${r.scores?.mcq||0}/5</span><span class="tag">Objective ${r.scores?.objective||0}/5</span></div><div class="daily-task-grid">${(r.assigned||[]).map(t=>`<div class="daily-task ${esc(t.status)}"><strong>${esc(t.title)}</strong><small>${esc(t.track)} · ${esc(t.lane)} · ${esc(t.status.replaceAll('_',' '))}${t.evidence?' · '+esc(t.evidence):''}</small></div>`).join('')}</div><div class="daily-insight"><div><span>Strength</span><strong>${esc(r.strength||'—')}</strong></div><div><span>Priority repair</span><strong>${esc(r.repair||'—')}</strong></div></div>${r.carryForward?.length?`<p><strong>Carry forward:</strong> ${r.carryForward.map(esc).join(' · ')}</p>`:''}</article>`).join('');
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
  function renderSessions(){ $("#sessionList").innerHTML=state.sessions.length?state.sessions.slice().reverse().map(s=>`<article class="history-item"><div class="history-item-head"><strong>${esc(s.title)}</strong><span class="tag">${s.minutes}m</span></div><div class="meta"><span>${esc(s.date)}</span><span>${esc(s.mode)}</span><span>${esc(s.track)}</span><span>Quality ${s.rating}/5</span></div>${s.note?`<p>${esc(s.note)}</p>`:''}</article>`).join(''):`<p class="empty">No sessions logged yet.</p>`; }
  $("#clearSessions").onclick=()=>{if(confirm("Clear all practice sessions?")){state.sessions=[];save();renderSessions()}};

  $("#testForm").addEventListener("submit",e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));state.tests.push({id:crypto.randomUUID(),date:todayISO(),...o,score:Number(o.score),max:Number(o.max)});e.target.reset();e.target.max.value=100;save();renderTests()});
  function renderTests(){
    const last=state.tests.slice(-10), maxHeight=180; $("#scoreChart").innerHTML=last.length?last.map(t=>{const p=Math.max(0,Math.min(100,t.score/t.max*100));return `<div class="bar" style="height:${Math.max(4,p/100*maxHeight)}px" title="${esc(t.exam)}: ${p.toFixed(0)}%"><span>${p.toFixed(0)}%</span></div>`}).join(''):`<p class="empty">Log a test to see the trend.</p>`;
    $("#testList").innerHTML=state.tests.slice().reverse().map(t=>`<article class="history-item"><div class="history-item-head"><strong>${esc(t.exam)}</strong><span class="tag">${t.score}/${t.max}</span></div><div class="meta"><span>${esc(t.date)}</span><span>${esc(t.error)}</span></div>${t.repair?`<p>Repair: ${esc(t.repair)}</p>`:''}</article>`).join('');
  }

  function renderResources(){
    const track=$("#resourceTrack").value, access=$("#resourceAccess").value, q=$("#resourceSearch").value.trim().toLowerCase();
    const rows=seed.resources.filter(r=>(track==='all'||r.track.includes(track))&&(access==='all'||r.access===access)&&(!q||`${r.title} ${r.category} ${r.publisher}`.toLowerCase().includes(q)));
    $("#resourceCount").textContent=`${rows.length} resources · verified or checked 22 September 2026`;
    $("#resourceList").innerHTML=rows.map(r=>`<article class="resource"><div><h3>${esc(r.title)}</h3><p>${esc(r.publisher)} · ${esc(r.category)}</p></div><span class="status">${esc(r.track)} · ${esc(r.access)}</span><a href="${esc(r.url)}" target="_blank" rel="noopener">Open ↗</a></article>`).join('')||`<p class="empty">No resources match.</p>`;
  }
  $("#resourceTrack").onchange=renderResources; $("#resourceAccess").onchange=renderResources; $("#resourceSearch").oninput=renderResources;

  function renderEvidence(){
    $("#evidenceChecklist").innerHTML=seed.evidence.map(x=>`<article class="evidence-card"><label><input type="checkbox" data-evidence="${x.id}" ${state.evidence[x.id]?'checked':''}><span>${esc(x.title)}</span></label><p>${esc(x.note)}</p></article>`).join('');
    $("#productionList").innerHTML=state.productions.length?state.productions.map((p,i)=>`<article class="production"><h3>${i+1}. ${esc(p.title)}</h3><p>${esc(p.role)}</p><p>Proof: ${esc(p.proof)}</p><button class="text-btn" data-delete-production="${p.id}">Remove</button></article>`).join(''):`<p class="empty">Add your first production and its proof.</p>`;
  }
  $("#evidenceChecklist").addEventListener("change",e=>{if(e.target.dataset.evidence){state.evidence[e.target.dataset.evidence]=e.target.checked;save()}});
  $("#productionForm").addEventListener("submit",e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));state.productions.push({id:crypto.randomUUID(),...o});e.target.reset();save();renderEvidence()});
  $("#productionList").addEventListener("click",e=>{const id=e.target.dataset.deleteProduction;if(id){state.productions=state.productions.filter(p=>p.id!==id);save();renderEvidence()}});

  $("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({app:"Acting Entrance Studio",version:seed.version,exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`acting-entrance-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href)};
  $("#importInput").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const payload=JSON.parse(await file.text());state={...defaults,...(payload.state||payload)};save();renderAll();alert("Backup imported.")}catch{alert("That file is not a valid backup.")}};
  function renderAll(){renderToday();renderDaily();renderRoadmap();renderSyllabus();renderSessions();renderTests();renderResources();renderEvidence()}
  renderAll();
})();
