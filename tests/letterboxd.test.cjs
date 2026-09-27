const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const core=require('../letterboxd-core.js'),{parseFeed}=require('../scripts/letterboxd-feed.cjs');
const today='2026-09-27';
const item=(extra='')=>`<item><guid>letterboxd-watch-123</guid><link>https://letterboxd.com/saltinsea/film/synthetic-film/</link><letterboxd:filmTitle><![CDATA[Synthetic & cinema]]></letterboxd:filmTitle><letterboxd:filmYear>2000</letterboxd:filmYear><letterboxd:watchedDate>2026-09-26</letterboxd:watchedDate><letterboxd:rewatch>No</letterboxd:rewatch><letterboxd:memberRating>4.5</letterboxd:memberRating>${extra}</item>`;
const xml=items=>`<?xml version="1.0"?><rss version="2.0" xmlns:letterboxd="https://letterboxd.com"><channel><link>https://letterboxd.com/saltinsea/</link>${items}</channel></rss>`;
test('RSS metadata only; reviews discarded, duplicate watch/review events collapse',()=>{
 const a=parseFeed(xml(item('<description><![CDATA[PRIVATE REVIEW]]></description>')+item().replace('watch-123','review-124')),today);
 assert.equal(a.entries.length,1);assert.equal(a.entries[0].title,'Synthetic & cinema');assert.equal(a.entries[0].rating,4.5);assert.ok(!JSON.stringify(a).includes('PRIVATE REVIEW'));assert.equal(a.entries[0].id.length,64);
});
test('Atom self-link never replaces the channel identity',()=>{
 const withAtom=xml(item()).replace('</link><item>','</link><atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="https://letterboxd.com/saltinsea/rss/" rel="self"/><item>');
 assert.equal(parseFeed(withAtom,today).entries.length,1);
});
test('Feed/profile/DTD/size failures are closed and do not return raw XML errors',()=>{
 for(const x of [xml(item()).replace('/saltinsea/','/somebody/'),'<rss><bad></rss>',xml(item()).replace('<rss','<!DOCTYPE rss><rss'),'x'.repeat(2100000)])assert.throws(()=>parseFeed(x,today));
});
test('Missing dates, malformed values, wrong editions/hosts and future dates never get invented',()=>{
 for(const [a,b] of [['2026-09-26',''],['2026-09-26','2026-02-30'],['2026-09-26','2026-09-28'],['>4.5<','>3.2<'],['>2000<','>oops<'],['>No<','>perhaps<'],['/saltinsea/film/','/someone/film/']])assert.equal(parseFeed(xml(item().replace(a,b)),today).entries.length,0);
 assert.equal(parseFeed(xml(item().replace('>4.5<','><')),today).entries[0].rating,null);
});
test('Fresh cards are deterministic, observed and ungraded; existing notes/artwork untouched',()=>{
 const f=parseFeed(xml(item()),today).entries[0],p=core.plan(f,[],today);assert.equal(p.kind,'create');assert.equal(p.record.minutes,0);assert.equal(p.record.track,'Personal');assert.equal(p.record.note,'');assert.equal(p.record.letterboxdStatus,'observed');
 const existing={...p.record,id:'manual',rating:2,note:'PRIVATE EPIPHANY',posterURL:'https://example.org/poster.jpg'},before=JSON.stringify(existing);
 assert.equal(core.plan(f,[existing],today).kind,'existing');assert.equal(JSON.stringify(existing),before);assert.equal(core.plan(f,[{...existing,date:''}],today).kind,'existing');
 assert.equal(core.plan(f,[{...existing,year:'2001',letterboxdURI:''}],today).kind,'conflict');
 assert.equal(core.plan({...f,id:'broken'},[],today).kind,'invalid');
});
test('Separate-day rewatches remain separate; same-day diary entries never multiply',()=>{
 const f=parseFeed(xml(item()),today).entries[0],record=core.plan(f,[],today).record;
 assert.equal(core.plan(f,[{...record,id:'other',date:'2026-09-25'}],today).kind,'create');
 assert.equal(core.plan(f,[record],today).kind,'existing');
});
test('Daily job is distinct from Monday design; private inbox only, no public history outputs',()=>{
 const daily=fs.readFileSync('.github/workflows/daily-letterboxd.yml','utf8'),weekly=fs.readFileSync('.github/workflows/weekly-design.yml','utf8'),script=fs.readFileSync('scripts/import-letterboxd.cjs','utf8');
 assert.match(daily,/30 3 \* \* \*/);assert.match(weekly,/30 3 \* \* 1/);assert.match(daily,/vars.LETTERBOXD_IMPORT_ENABLED/);assert.ok(!/contents: write|upload-artifact|git push/.test(daily));assert.ok(!/writeFile|refreshToken|console\.log\(.*entry|console\.error\(error\)/.test(script));assert.ok(!script.includes('/events/'));
});
test('Runner check-only makes no Auth/write request; real path never writes owner events or logs labels',async()=>{
 const {run}=require('../scripts/import-letterboxd.cjs'),oldFetch=global.fetch,oldLog=console.log,calls=[],messages=[];
 const env={LETTERBOXD_IMPORT_EMAIL:'synthetic@example.invalid',LETTERBOXD_IMPORT_PASSWORD:'synthetic-not-a-real-credential',LETTERBOXD_OWNER_UID:'fixture-owner',LETTERBOXD_WRITER_UID:'fixture-writer'};
 try{
  console.log=m=>messages.push(m);
  global.fetch=async(url,options={})=>{
   calls.push({url,options});
   if(url.endsWith('/rss/'))return new Response(xml(item()),{status:200});
   if(url.includes('identitytoolkit'))return Response.json({idToken:'synthetic-token',localId:'fixture-writer'});
   return Response.json({writeResults:[]});
  };
  await run({...env,LETTERBOXD_CHECK_ONLY:'true'});assert.equal(calls.length,1);
  calls.length=0;await run(env);assert.equal(calls.length,4);
  const writes=calls.filter(c=>c.url.endsWith(':commit')).map(c=>JSON.parse(c.options.body).writes[0]);
  assert.match(writes[0].update.name,/users\/fixture-owner\/letterboxdImports\/[a-f0-9]{64}$/);
  assert.equal(writes[0].currentDocument.exists,false);assert.equal(writes[0].updateTransforms[0].setToServerValue,'REQUEST_TIME');
  assert.match(writes[1].update.name,/letterboxdStatus\/latest$/);assert.ok(!JSON.stringify(writes).includes('/events/'));
  assert.ok(!messages.join('\n').includes('Synthetic & cinema'));assert.ok(!messages.join('\n').includes('synthetic-token'));
  calls.length=0;global.fetch=async url=>{calls.push(url);return url.endsWith('/rss/')?new Response(xml(item())):Response.json({idToken:'synthetic-token',localId:'wrong-writer'});};
  await assert.rejects(run(env),/IMPORTER_UID_MISMATCH/);assert.equal(calls.length,2);
 }finally{global.fetch=oldFetch;console.log=oldLog;}
});
