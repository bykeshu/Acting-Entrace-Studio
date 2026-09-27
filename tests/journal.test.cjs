const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const j=require('../journal-core.js');
const valid={title:'Paris, Texas',year:'1984',date:'2026-09-27',rating:'3.5',genres:'Drama, Road film',note:'Private feeling',rewatch:'on',letterboxdURI:'https://letterboxd.com/film/paris-texas/'};
const options={id:'test-card',date:'2026-09-27'};
test('Rating is explicit, half-star or no-rating; film enjoyment never earns learning credit',()=>{
 for(const rating of ['',undefined,'0','6','3.2','invalid'])assert.throws(()=>j.entry({...valid,rating},options));
 const e=j.entry(valid,options);assert.equal(e.rating,3.5);assert.equal(e.mode,'Film diary');assert.equal(e.minutes,0);assert.equal(e.track,'Personal');assert.equal(e.rewatch,true);assert.deepEqual(e.genres,['Drama','Road film']);assert.equal(e.letterboxdStatus,'diary-pending');assert.equal(j.personal(e),true);
 assert.equal(j.entry({...valid,rating:'none'},options).rating,null);
 const w=j.entry({...valid,date:'',rating:''},{...options,watchlist:true});assert.equal(w.mode,'Film watchlist');assert.equal(w.rating,null);assert.equal(w.date,options.date);
});
test('Dates, titles, years, URI hosts and stored text are bounded and validated',()=>{
 for(const values of [{title:''},{date:'2026-02-30'},{date:'2026-09-28'},{year:'20ab'},{letterboxdURI:'javascript:alert(1)'},{letterboxdURI:'https://letterboxd.com.evil.invalid/film/title'},{letterboxdURI:'https://user:secret@letterboxd.com/film/title'}])assert.throws(()=>j.entry({...valid,...values},options));
 assert.equal(j.entry({...valid,note:'x'.repeat(5000)},options).note.length,3000);assert.equal(j.uri('https://boxd.it/29qU'),'https://boxd.it/29qU');
});
test('Letterboxd CSV uses supported columns and excludes private memories, tags and assessments',()=>{
 const e=j.entry(valid,options),csv=j.csv([e],true);assert.match(csv,/Title,Year,LetterboxdURI,Rating,WatchedDate,Rewatch/);assert.match(csv,/"Paris, Texas","1984"/);assert.match(csv,/"3.5","2026-09-27","true"/);assert.ok(!csv.includes('Private feeling'));assert.ok(!csv.includes('Road film'));assert.ok(!csv.includes('Review'));assert.ok(!csv.includes('Tags'));
 const un=j.csv([j.entry({...valid,rating:'none'},options)],true);assert.match(un,/"","2026-09-27"/);
 assert.ok(!j.csv([e]).includes('WatchedDate'));assert.match(j.csv([{title:'=FORMULA',year:'',letterboxdURI:''}]),/'=FORMULA/);assert.match(j.csv([{title:'He said "hello"'}]),/He said ""hello""/);
});
test('Unwatched watchlist deduplicates stable keys, updates with new saves, and excludes watched/diary records',()=>{
 const shelf=[{id:'a',title:'One'},{id:'b',title:'Two',courseId:'two'},{id:'c',title:'A new save'}],session={id:'watch',title:'Personal title',filmKey:'film:personal:',mode:'Film watchlist'};
 const list=j.watchlist(shelf,[session,{...session,id:'watch2'},{mode:'Film diary',filmKey:'bucket-watched:a'}],{'cinema-watched:two':true});assert.deepEqual(list.map(f=>f.title),['A new save','Personal title']);
 assert.deepEqual(j.exportable([{title:'Film'},{title:'Series',entryNote:'Not a full film'},{title:'Episode',entryNote:'Episode',letterboxdURI:'https://letterboxd.com/film/confirmed/'}]).map(f=>f.title),['Film','Episode']);
});
test('Poster URLs are optional, bounded, credential-free HTTPS and never executable markup',()=>{
 for(const posterURL of ['javascript:alert(1)','data:image/svg+xml,<svg/>','http://example.com/a.jpg','https://user:secret@example.com/p.jpg','https://localhost/p.jpg','https://127.0.0.1/p.jpg','https://192.168.1.5/p.jpg','https://example.com:8443/p.jpg','https://example.com/'+ 'x'.repeat(2048)])assert.throws(()=>j.entry({...valid,posterURL},options));
 const e=j.entry({...valid,posterURL:'https://example.com/poster.jpg',posterSourceURL:'https://example.com/film',posterCredit:'Artist',posterHidden:'on'},options);
 assert.equal(e.posterURL,'https://example.com/poster.jpg');assert.equal(e.posterCredit,'Artist');assert.equal(e.posterHidden,true);assert.equal(j.poster(e),null);assert.equal(e.minutes,0);
 assert.equal(j.poster({...e,posterHidden:false}).source,'https://example.com/film');
 const csv=j.csv([e],true);assert.ok(!csv.includes('poster.jpg'));assert.ok(!csv.includes('Artist'));
 assert.equal(j.poster({...valid,posterURL:'javascript:alert(1)'}),null);
});
test('Verified Sound of Metal artwork works for old cards without changing their records',()=>{
 const old={title:'Sound of Metal',year:'',rating:4},before=JSON.stringify(old),art=j.poster(old);
 assert.match(art.source,/criterion.com\/films\/32169-sound-of-metal/);assert.match(art.credit,/William Laboury/);assert.equal(JSON.stringify(old),before);
 assert.ok(j.poster({...old,year:'2019'}));assert.ok(j.poster({...old,year:'2020'}));assert.equal(j.poster({...old,year:'1950'}),null);assert.equal(j.poster({title:'Happy Together'}),null);assert.equal(j.poster({...old,posterHidden:true}),null);
});
test('Poster palettes come from pixels and maintain readable text/accent over the contrast scrim',()=>{
 const pixels=[];for(const [colour,count] of [[[5,5,5],200],[[180,180,180],180],[[210,10,12],100]])for(let i=0;i<count;i++)pixels.push(...colour,255);
 const p=j.paletteFromPixels(pixels);assert.ok(j.palette(p));assert.ok(parseInt(p.accent.slice(1,3),16)>parseInt(p.accent.slice(3,5),16));assert.ok(j.posterContrast(p.ink,p.text)>=4.5);assert.ok(j.posterContrast(p.ink,p.accent)>=3);
 assert.ok(j.palette(j.paletteFromPixels([255,255,255,255,255,255,255,255])));assert.ok(j.palette(j.poster({title:'Sound of Metal'}).palette));
 for(const p of [{ink:'#000000',text:'#111111',accent:'#222222'},{ink:'url(evil)',text:'#ffffff',accent:'#ff0000'}])assert.equal(j.palette(p),null);
 assert.throws(()=>j.entry({...valid,posterPalette:{ink:'#000000',text:'#111111',accent:'#222222'}},options));
});
test('User-selected JPEG stays private, fits the existing sync payload, and is excluded from Letterboxd exports',()=>{
 const data='data:image/jpeg;base64,/9j/AAAA',p=j.paletteFromPixels([]),e=j.entry({...valid,posterData:data,posterPalette:p},options);
 assert.equal(j.poster(e).url,data);assert.equal(j.poster(e).uploaded,true);assert.deepEqual(j.poster(e).palette,p);assert.ok(new TextEncoder().encode(JSON.stringify(e)).length<48000);assert.ok(!j.csv([e],true).includes('/9j/AAAA'));
 for(const posterData of ['data:image/svg+xml;base64,AAAA','data:image/png;base64,AAAA','data:image/jpeg;base64,<script>','data:image/jpeg;base64,'+'A'.repeat(30000)])assert.throws(()=>j.entry({...valid,posterData},options));
 assert.throws(()=>j.entry({...valid,posterData:'data:image/jpeg;base64,'+'A'.repeat(29000),letterboxdURI:'https://letterboxd.com/film/'+'x'.repeat(20000)},options));
});
test('No Letterboxd secret, undocumented API or fictitious automatic sync; offline assets match',()=>{
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),ui=fs.readFileSync(path.join(root,'journal-ui.js'),'utf8');assert.match(html,/not an automatic connection/);assert.match(ui,/not remotely verified/);assert.ok(!ui.includes('api.letterboxd.com'));assert.ok(!ui.includes('client_secret'));assert.match(ui,/www.wikidata.org\/w\/api.php/);
 for(const name of ['journal-core.js','journal-ui.js','deck.css'])assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes(name));
 assert.ok(html.indexOf('src="journal-core.js')<html.indexOf('src="app.js'));assert.ok(html.indexOf('src="app.js')<html.indexOf('src="journal-ui.js'));
});
