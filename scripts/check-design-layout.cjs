// CI-only browser test of synthetic progress. Never attach to a user's browser.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const {contrast}=require('./refresh-design.cjs');
const root=path.resolve(__dirname,'..');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 if(process.env.GITHUB_ACTIONS!=='true')throw Error('Use the normal browser preview locally; this test is CI-only');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'acting-ci-chrome-'));
 const output=path.join(root,'_design-checks');fs.mkdirSync(output,{recursive:true});
 const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.webmanifest':'application/manifest+json'};
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))||/daily-log|backup/i.test(pathname)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank']);
 let stderr='',spawnError,ws,id=0;const pending=new Map(),errors=[];
 chrome.stderr.on('data',d=>stderr+=d);chrome.on('error',e=>spawnError=e);
 const call=(method,params={})=>new Promise((resolve,reject)=>{
  const requestId=++id;
  const timeout=setTimeout(()=>{pending.delete(requestId);reject(Error(`Browser timeout: ${method}`));},15000);
  pending.set(requestId,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});
  ws.send(JSON.stringify({id:requestId,method,params}));
 });
 const evaluate=async expression=>{
  const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;
 };
 try{
  let endpoint;
  for(let n=0;n<100;n++){
   if(spawnError)throw spawnError;
   endpoint=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];if(endpoint)break;await wait(100);
  }
  if(!endpoint)throw Error('Installed CI Chrome did not start');
  const pages=await (await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
  const page=pages.find(p=>p.type==='page');assert.ok(page,'CI page target');
  ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  ws.addEventListener('message',event=>{
   const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
   if(!message.id)return;const p=pending.get(message.id);if(!p)return;pending.delete(message.id);message.error?p.reject(Error(message.error.message)):p.resolve(message.result);
  });
  await call('Page.enable');await call('Runtime.enable');
  await call('Page.navigate',{url:origin});
  for(let n=0;n<100;n++){if(await evaluate('document.querySelectorAll(".nav-item").length===10 && !!document.querySelector("#bucketFilms")?.children.length'))break;await wait(100);}
  await evaluate('document.fonts.ready.then(()=>true)');
  const rooms=['today','daily','roadmap','syllabus','practice','tests','resources','evidence','cinema','bucket'];const checks=[];
  for(const width of [1280,360]){
   await call('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:false});
   for(const room of rooms){
    await evaluate(width===360?`(()=>{const s=document.querySelector('#mobileView');s.value=${JSON.stringify(room)};s.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`:`(()=>{document.querySelector('.nav-item[data-view="${room}"]').click();return true;})()`);
    await evaluate('document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true)))))');
    const metrics=await evaluate(`(()=>{
     const v=document.querySelector('#view-${room}'), visible=e=>!!e && getComputedStyle(e).display!=='none';
     const dark=[...document.querySelectorAll('.cinema-intro,.daily-summary .dark')].filter(e=>e.getClientRects().length).map(e=>({background:getComputedStyle(e).backgroundColor,colour:getComputedStyle(e.querySelector('h2')).color}));
     return {room:document.body.dataset.room,width:innerWidth,documentWidth:document.documentElement.scrollWidth,visible:visible(v),heading:document.querySelector('#viewTitle').textContent,dark};})()`);
    assert.equal(metrics.room,room);assert.equal(metrics.visible,true);assert.ok(metrics.documentWidth<=width,`${room} overflows at ${width}px`);
    for(const pair of metrics.dark){const hex=c=>'#'+c.match(/\d+/g).slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join('');assert.ok(contrast(hex(pair.colour),hex(pair.background))>=4.5,`${room} dark header contrast`);}
    checks.push(metrics);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,`${width}-${room}.png`),Buffer.from(shot.data,'base64'));
   }
  }
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.ok(await evaluate('document.activeElement!==document.body'),'Keyboard reaches a control');
  assert.deepEqual(errors,[],'No uncaught app errors');
  const report={runner:'github-actions',release:JSON.parse(fs.readFileSync(path.join(root,'design/active.json'),'utf8')).revision,checks,keyboard:true,uncaughtErrors:errors};
  fs.writeFileSync(path.join(output,'metrics.json'),JSON.stringify(report,null,2));
  console.log(`Passed ${checks.length} room/viewport checks, dark-header contrast and keyboard smoke test. Screenshots: ${output}`);
 }finally{
  ws?.close();chrome.kill();await new Promise(r=>server.close(r));
  await wait(300);fs.rmSync(profile,{recursive:true,force:true});
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
