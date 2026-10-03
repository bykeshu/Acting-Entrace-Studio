const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=f=>fs.readFileSync(path.join(root,f),'utf8'),core=require('../library-core.js');
const context={window:{}};vm.createContext(context);for(const f of ['seed-data.js','study-material-data.js'])vm.runInContext(source(f),context);
const {ACTING_SEED:seed,ACTING_STUDY:data}=context.window;
test('Every original resource belongs to exactly one shelf, with no exam documents in the library',()=>{
 assert.equal(seed.resources.length,47);assert.ok(seed.resources.some(r=>core.shelf(r)==='library'));
 for(const r of seed.resources){assert.ok(['library','exam','research'].includes(core.shelf(r)));if(/past paper|official|audition/.test(r.category))assert.notEqual(core.shelf(r),'library');if(/text|book|edition|history|practitioner/.test(r.category))assert.equal(core.shelf(r),'library');}
});
test('37 learning cards have stable IDs, scoped evidence, seven PDFs and safe external links',()=>{
 assert.equal(data.materials.length,37);assert.equal(new Set(data.materials.map(r=>r.id)).size,37);
 const ids=new Set(data.sources.map(r=>r.sourceId));
 for(const r of data.materials){assert.ok(r.title&&r.author&&r.why&&r.language);assert.ok(core.priorities[r.priority]);assert.ok(r.evidenceSourceIds.every(id=>ids.has(id)));for(const url of [r.accessUrl,r.internetArchive?.url].filter(Boolean)){const u=new URL(url);assert.equal(u.protocol,'https:');assert.ok(!u.username&&!u.password&&!u.port);}assert.ok(!/prospectus|question paper|guideline/i.test(r.title));}
 assert.equal(data.materials.filter(r=>r.localPdf).length,7);
 for(const r of data.materials.filter(r=>r.localPdf)){assert.match(r.localPdf,/^study-material\/open-texts\/[A-Za-z0-9_]+\.pdf$/);const buffer=fs.readFileSync(path.join(root,r.localPdf));assert.equal(buffer.toString('ascii',0,5),'%PDF-');assert.ok(source('STUDY_LIBRARY.md').includes(crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase()));}
});
test('Library filters combine priority, language, topic, track, access and search without changing records',()=>{
 const before=JSON.stringify(data);
 assert.equal(core.filter(data.materials,{priority:'start_here'}).length,6);
 assert.ok(core.filter(data.materials,{language:'Bengali',track:'Bengal'}).every(r=>r.language==='Bengali'&&r.tracks.includes('Bengal')));
 assert.equal(core.filter(data.materials,{access:'local_pdf'}).length,7);
 assert.equal(core.filter(data.materials,{topic:'Natyashastra',search:'Bharata'}).length,5);
 assert.equal(core.filter(data.materials,{search:'CI nothing matches'}).length,0);
 assert.equal(JSON.stringify(data),before);
});
test('Action precedence preserves PDF, Archive borrowing/preview, rights-unverified record and edition links',()=>{
 for(const r of data.materials){const a=core.action(r);if(r.localPdf)assert.equal(a.url,r.localPdf);else if(r.archiveScan)assert.equal(a.url,r.archiveScan.url);else if(r.internetArchive)assert.equal(a.url,r.internetArchive.url);else assert.equal(a.url,r.accessUrl);}
 const unverified=data.materials.find(r=>r.internetArchive?.accessType==='view_record_rights_unverified');assert.equal(core.action(unverified).label,'View record');assert.ok(!unverified.localPdf);
 assert.equal(core.action(data.materials.find(r=>r.id==='indian-cinema-vsi')).accessType,'preview_only');
 assert.match(data.materials[0].availabilityNote,/not a confirmed volume/);
});
test('Library shell is offline, separately navigable and has no progress/storage writes',()=>{
 const html=source('index.html'),sw=source('sw.js'),ui=source('study-material-ui.js');
 for(const f of ['library-core.js','library.css','study-material-data.js','study-material-ui.js']){const v=f==='library.css'?'20260928-library':'20260929-bengali-scans';assert.ok(html.includes(f+'?v='+v));assert.ok(sw.includes('./'+f+'?v='+v));}
 assert.match(html,/data-view="study"/);assert.match(html,/value="study">12 · Study Material/);assert.match(html,/data-view="resources"/);
 assert.ok(!/localStorage|store\.put|completedTopics|\.mark\(|fetch\(/.test(ui));assert.ok(html.indexOf('src="library-core.js')<html.indexOf('src="app.js'));
});
test('Bengali scans preserve volume uncertainty, external-only access, source rights caveats and retail-only Volume 4',()=>{
 const scans=data.materials.filter(r=>r.archiveScan);assert.equal(scans.length,3);
 for(const r of scans){assert.ok(!r.localPdf);assert.equal(core.action(r).label,'Read scan');assert.equal(new URL(r.archiveScan.url).hostname,'archive.org');assert.equal(new URL(r.archiveScan.pdfUrl).hostname,'archive.org');assert.match(r.archiveScan.note,/not downloaded or structurally validated|Personal local copy validated/);assert.match(r.archiveScan.note,/permission.*not.*confirmed/);assert.ok(!source('sw.js').includes(r.archiveScan.pdfUrl));}
 const v2=data.materials.find(r=>r.id==='bharata-natyashastra-bn-v2');assert.equal(v2.archiveScan.volumeStatus,'verified_catalogue_and_front_matter');assert.ok(!v2.isbn);
 const unknown=data.materials.find(r=>r.id==='bharata-natyashastra-bn-unnumbered');assert.match(unknown.romanTitle,/probable Volume 3/);assert.match(unknown.archiveScan.note,/NOT confirmed/);assert.ok(!unknown.isbn);
 const v4=data.materials.find(r=>r.id==='bharata-natyashastra-bn-v4');assert.ok(!v4.archiveScan&&!v4.localPdf);assert.match(v4.availabilityNote,/not found/);
 const pack=JSON.parse(source('study-material/bengali-natyashastra-sources.json'));assert.match(pack.volumes[0].sourceRightsStatement,/not an independently established/);
 assert.equal(fs.readdirSync(path.join(root,'study-material/open-texts')).length,7);
});

test('Personal scan actions are file-only and reject unsafe paths without changing public actions',()=>{
 const r=data.materials.find(r=>r.id==='bharata-natyashastra-bn-v1');
 const copies={[r.id]:{url:'../study-material/archive-scans/Bharat_Natyashastra_Bengali_Volume_1.pdf',pages:388,verifiedOn:'2026-09-29'}};
 for(const protocol of ['https:','http:',undefined])assert.equal(core.personalAction(r,copies,protocol),null);
 assert.equal(core.personalAction(r,copies,'file:').label,'Open personal local PDF');
 assert.equal(core.action(r).url,r.archiveScan.url);
 assert.equal(core.personalAction(r,{},'file:'),null);
 for(const url of ['javascript:alert(1)','https://example.com/a.pdf','../study-material/archive-scans/../../secret.pdf'])assert.equal(core.personalAction(r,{[r.id]:{url}},'file:'),null);
 assert.match(source('.gitignore'),/^study-material-local\.js$/m);
 assert.match(source('.gitignore'),/^study-material\/archive-scans\/$/m);
 assert.ok(!source('sw.js').includes('study-material-local.js'));
 assert.ok(!source('sw.js').includes('archive-scans/'));
 assert.ok(!source('study-material-data.js').includes('Bharat_Natyashastra_Bengali_Volume_1.pdf'));
});

test('Library renders optional local buttons only for file pages while retaining external actions',()=>{
 const record=data.materials.find(r=>r.id==='bharata-natyashastra-bn-v1');
 function render(protocol){
  const nodes=new Map();const node=s=>{if(!nodes.has(s))nodes.set(s,{value:'all',innerHTML:'',textContent:'',insertAdjacentHTML(){},addEventListener(){}});return nodes.get(s);};node('#studySearch').value='';
  const ctx={window:{ACTING_STUDY:{...data,materials:[record]},ACTING_LIBRARY:core,ACTING_SEED:seed,ACTING_PERSONAL_STUDY:{[record.id]:{url:'../study-material/archive-scans/Bharat_Natyashastra_Bengali_Volume_1.pdf',pages:388,verifiedOn:'2026-09-29'}}},document:{querySelector:node},location:{protocol}};
  vm.createContext(ctx);vm.runInContext(source('study-material-ui.js'),ctx);return node('#studyCards').innerHTML;
 }
 const local=render('file:'),publicHtml=render('https:');
 assert.match(local,/Open personal local PDF/);assert.match(local,/Personal local copy · 388 pages/);
 assert.ok(!publicHtml.includes('Open personal local PDF'));assert.ok(!publicHtml.includes('../study-material/archive-scans/'));
 for(const html of [local,publicHtml]){assert.ok(html.includes(record.archiveScan.url));assert.ok(html.includes(record.archiveScan.pdfUrl));assert.match(html,/Open PDF \(external scan\)/);}
});
test('An Actor’s Work preview remains a clearly labelled external excerpt, not a locally hosted full book',()=>{
 const r=data.materials.find(r=>r.id==='stanislavski-actors-work'),p=r.publisherPreview;
 assert.equal(p.label,'Publisher preview (77 pages)');assert.equal(p.pages,77);assert.equal(p.accessType,'publisher_excerpt');assert.match(p.note,/not the full book/);assert.equal(new URL(p.url).hostname,'api.pageplace.de');assert.equal(core.action(r).url,r.internetArchive.url);assert.ok(!r.localPdf);
 assert.ok(!fs.existsSync(path.join(root,'study-material/publisher-previews')));assert.ok(!source('sw.js').includes('api.pageplace.de'));assert.ok(!source('study-material-data.js').includes('082176.pdf'));assert.match(source('study-material-ui.js'),/publisherPreview\.label/);
});
