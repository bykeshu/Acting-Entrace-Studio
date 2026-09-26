// CI-only test of synthetic progress. Never attach to a user's browser.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {contrast}=require('./refresh-design.cjs');
const root=path.resolve(__dirname,'..');
async function main(){
 if(process.env.GITHUB_ACTIONS!=='true')throw Error('Use the normal browser preview locally; this test is CI-only');
 const {chromium}=require('playwright-core');
 const output=path.join(root,'_design-checks');fs.mkdirSync(output,{recursive:true});
 const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.webmanifest':'application/manifest+json'};
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))||/daily-log|backup/i.test(pathname)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load'});
  await page.locator('.nav-item').last().waitFor({state:'visible'});
  await page.evaluate(()=>document.fonts.ready);
  const rooms=['today','daily','roadmap','syllabus','practice','tests','resources','evidence','cinema','bucket'],checks=[];
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
    checks.push(metrics);console.log(`Layout pass: ${width}px / ${room}`);
    await page.screenshot({path:path.join(output,`${width}-${room}.png`),animations:'disabled',timeout:30000});
   }
  }
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement!==document.body),'Keyboard reaches a control');
  assert.deepEqual(errors,[],'No uncaught app errors');
  const report={runner:'github-actions',release:JSON.parse(fs.readFileSync(path.join(root,'design/active.json'),'utf8')).revision,checks,keyboard:true,uncaughtErrors:errors};
  fs.writeFileSync(path.join(output,'metrics.json'),JSON.stringify(report,null,2));
  console.log(`Passed ${checks.length} room/viewport checks, dark-header contrast and keyboard smoke test.`);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
