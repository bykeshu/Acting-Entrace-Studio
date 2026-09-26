// Design-only, dependency-free builder. No network, API key or personal state access.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const colours = ['stage','accent','paper','panel','ink','line','mark','soft'];
const fonts = {archivo:'"Archivo Black",Arial,sans-serif',anton:'"Anton",Impact,sans-serif',serif:'"Cormorant Garamond",Georgia,serif'};
const layouts = ['collage','editorial','ribbon','specimen'];
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function validateTokens(t) {
  if(!t || Object.keys(t).sort().join()!==[...colours,'display','layout'].sort().join())throw Error('Unexpected design fields');
  for(const key of colours)if(!/^#[0-9a-f]{6}$/i.test(t[key]))throw Error(`Invalid colour: ${key}`);
  if(!fonts[t.display]||!layouts.includes(t.layout))throw Error('Use only existing licensed fonts and reviewed layouts');
  for(const [a,b] of [['accent','stage'],['ink','paper'],['ink','panel'],['ink','soft'],['mark','panel'],['mark','paper']]){
    if(contrast(t[a],t[b])<4.5)throw Error(`Insufficient text contrast: ${a}/${b}`);
  }
  return t;
}
function selectPreset(presets,history,random=crypto.randomInt) {
  if(!presets.length)throw Error('No verified saved-pin presets');
  const previous=history.at(-1)?.presetId;
  const valid=history.filter(h=>presets.some(p=>p.id===h.presetId));
  const count=valid.length%presets.length;
  const used=new Set(count?valid.slice(-count).map(h=>h.presetId):[]);
  let pool=presets.filter(p=>!used.has(p.id));
  if(!count || !pool.length)pool=presets.filter(p=>!used.has(p.id)&&p.id!==previous);
  if(!pool.length)pool=presets;
  return {preset:pool[random(pool.length)],poolSize:pool.length};
}
function renderCss(t) {
  validateTokens(t);
  let css=`/* Original weekly cinema skin. No external assets; see design/active.json. */
:root{--stage:${t.stage};--acid:${t.accent};--paper:${t.paper};--panel:${t.panel};--ink:${t.ink};--line:${t.line};--room-accent:${t.soft};--display:${fonts[t.display]};--weekly-mark:${t.mark};--weekly-soft:${t.soft};--muted:${t.ink}}
body{background:var(--paper)}.sidebar,.poster-focus,.cinema-intro,.daily-summary .dark,.update-notice{background:var(--stage)}
.sidebar,.brand small,.nav-item,.nav-item span,.sidebar-foot small,.poster-focus>.eyebrow,.poster-focus>p#focusCopy,.poster-focus .progress-wrap,.scene-caption,.cinema-intro,.cinema-intro p,.cinema-intro .eyebrow,.daily-summary .dark p,.daily-summary .dark .eyebrow{color:var(--acid)}
.brand-mark,.nav-item.active,.nav-item:hover,.poster-focus .primary,.update-notice .primary{background:var(--acid);color:var(--stage);border-color:var(--acid)}
.nav-item.active span,.nav-item:hover span{color:var(--stage)}.sidebar-foot .quiet,.mobile-room select,.poster-focus .quiet,.cinema-intro .quiet{background:var(--stage);color:var(--acid);border-color:var(--acid)}
.poster-focus>h2,.poster-focus>p.hero-script,.cinema-intro h2,.cinema-intro a,.daily-summary .dark h2{color:var(--acid)}
.poster-focus::after{background:linear-gradient(90deg,var(--stage) 0%,var(--stage) 32%,transparent 85%)}
.primary{background:var(--stage);color:var(--acid);border-color:var(--stage)}.primary:hover{background:var(--acid);color:var(--stage);border-color:var(--stage)}
.poster-focus .primary:hover{background:var(--paper);color:var(--ink)}.quiet:hover{background:var(--weekly-soft);color:var(--ink)}
.hero-star,.cover-art{background:var(--weekly-mark)}.text-btn,.resource a,.cinema-source,.cinema-directory a{color:var(--weekly-mark)}
.panel,.module,.phase,.resource,.production,.evidence-card,.stat-card:nth-child(n),.cinema-film{background:var(--panel);border-color:var(--line)}
.accent-panel,.intro-panel,.phase.current,.session-mini,.tag{background:var(--weekly-soft);color:var(--ink)}
.panel p,.panel .eyebrow,.filter-row label,.form-panel label,.inline-form label,dialog label,.cinema-film summary,.cinema-directory>summary,.studio-footer,.studio-programme button,.studio-programme span{color:var(--ink)}
.panel.cinema-intro,.panel.poster-focus,.daily-summary .panel.dark{background:var(--stage);color:var(--acid)}.daily-summary .dark>p:not(.eyebrow){color:var(--acid)}
.cinema-intro p,.cinema-intro .eyebrow,.cinema-intro .cinema-mapping p,.cinema-intro .cinema-access{color:var(--acid)!important}.cinema-intro .cinema-access,.cinema-intro .cinema-route span{background:var(--stage);border-color:var(--acid);color:var(--acid)}
.cinema-film:nth-child(n),.bucket-film[data-collection]{--cover:var(--weekly-soft)}.film-cover,.bucket-film .film-cover{border-color:var(--ink);box-shadow:4px 4px 0 var(--line)}
.cinema-film .film-cover h3,.bucket-film:nth-child(n) .film-cover h3{color:var(--ink);font-family:var(--display);text-shadow:none}.cover-caption{color:var(--ink)}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--weekly-mark);outline-offset:4px}.sidebar button:focus-visible,.poster-focus button:focus-visible,.cinema-intro a:focus-visible,.cinema-intro button:focus-visible{outline-color:var(--acid)}
.design-edition{font:500 11px/1.6 var(--body);max-width:100%;overflow-wrap:anywhere}.design-edition a{color:var(--weekly-mark)}
@media(max-width:760px){.sidebar{background:var(--stage)}.mobile-room{color:var(--acid)}.cinema-film .film-cover h3{font-size:35px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;
  const treatments={
    collage:'.poster-focus{border-bottom:8px solid var(--acid)}.hero-star{width:68px;height:68px;transform:rotate(-10deg)}.film-cover{border-width:2px}.cover-caption{background:var(--panel);padding:5px 9px}.panel h2{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:6px}',
    editorial:'.topbar h1{font-family:var(--display)}.poster-focus{border:3px solid var(--acid)}.poster-focus>h2{text-decoration:underline;text-decoration-color:var(--weekly-mark);text-decoration-thickness:5px;text-underline-offset:8px}.cinema-film .film-cover h3{letter-spacing:-.04em}.hero-star{transform:rotate(18deg)}',
    ribbon:'.poster-focus{border-bottom:12px solid var(--weekly-mark)}.poster-focus>h2{font-family:var(--display);letter-spacing:.005em}.film-cover{border-bottom:8px solid var(--weekly-mark)}.panel h2{letter-spacing:.015em}.hero-star{transform:rotate(30deg)}',
    specimen:'.poster-focus{border-top:1px solid var(--acid);border-bottom:1px solid var(--acid)}.poster-focus>h2{font-family:var(--display);font-size:clamp(58px,7.2vw,112px);letter-spacing:-.07em}.cinema-film .film-cover h3{font-family:var(--display);letter-spacing:-.07em}.panel h2{border-bottom:1px solid var(--line);padding-bottom:12px}.hero-star{border-radius:50%;clip-path:none}'
  };
  return css+treatments[t.layout]+'\n@media(max-width:460px){.hero-star{width:25px;height:25px}.poster-focus>h2{font-size:clamp(52px,16vw,74px)}.cinema-film .film-cover h3{font-size:33px}}\n';
}
function refresh({repo=root,date=new Date(),random,design=null,runner='local'}={}) {
  if(!['local','github-actions','chatgpt-cloud'].includes(runner))throw Error('Unknown runner');
  const read=name=>JSON.parse(fs.readFileSync(path.join(repo,name),'utf8'));
  const catalogue=read('design/presets.json'),history=read('design/history.json');
  const selected=selectPreset(catalogue.presets,history,random);
  const preset=design?catalogue.presets.find(p=>p.id===design.presetId):selected.preset;
  if(!preset)throw Error('Design must reference an observed saved-pin preset');
  if(design && (typeof design.rationale!=='string'||design.rationale.length>1000||!['rotation','fresh-ai'].includes(design.mode)))throw Error('Invalid design provenance');
  const tokens=validateTokens(design?.tokens||preset.tokens),css=renderCss(tokens);
  const at=date.toISOString(),revision=`weekly-${at.replace(/\D/g,'').slice(0,14)}-${crypto.createHash('sha256').update(css).digest('hex').slice(0,8)}`;
  const release={revision,createdAt:at,runner,presetId:preset.id,name:preset.name,pinUrl:preset.pinUrl,boardUrl:catalogue.boardUrl,sourceObservedOn:catalogue.observedOn,eligiblePoolSize:design?1:selected.poolSize,mode:design?.mode||'rotation',rationale:design?.rationale||preset.observation,tokens,paidApiUsed:false};
  let html=fs.readFileSync(path.join(repo,'index.html'),'utf8');
  let sw=fs.readFileSync(path.join(repo,'sw.js'),'utf8');
  const url=`weekly-theme.css?v=${revision}`;
  if(!html.includes('weekly-theme.css?v='))throw Error('Weekly stylesheet link is missing');
  html=html.replace(/weekly-theme\.css\?v=[^"\s]+/g,url);
  sw=sw.replace(/weekly-theme\.css\?v=[^"\s]+/g,url).replace(/const CACHE_NAME = "[^"]+";/,`const CACHE_NAME = "acting-entrance-studio-shell-${revision}";`);
  // Exactly five public design outputs. Never enumerate or read user records.
  fs.writeFileSync(path.join(repo,'weekly-theme.css'),css);
  fs.writeFileSync(path.join(repo,'design/active.json'),JSON.stringify(release,null,2)+'\n');
  fs.writeFileSync(path.join(repo,'design/history.json'),JSON.stringify([...history,release],null,2)+'\n');
  fs.writeFileSync(path.join(repo,'index.html'),html);
  fs.writeFileSync(path.join(repo,'sw.js'),sw);
  return release;
}
if(require.main===module){
  const args=process.argv.slice(2),designIndex=args.indexOf('--design'),runnerIndex=args.indexOf('--runner');
  const design=designIndex<0?null:JSON.parse(fs.readFileSync(args[designIndex+1],'utf8'));
  console.log(JSON.stringify(refresh({design,runner:runnerIndex<0?(process.env.GITHUB_ACTIONS?'github-actions':'local'):args[runnerIndex+1]}),null,2));
}
module.exports={contrast,validateTokens,selectPreset,renderCss,refresh};
