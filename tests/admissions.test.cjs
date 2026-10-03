const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const data=require('../admissions-data.js');
const root=path.resolve(__dirname,'..');
test('Admissions facts have dated, cycle-specific source coverage and budget boundaries',()=>{
 const ids=new Set(data.sources.map(s=>s.sourceId));
 assert.equal(ids.size,data.sources.length);
 for(const s of data.sources){assert.equal(s.sourceType,'official');assert.equal(s.verifiedOn,data.verifiedOn);assert.ok(s.examCycle);assert.equal(new URL(s.url).protocol,'https:');}
 for(const f of data.facts){assert.ok(f.ftii&&f.nsd);for(const id of [...f.ftiiSources,...f.nsdSources])assert.ok(ids.has(id));}
 for(const d of data.documents){assert.ok(d.stage&&d.requirement&&d.appliesTo);for(const id of d.sourceIds)assert.ok(ids.has(id));}
 assert.equal(new Set(data.documents.map(d=>d.id)).size,data.documents.length);
 assert.match(data.facts.find(f=>f.label==='Budget boundary').ftii,/3,08,450/);
 assert.equal(109574+3*66292,308450);
 assert.match(data.facts.find(f=>f.label==='Next application cycle').ftii,/not verified/);
 assert.match(data.facts.find(f=>f.label==='Submission deadline').nsd,/17 April 2026/);
 assert.equal(data.documents.find(d=>d.id==='recommendation').requirement,'not confirmed for 2026');
});
test('Admissions assets share cache versions and one checklist location; downloadable catalogue matches',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 for(const name of ['admissions-data.js','admissions-ui.js','admissions.css']){assert.ok(html.includes(name+'?v=20261004'));assert.ok(sw.includes('./'+name+'?v=20261004'));}
 assert.equal((html.match(/id="evidenceChecklist"/g)||[]).length,1);
 assert.ok(html.indexOf('id="view-admissions"')<html.indexOf('id="evidenceChecklist"'));
 assert.ok(html.indexOf('src="admissions-data.js')<html.indexOf('src="app.js'));
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'admissions-spec.json'),'utf8')),data);
 const md=fs.readFileSync(path.join(root,'ADMISSIONS_CHEAT_SHEET.md'),'utf8');
 assert.ok(md.includes('2026 application windows have passed'));
 assert.ok(!/watched history|dailyReviews|productions":/.test(md));
});
