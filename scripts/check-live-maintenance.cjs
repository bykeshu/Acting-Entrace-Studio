// Fresh, signed-out CI browser only. Never use a personal browser profile.
const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');
const SITE = 'https://bykeshu.github.io/Acting-Entrace-Studio/';
async function main() {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'CI only');
  const browser = await chromium.launch({channel:'chrome', headless:true});
  try {
    const errors = [], badAssets = [];
    const context = await browser.newContext({viewport:{width:1280,height:800}, serviceWorkers:'block'});
    const page = await context.newPage();
    page.on('pageerror', () => errors.push('Uncaught browser error'));
    page.on('response', r => {
      const url = new URL(r.url());
      if(url.origin === new URL(SITE).origin && r.status() >= 400
        && !/daily-log\.js|study-material-local\.js/.test(url.pathname))
        badAssets.push(url.pathname + ': ' + r.status());
    });
    page.on('requestfailed', r => {
      const url = new URL(r.url());
      if(url.origin === new URL(SITE).origin
        && !/daily-log\.js|study-material-local\.js/.test(url.pathname))
        badAssets.push(url.pathname + ': request failed');
    });
    const response = await page.goto(SITE, {waitUntil:'networkidle',timeout:60000});
    assert.equal(response.status(),200,'Live website returns 200');
    await page.locator('.nav-item').last().waitFor({state:'visible'});
    const rooms = await page.locator('.nav-item').evaluateAll(nodes => nodes.map(n=>n.dataset.view));
    assert.ok(rooms.length >= 12, 'All app rooms available');
    for(const width of [1280,360]){
      await page.setViewportSize({width,height:800});
      for(const room of rooms){
        if(width===360) await page.getByLabel('Choose a room',{exact:true}).selectOption(room);
        else await page.locator('.nav-item[data-view="'+room+'"]').click();
        await page.evaluate(()=>document.fonts.ready);
        assert.equal(await page.locator('#view-'+room).isVisible(),true,'Live room '+room);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
          room+' horizontal overflow at '+width+'px');
      }
    }
    for(const file of ['manifest.webmanifest','sw.js']){
      const r=await context.request.get(new URL(file,SITE).href);
      assert.equal(r.status(),200,'Live '+file);
      if(file==='manifest.webmanifest'){
        const manifest=await r.json(); assert.ok(manifest.start_url); assert.ok(manifest.icons.length);
        for(const icon of manifest.icons){
          const iconResponse=await context.request.get(new URL(icon.src,SITE).href);
          assert.equal(iconResponse.status(),200,'Manifest icon available');
        }
      }
    }
    assert.deepEqual(errors,[],'Live JavaScript errors');
    assert.deepEqual(badAssets,[],'Live first-party asset failures');
    await context.close();
    // Verify the deployed PWA can install its worker and reopen offline.
    const offlineContext=await browser.newContext({viewport:{width:360,height:800}});
    const offline=await offlineContext.newPage();
    await offline.goto(SITE,{waitUntil:'load',timeout:60000});
    await offline.waitForFunction(()=>navigator.serviceWorker.controller,{},{timeout:60000});
    await offlineContext.setOffline(true);
    await offline.reload({waitUntil:'load'});
    await offline.getByLabel('Choose a room',{exact:true}).selectOption('journal');
    assert.equal(await offline.locator('#journalForm').isVisible(),true,'Live PWA offline journal');
    await offlineContext.close();
    console.log('Live desktop/mobile rooms, assets, manifest/icons and offline PWA passed. Real Android device and private sync not tested.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode=1; });
