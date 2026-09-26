const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
const root = path.resolve(__dirname,'..');
const source = name => fs.readFileSync(path.join(root,name),'utf8');

function harness(initial = {}) {
  const storage = new Map([['acting-entrance-studio-v1',JSON.stringify(initial)]]);
  const elements = new Map();
  const get = selector => {
    if(!elements.has(selector))elements.set(selector,{
      value: selector==='#cinemaPath'?'Foundation':selector.endsWith('Search')?'':'all',
      textContent:'',innerHTML:'',style:{},listeners:{},
      addEventListener(type,fn){this.listeners[type]=fn;},
      insertAdjacentHTML(_where,text){this.innerHTML+=text;},
      reportValidity(){return true;},reset(){},scrollIntoView(){},focus(){},
      classList:{toggle(){}},
    });
    return elements.get(selector);
  };
  const context = {window:{dispatchEvent(){}},document:{body:{dataset:{}},querySelector:get,querySelectorAll:()=>[]},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    crypto:webcrypto,Event:class {constructor(type){this.type=type;}},
    FormData:class {constructor(form){this.values=form.values;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}},
    structuredClone,Date,console,scrollTo(){},confirm:()=>true,alert(){}};
  vm.createContext(context);
  for(const name of ['seed-data.js','cinema-data.js','bucket-data.js','app.js'])vm.runInContext(source(name),context,{filename:name});
  return {get,context,storage,state:()=>JSON.parse(storage.get('acting-entrance-studio-v1')),
    fire(selector,type,event){return get(selector).listeners[type](event);}};
}

test('catalogue has stable unique IDs, twelve starters and verified reference envelopes',()=>{
  const {context}=harness();const course=context.window.ACTING_CINEMA;
  assert.equal(course.films.length,30);assert.equal(new Set(course.films.map(f=>f.id)).size,30);
  assert.equal(new Set(course.films.flatMap(f=>f.directors)).size,31);
  assert.equal(course.starterIds.length,12);assert.equal(new Set(course.starterIds).size,12);
  for(const film of course.films){
    assert.ok(/^https:\/\//.test(film.url));assert.ok(film.minutes>0);assert.ok(film.language);
    assert.ok(film.directors.length);assert.ok(film.context && film.question && film.bengalBridge);
    assert.equal(film.sourceType,'supplementary');assert.equal(film.verifiedOn,'2026-09-26');
    assert.equal(film.availability,'lawful full-film availability not verified');
  }
  assert.ok(course.starterIds.every(id=>course.films.some(f=>f.id===id&&f.path==='Foundation')));
  assert.equal(context.window.ACTING_SEED.tracks.filter(t=>t.id==='world').length,1);
});

test('whole-library, region, director, focus, search and empty-result filters',()=>{
  const h=harness();assert.match(h.get('#cinemaCount').textContent,/12 of 30/);
  h.get('#cinemaPath').value='all';h.fire('#cinemaPath','change',{});
  assert.match(h.get('#cinemaCount').textContent,/30 of 30/);
  h.get('#cinemaRegion').value='Japan';h.fire('#cinemaRegion','change',{});
  assert.match(h.get('#cinemaCount').textContent,/2 of 30/);
  h.get('#cinemaDirector').value='Yasujiro Ozu';h.fire('#cinemaDirector','change',{});
  assert.match(h.get('#cinemaCount').textContent,/1 of 30/);
  h.get('#cinemaFocus').value='Body / routine';h.fire('#cinemaFocus','change',{});
  assert.match(h.get('#cinemaFilms').innerHTML,/No films match/);
  h.get('#cinemaStarter').onclick();h.get('#cinemaSearch').value='neorealism';h.fire('#cinemaSearch','input',{});
  assert.match(h.get('#cinemaCount').textContent,/1 of 30/);
});

test('watched ticks preserve old progress, queue topic events and can be undone',()=>{
  const h=harness({completedTopics:{'shared-theory:Subtext and active listening':true},dailyReviews:[{id:'old-review',date:'2026-09-25'}]});
  h.context.window.ACTING_SYNC.activate('test-user');
  h.fire('#cinemaFilms','change',{target:{dataset:{filmWatched:'bicycle-thieves'},checked:true}});
  assert.equal(h.state().completedTopics['cinema-watched:bicycle-thieves'],true);
  assert.equal(h.state().completedTopics['shared-theory:Subtext and active listening'],true);
  assert.equal(h.state().dailyReviews[0].id,'old-review');
  assert.ok(h.context.window.ACTING_SYNC.outbox('test-user').some(e=>e.kind==='topic'&&e.entityId==='cinema-watched:bicycle-thieves'&&e.payload==='true'));
  h.get('#cinemaProgress').value='watched';h.fire('#cinemaProgress','change',{});
  assert.match(h.get('#cinemaCount').textContent,/1 of 30/);
  h.fire('#cinemaFilms','change',{target:{dataset:{filmWatched:'bicycle-thieves'},checked:false}});
  assert.equal(h.state().completedTopics['cinema-watched:bicycle-thieves'],false);
});

test('study tasks are deduplicated and do not claim completion',()=>{
  const h=harness();const button={dataset:{filmPlan:'bicycle-thieves'}};
  const event={target:{closest:()=>button}};
  h.fire('#cinemaFilms','click',event);h.fire('#cinemaFilms','click',event);
  assert.equal(h.state().tasks.filter(t=>t.id==='cinema-task-bicycle-thieves').length,1);
  assert.equal(h.state().tasks.find(t=>t.id==='cinema-task-bicycle-thieves').done,false);
});

test('excerpt reflection uses existing session events without marking viewed or assessed',()=>{
  const h=harness();h.context.window.ACTING_SYNC.activate('test-user');
  const form=h.get('#cinemaReviewForm');form.values={filmId:'bicycle-thieves',date:'2026-09-26',minutes:'30',rating:'4',scope:'Lawful excerpt only',context:'Source: Criterion',observation:'He pauses <script>unsafe</script>',interpretation:'I infer uncertainty',repair:'Practise asking for help'};
  h.fire('#cinemaReviewForm','submit',{target:form,preventDefault(){}});
  const session=h.state().sessions[0];assert.equal(session.filmId,'bicycle-thieves');assert.equal(session.minutes,30);assert.equal(session.rating,4);
  assert.equal(session.scope,'Lawful excerpt only');assert.equal(h.state().completedTopics['cinema-watched:bicycle-thieves'],undefined);
  assert.equal(h.state().dailyReviews.length,0);assert.match(h.get('#cinemaReviews').innerHTML,/&lt;script&gt;/);
  assert.ok(!h.get('#cinemaReviews').innerHTML.includes('<script>unsafe'));
  assert.ok(h.context.window.ACTING_SYNC.outbox('test-user').some(e=>e.kind==='session'&&JSON.parse(e.payload).filmId==='bicycle-thieves'));
  h.get('#cinemaProgress').value='reflected';h.fire('#cinemaProgress','change',{});
  assert.match(h.get('#cinemaCount').textContent,/1 of 30/);
});

test('remote replay includes film progress and reflections and older events still work',()=>{
  const h=harness();const bridge=h.context.window.ACTING_SYNC;bridge.activate('test-user');
  const session={id:'reflection-1',date:'2026-09-26',filmId:'tokyo-story',title:'Tokyo Story',mode:'Film-performance analysis',minutes:30,rating:3};
  bridge.applyRemote('test-user',[
    {kind:'topic',entityId:'cinema-watched:tokyo-story',action:'put',payload:'true'},
    {kind:'session',entityId:session.id,action:'put',payload:JSON.stringify(session)},
    {kind:'topic',entityId:'ftii-papers:2024-25',action:'put',payload:'true'},
  ]);
  assert.equal(h.state().completedTopics['cinema-watched:tokyo-story'],true);
  assert.equal(h.state().completedTopics['ftii-papers:2024-25'],true);
  assert.equal(h.state().sessions[0].filmId,'tokyo-story');
  assert.match(h.get('#cinemaStats').innerHTML,/>1<\/strong><span>with reflection/);
});

test('older JSON backups still import and film progress survives a backup round trip',async()=>{
  const h=harness();
  const oldBackup={state:{currentWeek:7,completedTopics:{'ftii-papers:2024-25':true},sessions:[],tasks:[{id:'personal-existing',title:'Existing task',done:false}]}};
  await h.get('#importInput').onchange({target:{files:[{text:async()=>JSON.stringify(oldBackup)}]}});
  assert.equal(h.state().currentWeek,7);assert.equal(h.state().tasks[0].id,'personal-existing');
  h.fire('#cinemaFilms','change',{target:{dataset:{filmWatched:'tokyo-story'},checked:true}});
  const roundTrip={app:'Acting Entrance Studio',version:'2026-09-26',state:h.state()};
  const second=harness();
  await second.get('#importInput').onchange({target:{files:[{text:async()=>JSON.stringify(roundTrip)}]}});
  assert.equal(second.state().completedTopics['cinema-watched:tokyo-story'],true);
  assert.equal(second.state().completedTopics['ftii-papers:2024-25'],true);
  assert.equal(second.state().tasks[0].id,'personal-existing');
});

test('PWA precaches the new files and course, and scripts load in dependency order',()=>{
  const sw=source('sw.js'),html=source('index.html');
  for(const name of ['cinema.css','cinema-data.js','bucket-data.js','INTERNATIONAL_CINEMA_COURSE.md','MOVIE_BUCKET_LIST.md']){
    assert.ok(sw.includes(`./${name}`));assert.ok(fs.existsSync(path.join(root,name)));
  }
  for(const name of ['seed-data.js','cinema-data.js','cinema.css']){
    assert.ok(html.includes(`${name}?v=20260927`));
    assert.ok(sw.includes(`./${name}?v=20260927`));
  }
  assert.ok(html.indexOf('src="seed-data.js?')<html.indexOf('src="cinema-data.js?'));
  assert.ok(html.indexOf('src="cinema-data.js?')<html.indexOf('src="bucket-data.js?'));
  assert.ok(html.indexOf('src="bucket-data.js?')<html.indexOf('src="app.js?'));
  for(const name of ['app.js','bucket-data.js']){assert.ok(html.includes(`${name}?v=20260927-van-gogh`));assert.ok(sw.includes(`./${name}?v=20260927-van-gogh`));}
  assert.ok(sw.includes('v8-van-gogh'));
});

test('personal import has six bounded lists and 59 distinct titles, without claimed film metadata',()=>{
  const {context}=harness();const b=context.window.ACTING_BUCKET;
  assert.equal(b.films.length,59);assert.equal(new Set(b.films.map(f=>f.id)).size,59);
  assert.equal(b.collections.length,6);
  for(const c of b.collections)assert.equal(b.films.filter(f=>f.collectionId===c.id).length,c.titleCount);
  for(const f of b.films){assert.equal(f.sourceType,'personal');assert.equal(f.verificationStatus,'pin_title_observed');assert.equal(f.year,undefined);}
  assert.equal(b.films.filter(f=>f.courseId).length,3);
  assert.equal(b.films.filter(f=>f.title==='Hamnet').length,1);
  assert.match(b.preference,/optional afterwards/);
});

test('new memory date follows the user India calendar rather than UTC',()=>{
  const h=harness();const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const value=type=>parts.find(p=>p.type===type).value;
  assert.equal(h.get('#bucketMemoryDate').value,`${value('year')}-${value('month')}-${value('day')}`);
});

test('bucket filters search and watching state, including no matches',()=>{
  const h=harness();assert.match(h.get('#bucketCount').textContent,/59 of 59/);
  h.get('#bucketCollection').value='poets';h.fire('#bucketCollection','change',{});
  assert.match(h.get('#bucketCount').textContent,/9 of 59/);
  h.get('#bucketSearch').value='happy';h.fire('#bucketSearch','input',{});
  assert.match(h.get('#bucketCount').textContent,/1 of 59/);
  h.get('#bucketSearch').value='not a film';h.fire('#bucketSearch','input',{});
  assert.match(h.get('#bucketFilms').innerHTML,/No titles match/);
});

test('enjoyment tick alone adds no task, memory, assessment, syllabus mastery or practice hours',()=>{
  const h=harness({tasks:[{id:'existing',done:false}],dailyReviews:[{id:'existing-review'}]});
  h.context.window.ACTING_SYNC.activate('test-user');
  h.fire('#bucketFilms','change',{target:{dataset:{bucketWatched:'bucket-ghost-world'},checked:true}});
  assert.equal(h.state().completedTopics['bucket-watched:bucket-ghost-world'],true);
  assert.equal(h.state().tasks.length,1);assert.equal(h.state().tasks[0].done,false);
  assert.equal(h.state().sessions.length,0);assert.equal(h.state().dailyReviews.length,1);
  assert.equal(h.get('#knowledgeMins').textContent,'0m');assert.equal(h.get('#practiceMins').textContent,'0m');
  assert.ok(h.context.window.ACTING_SYNC.outbox('test-user').some(e=>e.kind==='topic'&&e.entityId==='bucket-watched:bucket-ghost-world'));
  h.get('#bucketProgress').value='watched';h.fire('#bucketProgress','change',{});
  assert.match(h.get('#bucketCount').textContent,/1 of 59/);
  h.fire('#bucketFilms','change',{target:{dataset:{bucketWatched:'bucket-ghost-world'},checked:false}});
  assert.equal(h.state().completedTopics['bucket-watched:bucket-ghost-world'],false);
});

test('three course overlaps share watched ticks both ways and preserve old syllabus keys',()=>{
  const h=harness({completedTopics:{'ftii-papers:2024-25':true}});
  h.fire('#bucketFilms','change',{target:{dataset:{bucketWatched:'bucket-wings'},checked:true}});
  assert.equal(h.state().completedTopics['cinema-watched:wings'],true);
  assert.equal(h.state().completedTopics['ftii-papers:2024-25'],true);
  h.fire('#cinemaFilms','change',{target:{dataset:{filmWatched:'wings'},checked:false}});
  assert.equal(h.state().completedTopics['cinema-watched:wings'],false);
  assert.match(h.get('#bucketCount').textContent,/0 marked watched/);
});

test('one optional feeling saves ungraded, escaped, with no watched tick, hours or learning streak',()=>{
  const h=harness();h.context.window.ACTING_SYNC.activate('test-user');
  const form=h.get('#bucketMemoryForm');form.values={filmId:'bucket-ghost-world',date:new Date().toISOString().slice(0,10),feeling:'It felt <script>tender</script>',moment:''};
  h.fire('#bucketMemoryForm','submit',{target:form,preventDefault(){}});
  const s=h.state().sessions[0];assert.equal(s.mode,'Film memory');assert.equal(s.minutes,0);assert.equal(s.rating,null);
  assert.equal(h.state().completedTopics['bucket-watched:bucket-ghost-world'],undefined);
  assert.match(h.get('#bucketMemories').innerHTML,/&lt;script&gt;/);assert.ok(!h.get('#bucketMemories').innerHTML.includes('<script>'));
  assert.equal(h.get('#knowledgeMins').textContent,'0m');assert.equal(h.get('#practiceMins').textContent,'0m');assert.equal(h.get('#streak').textContent,'0d');
  assert.equal(h.state().dailyReviews.length,0);assert.match(h.get('#recentSessions').innerHTML,/first logged rehearsal/);
  assert.ok(h.context.window.ACTING_SYNC.outbox('test-user').some(e=>e.kind==='session'&&JSON.parse(e.payload).mode==='Film memory'));
  h.get('#clearSessions').onclick();assert.equal(h.state().sessions.length,1);
  h.fire('#bucketMemories','click',{target:{dataset:{memoryRemove:s.id}}});assert.equal(h.state().sessions.length,0);
});

test('empty memory is safely skipped and a study reflection needs only one field',()=>{
  const h=harness({sessions:[]});const memory=h.get('#bucketMemoryForm');memory.values={filmId:'bucket-ghost-world',date:'2026-09-27',feeling:' ',moment:''};
  h.fire('#bucketMemoryForm','submit',{target:memory,preventDefault(){}});assert.equal(h.state().sessions.length,0);
  const study=h.get('#cinemaReviewForm');study.values={filmId:'wings',date:'2026-09-27',minutes:'10',rating:'3',scope:'Rewatch / analysis',context:'',observation:'I noticed a pause.',interpretation:'',repair:''};
  h.fire('#cinemaReviewForm','submit',{target:study,preventDefault(){}});assert.equal(h.state().sessions.length,1);
  assert.equal(h.state().completedTopics['cinema-watched:wings'],undefined);
});

test('personal ticks and memories survive remote replay and JSON backup import',async()=>{
  const h=harness();const bridge=h.context.window.ACTING_SYNC;bridge.activate('test-user');
  const memory={id:'memory-1',filmId:'bucket-ghost-world',date:'2026-09-27',title:'Ghost World',mode:'Film memory',track:'Personal',minutes:0,rating:null,note:'A quiet feeling'};
  bridge.applyRemote('test-user',[
    {kind:'topic',entityId:'bucket-watched:bucket-ghost-world',action:'put',payload:'true'},
    {kind:'session',entityId:memory.id,action:'put',payload:JSON.stringify(memory)}
  ]);
  assert.match(h.get('#bucketCount').textContent,/1 marked watched/);assert.match(h.get('#bucketMemories').innerHTML,/quiet feeling/);
  const second=harness();await second.get('#importInput').onchange({target:{files:[{text:async()=>JSON.stringify({state:h.state()})}]}});
  assert.equal(second.state().completedTopics['bucket-watched:bucket-ghost-world'],true);
  assert.equal(second.state().sessions[0].mode,'Film memory');assert.match(second.get('#bucketMemories').innerHTML,/quiet feeling/);
});

test('optional forms are collapsed and imported titles do not carry automatic assignments',()=>{
  const html=source('index.html'),data=source('bucket-data.js');
  assert.match(html,/<details[^>]*id="cinemaStudy"[^>]*>/);assert.match(html,/<details[^>]*id="bucketMemory"[^>]*>/);
  assert.ok(!/<details[^>]*id="(?:cinemaStudy|bucketMemory)"[^>]*\sopen/.test(html));
  assert.ok(!/name="(?:context|observation|interpretation|repair)"[^>]*required/.test(html));
  assert.ok(!data.includes('invite_code'));assert.match(html,/Watched/);
});

test('mobile room selector reaches every existing view and ignores unknown rooms',()=>{
  const h=harness();
  for(const [id,title] of Object.entries({today:'Today’s rehearsal room',daily:'Daily assessment ledger',roadmap:'Your 24-week route',syllabus:'Syllabus studio',practice:'Practice log',tests:'Test and error lab',resources:'Linked resource library',evidence:'NSD evidence file',cinema:'World cinema studio',bucket:'My movie bucket list'})){
    h.fire('#mobileView','change',{target:{value:id}});assert.equal(h.get('#viewTitle').textContent,title);assert.equal(h.context.document.body.dataset.room,id);assert.equal(h.get('#mobileView').value,id);
  }
  h.fire('#mobileView','change',{target:{value:'unknown'}});assert.equal(h.get('#viewTitle').textContent,'My movie bucket list');
});

test('theme ships offline fonts, attribution and original graphic treatments without remote dependencies',()=>{
  const css=source('poster-theme.css'),sw=source('sw.js'),html=source('index.html');
  assert.ok(html.includes('poster-theme.css?v=20260927-cinema'));assert.ok(sw.includes('./poster-theme.css?v=20260927-cinema'));
  assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.ok(!/url\(["']?https?:/.test(css));
  for(const name of ['anton-latin.woff2','anton-latin-ext.woff2','archivo-black-latin.woff2','archivo-black-latin-ext.woff2','cormorant-roman-latin.woff2','cormorant-roman-latin-ext.woff2','cormorant-italic-latin.woff2','cormorant-italic-latin-ext.woff2','dm-sans-latin.woff2','dm-sans-latin-ext.woff2']){
    const buffer=fs.readFileSync(path.join(root,'fonts',name));assert.equal(buffer.toString('ascii',0,4),'wOF2');assert.ok(css.includes(name));assert.ok(sw.includes(`./fonts/${name}`));
  }
  for(const name of ['Anton-OFL.txt','Archivo-Black-OFL.txt','Cormorant-OFL.txt','DM-Sans-OFL.txt'])assert.match(source(`fonts/${name}`),/SIL OPEN FONT LICENSE/);
  assert.ok(fs.existsSync(path.join(root,'DESIGN_NOTES.md')));assert.match(harness().get('#bucketFilms').innerHTML,/data-collection="crossroads"/);
  const manifest=JSON.parse(source('manifest.webmanifest'));
  assert.equal(manifest.theme_color,'#101110');assert.equal(manifest.background_color,'#f4f2e9');
  for(const size of [192,512]){
    const filename=`icons/cinema-studio-${size}.png`,buffer=fs.readFileSync(path.join(root,filename));
    assert.equal(buffer.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(buffer.readUInt32BE(16),size);assert.equal(buffer.readUInt32BE(20),size);
    assert.ok(manifest.icons.some(i=>i.src===filename));assert.ok(sw.includes(`./${filename}`));
  }
});

test('new catharsis shelf is isolated from old progress and has only observed title labels',()=>{
  const h=harness({completedTopics:{'bucket-watched:bucket-ghost-world':true},sessions:[{id:'old-memory',mode:'Film memory',minutes:0,note:'Keep me'}]});
  h.get('#bucketCollection').value='catharsis';h.fire('#bucketCollection','change',{});
  assert.match(h.get('#bucketCount').textContent,/11 of 59/);assert.match(h.get('#bucketFilms').innerHTML,/Ikiru/);assert.match(h.get('#bucketFilms').innerHTML,/The Great Beauty/);
  h.fire('#bucketFilms','change',{target:{dataset:{bucketWatched:'bucket-ikiru'},checked:true}});
  assert.equal(h.state().completedTopics['bucket-watched:bucket-ghost-world'],true);assert.equal(h.state().completedTopics['bucket-watched:bucket-ikiru'],true);
  assert.equal(h.state().sessions.length,1);assert.equal(h.state().sessions[0].note,'Keep me');assert.equal(h.state().dailyReviews.length,0);assert.equal(h.get('#practiceMins').textContent,'0m');
});

test('every precached asset exists and visual research never bundles reference photographs',()=>{
  for(const [,url] of source('sw.js').matchAll(/"\.\/([^"?]+)(?:\?[^" ]*)?"/g))assert.ok(fs.existsSync(path.join(root,url)),`Missing cached asset ${url}`);
  const html=source('index.html');assert.match(html,/icons\/rehearsal-frame\.svg/);assert.match(html,/LIVE FOR/);assert.ok(!html.includes('Aarman Roy.jpg'));
  assert.match(source('DESIGN_NOTES.md'),/not a verified original font/);assert.match(source('poster-theme.css'),/font-family:"Archivo Black"/);
});

test('Van Gogh import preserves old ticks and memories and distinguishes episode, series and segment',async()=>{
  const h=harness({completedTopics:{'bucket-watched:bucket-ikiru':true,'ftii-papers:2024-25':true},sessions:[{id:'old-memory',filmId:'bucket-ikiru',mode:'Film memory',minutes:0,note:'Unchanged'}]});
  h.get('#bucketCollection').value='van-gogh';h.fire('#bucketCollection','change',{});
  assert.match(h.get('#bucketCount').textContent,/9 of 59/);assert.match(h.get('#bucketFilms').innerHTML,/Vincent and the Doctor/);assert.match(h.get('#bucketFilms').innerHTML,/not the entire Doctor Who series/);assert.match(h.get('#bucketFilms').innerHTML,/documentary series/);assert.match(h.get('#bucketFilms').innerHTML,/Crows \/ Van Gogh segment/);
  const films=h.context.window.ACTING_BUCKET.films.filter(f=>f.collectionId==='van-gogh');assert.equal(films.length,9);assert.ok(films.every(f=>!f.courseId&&f.year===undefined));
  h.context.window.ACTING_SYNC.activate('test-user');h.fire('#bucketFilms','change',{target:{dataset:{bucketWatched:'bucket-doctor-who-vincent'},checked:true}});
  const state=h.state();assert.equal(state.completedTopics['bucket-watched:bucket-ikiru'],true);assert.equal(state.completedTopics['ftii-papers:2024-25'],true);assert.equal(state.sessions.length,1);assert.equal(state.sessions[0].note,'Unchanged');assert.equal(state.dailyReviews.length,0);assert.equal(h.get('#practiceMins').textContent,'0m');
  assert.ok(h.context.window.ACTING_SYNC.outbox('test-user').some(e=>e.entityId==='bucket-watched:bucket-doctor-who-vincent'));
  const second=harness();await second.get('#importInput').onchange({target:{files:[{text:async()=>JSON.stringify({state})}]}});assert.equal(second.state().completedTopics['bucket-watched:bucket-doctor-who-vincent'],true);assert.equal(second.state().sessions[0].note,'Unchanged');
});
