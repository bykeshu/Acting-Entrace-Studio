const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=f=>fs.readFileSync(path.join(root,f),'utf8'),core=require('../library-core.js');
const context={window:{}};vm.createContext(context);for(const f of ['seed-data.js','study-material-data.js'])vm.runInContext(source(f),context);
const {ACTING_SEED:seed,ACTING_STUDY:data}=context.window;
test('Every original resource belongs to exactly one shelf, with no exam documents in the library',()=>{
 assert.equal(seed.resources.length,47);assert.ok(seed.resources.some(r=>core.shelf(r)==='library'));
 for(const r of seed.resources){assert.ok(['library','exam','research'].includes(core.shelf(r)));if(/past paper|official|audition/.test(r.category))assert.notEqual(core.shelf(r),'library');if(/text|book|edition|history|practitioner/.test(r.category))assert.equal(core.shelf(r),'library');}
});
test('34 learning cards have stable IDs, scoped evidence, six PDFs and safe external links',()=>{
 assert.equal(data.materials.length,34);assert.equal(new Set(data.materials.map(r=>r.id)).size,34);
 const ids=new Set(data.sources.map(r=>r.sourceId));
 for(const r of data.materials){assert.ok(r.title&&r.author&&r.why&&r.language);assert.ok(core.priorities[r.priority]);assert.ok(r.evidenceSourceIds.every(id=>ids.has(id)));for(const url of [r.accessUrl,r.internetArchive?.url].filter(Boolean)){const u=new URL(url);assert.equal(u.protocol,'https:');assert.ok(!u.username&&!u.password&&!u.port);}assert.ok(!/prospectus|question paper|guideline/i.test(r.title));}
 assert.equal(data.materials.filter(r=>r.localPdf).length,6);
 for(const r of data.materials.filter(r=>r.localPdf)){assert.match(r.localPdf,/^study-material\/open-texts\/[A-Za-z0-9_]+\.pdf$/);const buffer=fs.readFileSync(path.join(root,r.localPdf));assert.equal(buffer.toString('ascii',0,5),'%PDF-');assert.ok(source('STUDY_LIBRARY.md').includes(crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase()));}
});
test('Library filters combine priority, language, topic, track, access and search without changing records',()=>{
 const before=JSON.stringify(data);
 assert.equal(core.filter(data.materials,{priority:'start_here'}).length,6);
 assert.ok(core.filter(data.materials,{language:'Bengali',track:'Bengal'}).every(r=>r.language==='Bengali'&&r.tracks.includes('Bengal')));
 assert.equal(core.filter(data.materials,{access:'local_pdf'}).length,6);
 assert.equal(core.filter(data.materials,{topic:'Natyashastra',search:'Bharata'}).length,2);
 assert.equal(core.filter(data.materials,{search:'CI nothing matches'}).length,0);
 assert.equal(JSON.stringify(data),before);
});
test('Action precedence preserves PDF, Archive borrowing/preview, rights-unverified record and edition links',()=>{
 for(const r of data.materials){const a=core.action(r);if(r.localPdf)assert.equal(a.url,r.localPdf);else if(r.internetArchive)assert.equal(a.url,r.internetArchive.url);else assert.equal(a.url,r.accessUrl);}
 const unverified=data.materials.find(r=>r.internetArchive?.accessType==='view_record_rights_unverified');assert.equal(core.action(unverified).label,'View record');assert.ok(!unverified.localPdf);
 assert.equal(core.action(data.materials.find(r=>r.id==='indian-cinema-vsi')).accessType,'preview_only');
 assert.match(data.materials[0].availabilityNote,/Volume 3 was not verified/);
});
test('Library shell is offline, separately navigable and has no progress/storage writes',()=>{
 const html=source('index.html'),sw=source('sw.js'),ui=source('study-material-ui.js');
 for(const f of ['library-core.js','library.css','study-material-data.js','study-material-ui.js']){assert.ok(html.includes(f+'?v=20260928-library'));assert.ok(sw.includes('./'+f+'?v=20260928-library'));}
 assert.match(html,/data-view="study"/);assert.match(html,/value="study">12 · Study Material/);assert.match(html,/data-view="resources"/);
 assert.ok(!/localStorage|store\.put|completedTopics|\.mark\(|fetch\(/.test(ui));assert.ok(html.indexOf('src="library-core.js')<html.indexOf('src="app.js'));
});
