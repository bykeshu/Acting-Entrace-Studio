const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {validateTokens,selectPreset,refresh}=require('../scripts/refresh-design.cjs');
const catalogue=require('../design/presets.json');
for(const preset of catalogue.presets)test(`Accessible saved-pin preset: ${preset.id}`,()=>assert.equal(validateTokens(preset.tokens),preset.tokens));
test('Rejects injected CSS, unsupported fonts, unknown fields and low contrast',()=>{
 const t=catalogue.presets[0].tokens;
 for(const change of [{paper:'url(https://evil.invalid)'},{display:'remote-font'},{extra:'field'},{ink:t.paper}])assert.throws(()=>validateTokens({...t,...change}));
});
test('Rotation exhausts each four-pin cycle and avoids immediate repetition',()=>{
 const h=[];
 for(let cycle=0;cycle<5;cycle++){
  const seen=new Set();
  for(let i=0;i<catalogue.presets.length;i++){
   const {preset}=selectPreset(catalogue.presets,h,()=>0);
   assert.notEqual(preset.id,h.at(-1)?.presetId);seen.add(preset.id);h.push({presetId:preset.id});
  }
  assert.equal(seen.size,catalogue.presets.length);
 }
});
test('Build changes only public outputs and preserves tracker, cache alignment and identity',()=>{
 const repo=fs.mkdtempSync(path.join(os.tmpdir(),'acting-design-test-'));
 try{
  fs.mkdirSync(path.join(repo,'design'));
  fs.writeFileSync(path.join(repo,'design/presets.json'),JSON.stringify(catalogue));
  fs.writeFileSync(path.join(repo,'design/history.json'),'[]');
  fs.writeFileSync(path.join(repo,'index.html'),'<link href="weekly-theme.css?v=setup"><script src="app.js"></script>');
  fs.writeFileSync(path.join(repo,'sw.js'),'const CACHE_NAME = "old";\nconst assets=["weekly-theme.css?v=setup"];');
  fs.writeFileSync(path.join(repo,'personal.json'),'PRIVATE TASKS');
  fs.writeFileSync(path.join(repo,'app.js'),'acting-entrance-studio-v1');
  fs.writeFileSync(path.join(repo,'manifest.webmanifest'),'UNCHANGED IDENTITY');
  const release=refresh({repo,date:new Date('2026-09-27T12:00:00Z'),random:()=>0});
  assert.equal(release.runner,'local');assert.equal(release.paidApiUsed,false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo,'design/history.json'))).length,1);
  for(const name of ['index.html','sw.js'])assert.match(fs.readFileSync(path.join(repo,name),'utf8'),new RegExp(release.revision));
  for(const [name,expected]of [['personal.json','PRIVATE TASKS'],['app.js','acting-entrance-studio-v1'],['manifest.webmanifest','UNCHANGED IDENTITY']])assert.equal(fs.readFileSync(path.join(repo,name),'utf8'),expected);
  const fresh=refresh({repo,design:{presetId:'red-pencil',mode:'fresh-ai',rationale:'Original annotated-frame variation.',tokens:catalogue.presets[1].tokens},runner:'chatgpt-cloud'});
  assert.equal(fresh.mode,'fresh-ai');assert.equal(fresh.runner,'chatgpt-cloud');
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo,'design/history.json'))).length,2);
  assert.throws(()=>refresh({repo,runner:'unverified'}));
 }finally{fs.rmSync(repo,{recursive:true,force:true});}
});
