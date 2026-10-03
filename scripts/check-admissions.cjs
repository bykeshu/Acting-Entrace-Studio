// Isolated local preview with synthetic state; never attach to a user's profile.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const output=path.resolve(root,'..','data','admissions-preview');
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.md':'text/markdown'};
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(file===root)file=path.join(root,'index.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'});
  await context.addInitScript(()=>{if(!localStorage.getItem('acting-entrance-studio-v1'))localStorage.setItem('acting-entrance-studio-v1',JSON.stringify({evidence:{graduation:true,'six-productions':true},productions:[{id:'synthetic-production',title:'Synthetic preview play',role:'Actor',proof:'Certificate'}]}));});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load'});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload({waitUntil:'load'});
  await page.locator('[data-view="admissions"]').click();
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#admissionsComparison tbody tr').count(),24);
  assert.equal(await page.locator('#evidenceChecklist input').count(),22);
  assert.equal(await page.locator('[data-evidence="graduation"]').isChecked(),true);
  await page.locator('[data-evidence="admission-photo"]').check();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('acting-entrance-studio-v1')).evidence['admission-photo']),true);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:path.join(output,'desktop.png')});
  await page.locator('.admission-table').first().scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,'desktop-comparison.png')});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('[data-view="resources"]').click();
  assert.equal(await page.locator('#resourceList').getByText('FTII ET 2025-26 prospectus',{exact:true}).count(),0);
  await page.locator('[data-view="evidence"]').click();
  assert.ok((await page.locator('#productionList').textContent()).includes('Synthetic preview play'));
  await page.setViewportSize({width:360,height:800});
  await page.getByLabel('Choose a room',{exact:true}).selectOption('admissions');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(output,'mobile.png')});
  await page.locator('.admission-table').first().scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,'mobile-comparison.png')});
  const download=page.waitForEvent('download');
  await page.getByText('Download cheat sheet',{exact:true}).click();
  assert.equal((await download).suggestedFilename(),'ADMISSIONS_CHEAT_SHEET.md');
  await page.evaluate(async()=>{const cache=await caches.open((await caches.keys()).find(k=>k.startsWith('acting-entrance-studio-shell-')));for(const url of ['admissions-data.js?v=20261004','admissions-ui.js?v=20261004','admissions.css?v=20261004','ADMISSIONS_CHEAT_SHEET.md'])if(!await cache.match(url))throw Error('Missing cached '+url);});
  await context.setOffline(true);
  await page.reload({waitUntil:'load'});
  await page.getByLabel('Choose a room',{exact:true}).selectOption('admissions');
  assert.equal(await page.locator('#admissionsComparison tbody tr').count(),24);
  assert.equal(await page.locator('[data-evidence="admission-photo"]').isChecked(),true);
  assert.deepEqual(errors,[]);
  console.log('Desktop/mobile preview, private readiness preservation, resource relocation, download and offline reload passed.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
