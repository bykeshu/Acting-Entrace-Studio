// CI-only test of synthetic progress. Never attach to a user's browser.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {contrast,renderCss}=require('./refresh-design.cjs');
const {audit}=require('./audit-functions.cjs');
const root=path.resolve(__dirname,'..');
async function main(){
 if(process.env.GITHUB_ACTIONS!=='true')throw Error('Use the normal browser preview locally; this test is CI-only');
 const {chromium}=require('playwright-core');
 const output=path.join(root,'_design-checks');fs.mkdirSync(output,{recursive:true});
 const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.pdf':'application/pdf','.webmanifest':'application/manifest+json'};
 let candidateCss=null;
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(pathname==='/weekly-theme.css'&&candidateCss){res.writeHead(200,{'Content-Type':'text/css'});res.end(candidateCss);return;}
  if(!file.startsWith(root+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))||/daily-log|backup/i.test(pathname)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load'});
  await page.locator('.nav-item').last().waitFor({state:'visible'});
  await page.evaluate(()=>document.fonts.ready);
  const rooms=['today','daily','roadmap','syllabus','practice','tests','resources','evidence','cinema','bucket','journal','study','music'],checks=[];
  const candidates=[{id:'release',css:null},...require('../design/presets.json').presets.map(p=>({id:p.id,css:renderCss(p.tokens)}))];
  for(const candidate of candidates){
  candidateCss=candidate.css;
  if(candidate.id!=='release')await page.reload();
  for(const width of [1280,360]){
   await page.setViewportSize({width,height:800});
   for(const room of rooms){
    if(width===360)await page.getByLabel('Choose a room',{exact:true}).selectOption(room);
    else await page.locator(`.nav-item[data-view="${room}"]`).click();
    await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(room=>{
     const v=document.querySelector('#view-'+room);
     const dark=[...document.querySelectorAll('.cinema-intro,.daily-summary .dark')].filter(e=>e.getClientRects().length).map(e=>({background:getComputedStyle(e).backgroundColor,colour:getComputedStyle(e.querySelector('h2')).color}));
     return {room:document.body.dataset.room,width:innerWidth,documentWidth:document.documentElement.scrollWidth,visible:!!v&&getComputedStyle(v).display!=='none',heading:document.querySelector('#viewTitle').textContent,dark};
    },room);
    assert.equal(metrics.room,room);assert.equal(metrics.visible,true);assert.ok(metrics.documentWidth<=width,`${room} overflows at ${width}px`);
    for(const pair of metrics.dark){const hex=c=>'#'+c.match(/\d+/g).slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join('');assert.ok(contrast(hex(pair.colour),hex(pair.background))>=4.5,`${room} dark header contrast`);}
    metrics.composition=candidate.id;checks.push(metrics);console.log(`Layout pass: ${candidate.id} / ${width}px / ${room}`);
    if(candidate.id==='release'||['today','journal'].includes(room))await page.screenshot({path:path.join(output,`${candidate.id}-${width}-${room}.png`),animations:'disabled',timeout:30000});
   }
  }
  }
  candidateCss=null;await page.setViewportSize({width:1280,height:800});await page.reload();
  const functions=await audit(page);
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement!==document.body),'Keyboard reaches a control');
  assert.deepEqual(errors,[],'No uncaught app errors');
  // Separate fresh context actually installs the service worker and reloads offline.
  const offlineContext=await browser.newContext({viewport:{width:360,height:800}}),offline=await offlineContext.newPage();
  await offline.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load'});await offline.evaluate(()=>navigator.serviceWorker.ready);await offline.waitForFunction(()=>navigator.serviceWorker.controller);
  const pdfPaths=await offline.evaluate(()=>window.ACTING_STUDY.materials.filter(r=>r.localPdf).map(r=>r.localPdf));
  for(const url of pdfPaths)assert.equal(await offline.evaluate(async url=>{const r=await fetch(url);return r.ok&&(await r.arrayBuffer()).byteLength>1000;},url),true,'Online PDF caches in full');
  await offlineContext.setOffline(true);
  for(const url of pdfPaths)assert.equal(await offline.evaluate(async url=>{const r=await fetch(url,{headers:{Range:'bytes=0-1023'}});return r.ok&&new TextDecoder().decode((await r.arrayBuffer()).slice(0,5))==='%PDF-';},url),true,'Offline PDF range request uses complete cached file');
  await offline.reload({waitUntil:'load'});await offline.getByLabel('Choose a room',{exact:true}).selectOption('study');assert.equal(await offline.locator('.study-book').count(),34,'Study catalogue available offline');
  await offlineContext.setOffline(true);await offline.reload({waitUntil:'load'});await offline.getByLabel('Choose a room',{exact:true}).selectOption('journal');assert.ok(await offline.locator('#journalForm').isVisible(),'Offline film log available');await offline.locator('#journalForm input[name="title"]').fill('CI offline viewing');await offline.locator('#journalForm select[name="rating"]').selectOption('none');await offline.locator('#journalForm button[type="submit"]').click();assert.equal(await offline.locator('.diary-card').count(),1,'Offline diary save');await offlineContext.close();
  const report={runner:'github-actions',release:JSON.parse(fs.readFileSync(path.join(root,'design/active.json'),'utf8')).revision,checks,functions,offline:true,keyboard:true,uncaughtErrors:errors};
  fs.writeFileSync(path.join(output,'metrics.json'),JSON.stringify(report,null,2));
  console.log(`Passed ${checks.length} room/viewport checks, ${functions.length} functional flows, offline diary, dark-header contrast and keyboard smoke test.`);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
