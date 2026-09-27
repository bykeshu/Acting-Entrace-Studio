/* Personal cinema, never an exam score. Pure helpers also exercised by Node tests. */
((root) => {
  const personal = s => ['Film memory','Film diary','Film watchlist','Film artwork'].includes(s.mode);
  const clean = (s,n=200) => String(s ?? '').trim().slice(0,n);
  const identity = f => f.filmKey || (f.courseId ? `cinema-watched:${f.courseId}` : f.id ? `bucket-watched:${f.id}` : `film:${clean(f.title).normalize('NFKC').toLowerCase()}:${f.year||''}`);
  const sameFilm = (a,b) => (a.filmKey&&a.filmKey===b.filmKey) || (uri(a.letterboxdURI)&&uri(a.letterboxdURI)===uri(b.letterboxdURI)) || (clean(a.title).normalize('NFKC').toLowerCase()===clean(b.title).normalize('NFKC').toLowerCase()&&(!a.year||!b.year||String(a.year)===String(b.year)));
  const pending = s => s.mode==='Film diary' && !['confirmed','observed'].includes(s.letterboxdStatus) && !!s.date;
  const uri = value => {
    try { const u=new URL(value); return u.protocol==='https:' && ['letterboxd.com','www.letterboxd.com','boxd.it'].includes(u.hostname) && !u.username && !u.password && u.pathname!=='/' ? u.href : ''; } catch { return ''; }
  };
  // External references or a user-selected compact JPEG in private progress; no public uploads.
  const imageURL = value => {
    if(!value || String(value).length>2048)return '';
    try {
      const u=new URL(String(value).trim()),host=u.hostname.toLowerCase();
      if(u.protocol!=='https:'||u.username||u.password||u.port||!host.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)||/\.(localhost|local|internal)$/.test(host)||host.includes(':'))return '';
      return u.href;
    }catch{return '';}
  };
  const posterData=value=>typeof value==='string'&&value.length<=30000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)?value:'';
  const fullPosterData=value=>typeof value==='string'&&value.length<=288000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)?value:'';
  const assetId=value=>/^poster:[0-9a-f-]{36}$/.test(value||'')?value:'';
  function artworkChunks(data,{id,date}){
    if(!fullPosterData(data)||!assetId(id))throw Error('Invalid private poster artwork.');
    const count=Math.ceil(data.length/24000);
    return Array.from({length:count},(_,index)=>({id:`${id}:${index}`,mode:'Film artwork',track:'Personal',minutes:0,rating:null,date,title:'Private poster artwork',posterAssetId:id,posterPart:index,posterParts:count,posterChunk:data.slice(index*24000,(index+1)*24000)}));
  }
  function resolveArtwork(id,records=[]){
    if(!assetId(id))return '';
    const parts=records.filter(r=>r.mode==='Film artwork'&&r.posterAssetId===id).sort((a,b)=>a.posterPart-b.posterPart),count=parts[0]?.posterParts;
    if(!Number.isInteger(count)||count<1||count>12||parts.length!==count||parts.some((r,i)=>r.posterPart!==i||r.posterParts!==count||typeof r.posterChunk!=='string'||r.posterChunk.length>24000))return '';
    return fullPosterData(parts.map(r=>r.posterChunk).join(''));
  }
  function variants(value){
    if(typeof value==='string'){try{value=JSON.parse(value||'[]');}catch{throw Error('Alternate posters must be a JSON list.');}}
    if(value==null)return [];
    if(!Array.isArray(value)||value.length>30)throw Error('Keep up to 30 alternate posters per film.');
    const seen=new Set();
    return value.map(v=>{
      const url=imageURL(v?.url),source=imageURL(v?.source),p=palette(v?.palette);
      if(!url||!source||!p)throw Error('Each alternate needs HTTPS image/source links and readable palette colours.');
      return {url,source,credit:clean(v.credit,200)||'Poster artwork · rights belong to its owner',palette:p};
    }).filter(v=>{if(seen.has(v.url))return false;seen.add(v.url);return true;});
  }
  // A private shuffle bag, not an internet search. Restart when the image pool changes.
  function nextPoster(f,random=Math.random){
    const choices=variants(f.posterVariants),count=choices.length+1;
    if(count<2)return {posterVariantIndex:0,posterShuffleRemaining:[],posterShuffleKey:''};
    const key=[f.posterAssetId||f.posterURL||'original',...choices.map(v=>v.url)].join('|').split('').reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261).toString(16);
    const current=Number.isInteger(f.posterVariantIndex)&&f.posterVariantIndex>=0&&f.posterVariantIndex<count?f.posterVariantIndex:0;
    const raw=f.posterShuffleRemaining;
    let bag=f.posterShuffleKey===key&&Array.isArray(raw)&&raw.length<count&&new Set(raw).size===raw.length&&raw.every(i=>Number.isInteger(i)&&i>=0&&i<count&&i!==current)?raw.slice():[];
    if(!bag.length){
      bag=Array.from({length:count},(_,i)=>i);
      for(let i=bag.length-1;i>0;i--){const sample=random(),j=Math.floor(Math.max(0,Math.min(.999999999,Number.isFinite(sample)?sample:0))*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      // At a cycle boundary postpone the current image, without losing it.
      if(bag[0]===current)[bag[0],bag[1]]=[bag[1],bag[0]];
    }
    return {posterVariantIndex:bag.shift(),posterShuffleRemaining:bag,posterShuffleKey:key};
  }
  const rgb=hex=>hex.slice(1).match(/../g).map(n=>parseInt(n,16));
  const hex=values=>'#'+values.map(n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0')).join('');
  const luminance=colour=>rgb(colour).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const mix=(a,b,t)=>hex(rgb(a).map((n,i)=>n*(1-t)+rgb(b)[i]*t));
  // Content scrim is >=88% opaque. Test both extreme underlying pixels, not just a flat swatch.
  const posterContrast=(ink,text)=>Math.min(contrast(mix(ink,'#ffffff',.12),text),contrast(mix(ink,'#000000',.12),text));
  function palette(value){
    if(!value||typeof value!=='object'||['ink','text','accent'].some(k=>!/^#[0-9a-f]{6}$/i.test(value[k]||'')))return null;
    const p=Object.fromEntries(['ink','text','accent'].map(k=>[k,value[k].toLowerCase()]));
    return posterContrast(p.ink,p.text)>=4.5&&posterContrast(p.ink,p.accent)>=3?p:null;
  }
  const neutralPalette={ink:'#111111',text:'#ffffff',accent:'#ff9b86'};
  function paletteFromPixels(pixels){
    const groups=new Map();
    for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<160)continue;const c=[pixels[i],pixels[i+1],pixels[i+2]],key=c.map(n=>Math.floor(n/32)).join(':');const g=groups.get(key)||{count:0,sum:[0,0,0]};g.count++;c.forEach((n,j)=>g.sum[j]+=n);groups.set(key,g);}
    const all=[...groups.values()].map(g=>({count:g.count,colour:hex(g.sum.map(n=>n/g.count))})),total=all.reduce((n,g)=>n+g.count,0);
    const colours=all.filter(g=>g.count>=Math.max(2,total*.004)).sort((a,b)=>luminance(a.colour)-luminance(b.colour));
    if(!colours.length)return {...neutralPalette};
    let ink=colours[0].colour,text=colours.at(-1).colour;
    for(let t=0;posterContrast(ink,text)<4.5&&t<=10;t++){
      ink=mix(colours[0].colour,'#000000',t/10);text=mix(colours.at(-1).colour,'#ffffff',t/10);
    }
    const vibrant=colours.slice().sort((a,b)=>{const weight=g=>(Math.max(...rgb(g.colour))-Math.min(...rgb(g.colour)))*Math.sqrt(g.count);return weight(b)-weight(a);})[0].colour;
    let accent=vibrant;
    // Preserve vivid hues by increasing brightness before adding a pale tint.
    for(let step=1;posterContrast(ink,accent)<3&&step<=10;step++)accent=hex(rgb(vibrant).map(n=>n*(1+step*.12)));
    const bright=accent;
    for(let t=0;posterContrast(ink,accent)<3&&t<=10;t++)accent=mix(bright,text,t/10);
    return palette({ink,text,accent})||{...neutralPalette};
  }
  const metalArtwork={url:'https://s3.amazonaws.com/criterion-production/films/71b3c648d30693c6d47a84e88afb5a6d/UrNlfWgNeBSPUZtpsIDTa1BAlEmwFr_large.jpg',source:'https://www.criterion.com/films/32169-sound-of-metal',credit:'Sound of Metal (2019) · Criterion cover by William Laboury',palette:{ink:'#1b1614',text:'#fbfaf6',accent:'#dfb396'}};
  function poster(f,records=[]){
    if(f.posterHidden===true||f.posterHidden==='on')return null;
    let alternatives=[];try{alternatives=variants(f.posterVariants);}catch{}
    if(Number.isInteger(f.posterVariantIndex)&&f.posterVariantIndex>0&&alternatives[f.posterVariantIndex-1])return {...alternatives[f.posterVariantIndex-1],uploaded:false};
    const data=resolveArtwork(f.posterAssetId,records)||posterData(f.posterData),url=imageURL(f.posterURL),colours=palette(f.posterPalette);
    if(data||url)return {url:data||url,source:imageURL(f.posterSourceURL),credit:clean(f.posterCredit,200)||'Poster artwork · rights belong to its owner',palette:colours||{...neutralPalette},uploaded:!!data};
    if(clean(f.title).normalize('NFKC').toLowerCase()==='sound of metal'&&['','2019','2020'].includes(String(f.year||'')))return {...metalArtwork,palette:colours||metalArtwork.palette};
    return null;
  }
  function entry(values,{id,date,watchlist=false}={}) {
    const title=clean(values.title);if(!title)throw Error('Choose or enter a film title.');
    const year=clean(values.year,4);if(year && !/^\d{4}$/.test(year))throw Error('Use a four-digit year, or leave it blank.');
    const rating=values.rating==='none'?null:Number(values.rating);
    if(!watchlist && (values.rating==='' || values.rating==null || (values.rating!=='none' && (!Number.isFinite(rating)||rating<.5||rating>5||rating*2!==Math.round(rating*2)))))throw Error('Choose your rating, or explicitly choose No rating.');
    const undated=values.watchedDateUnknown===true||values.watchedDateUnknown==='on';
    const watchedDate=undated?'':clean(values.date,10);
    if(!watchlist && !undated && (!/^\d{4}-\d{2}-\d{2}$/.test(watchedDate)||!Number.isFinite(Date.parse(watchedDate))||new Date(watchedDate).toISOString().slice(0,10)!==watchedDate||watchedDate>date))throw Error('Choose a valid watched date, or explicitly select Date not recorded.');
    const letterboxdURI=uri(values.letterboxdURI);
    if(values.letterboxdURI?.trim()&&!letterboxdURI)throw Error('Use an HTTPS film link from Letterboxd or boxd.it.');
    const out={id,title,year,filmKey:clean(values.filmKey,400)||identity({title,year}),date:watchlist?date:watchedDate,mode:watchlist?'Film watchlist':'Film diary',track:'Personal',minutes:0,rating:watchlist?null:rating,genres:clean(values.genres,300).split(',').map(g=>g.trim()).filter(Boolean).slice(0,12),note:clean(values.note,3000),rewatch:values.rewatch===true||values.rewatch==='on',letterboxdURI,letterboxdStatus:watchlist?'watchlist-pending':'diary-pending'};
    if(!watchlist&&undated)out.watchedDateUnknown=true;
    if(!watchlist&&(values.letterboxdObserved===true||values.letterboxdObserved==='on')){
      if(!letterboxdURI)throw Error('Add the exact Letterboxd film link for a watched-list import.');
      out.letterboxdStatus='observed';
    }
    if(/^Q\d+$/.test(values.wikidataId||''))out.wikidataId=values.wikidataId;
    if(values.entryNote)out.entryNote=clean(values.entryNote,500);
    const posterURL=imageURL(values.posterURL),posterSourceURL=imageURL(values.posterSourceURL);
    if(values.posterURL?.trim()&&!posterURL)throw Error('Use a public HTTPS poster-image URL without passwords, local addresses or a custom port.');
    if(values.posterSourceURL?.trim()&&!posterSourceURL)throw Error('Use a public HTTPS artwork-source link.');
    if(posterURL){out.posterURL=posterURL;out.posterSourceURL=posterSourceURL;out.posterCredit=clean(values.posterCredit,200);}
    const data=posterData(values.posterData);
    if(values.posterData&&!data)throw Error('Poster must be a compact JPEG from the upload tool (maximum 30,000 characters).');
    if(data){out.posterData=data;out.posterSourceURL=posterSourceURL;out.posterCredit=clean(values.posterCredit,200);}
    if(values.posterPalette){const p=palette(values.posterPalette);if(!p)throw Error('Text and accent colours need stronger contrast. Use Match poster colours or choose a lighter text / darker background.');out.posterPalette=p;}
    if(values.posterHidden===true||values.posterHidden==='on')out.posterHidden=true;
    if(values.posterAssetId){if(!assetId(values.posterAssetId))throw Error('Invalid private poster reference.');out.posterAssetId=values.posterAssetId;}
    const alternatives=variants(values.posterVariants);
    if(alternatives.length){out.posterVariants=alternatives;const index=Number(values.posterVariantIndex)||0;out.posterVariantIndex=Number.isInteger(index)&&index>=0&&index<=alternatives.length?index:0;}
    if(new TextEncoder().encode(JSON.stringify(out)).length>48000)throw Error('This card is too large to sync safely. Use a smaller poster or shorter image/source links.');
    return out;
  }
  function withThought(record,value){
    if(record?.mode!=='Film diary'||!record.id)throw Error('This film card is no longer available.');
    if(typeof value!=='string'||value.length>3000)throw Error('Keep your thought within 3,000 characters.');
    const out={...record,note:clean(value,3000)};
    if(new TextEncoder().encode(JSON.stringify(out)).length>48000)throw Error('This card is too large to sync safely. Shorten the thought or use shorter poster links; nothing was changed.');
    return out;
  }
  // Quoting is RFC 4180; neutralise spreadsheet formulas without changing ordinary film labels.
  const cell=s=>'"'+String(s??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
  function csv(rows,diary=false){
    const headers=diary?['Title','Year','LetterboxdURI','Rating','WatchedDate','Rewatch']:['Title','Year','LetterboxdURI'];
    return '\ufeff'+[headers.join(','),...rows.map(r=>(diary?[r.title,r.year,uri(r.letterboxdURI),r.rating??'',r.date,r.rewatch?'true':'false']:[r.title,r.year,uri(r.letterboxdURI)]).map(cell).join(','))].join('\r\n')+'\r\n';
  }
  const exportable=rows=>rows.filter(r=>!r.entryNote||uri(r.letterboxdURI));
  function watchlist(catalogue,sessions,watched){
    const map=new Map();
    for(const f of [...catalogue,...sessions.filter(s=>s.mode==='Film watchlist')]){
      const key=identity(f);
      if(!watched[key]&&!sessions.some(s=>s.mode==='Film diary'&&sameFilm(s,{...f,filmKey:key})))map.set(key,{...f,filmKey:key});
    }
    return [...map.values()];
  }
  const api={personal,identity,sameFilm,pending,entry,withThought,csv,watchlist,uri,exportable,imageURL,poster,posterData,fullPosterData,artworkChunks,resolveArtwork,variants,nextPoster,palette,paletteFromPixels,posterContrast};
  root.ACTING_JOURNAL=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
