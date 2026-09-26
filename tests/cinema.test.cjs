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
  const context = {window:{dispatchEvent(){}},document:{querySelector:get,querySelectorAll:()=>[]},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    crypto:webcrypto,Event:class {constructor(type){this.type=type;}},
    FormData:class {constructor(form){this.values=form.values;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}},
    structuredClone,Date,console,scrollTo(){},confirm:()=>true,alert(){}};
  vm.createContext(context);
  for(const name of ['seed-data.js','cinema-data.js','app.js'])vm.runInContext(source(name),context,{filename:name});
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
  for(const name of ['cinema.css','cinema-data.js','INTERNATIONAL_CINEMA_COURSE.md']){
    assert.ok(sw.includes(`./${name}`));assert.ok(fs.existsSync(path.join(root,name)));
  }
  for(const name of ['seed-data.js','cinema-data.js','app.js','cinema.css']){
    assert.ok(html.includes(`${name}?v=20260926`));
    assert.ok(sw.includes(`./${name}?v=20260926`));
  }
  assert.ok(html.indexOf('src="seed-data.js?')<html.indexOf('src="cinema-data.js?'));
  assert.ok(html.indexOf('src="cinema-data.js?')<html.indexOf('src="app.js?'));
  assert.ok(sw.includes('v4-world-cinema'));
});
