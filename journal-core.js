/* Personal cinema, never an exam score. Pure helpers also exercised by Node tests. */
((root) => {
  const personal = s => ['Film memory','Film diary','Film watchlist'].includes(s.mode);
  const clean = (s,n=200) => String(s ?? '').trim().slice(0,n);
  const identity = f => f.filmKey || (f.courseId ? `cinema-watched:${f.courseId}` : f.id ? `bucket-watched:${f.id}` : `film:${clean(f.title).normalize('NFKC').toLowerCase()}:${f.year||''}`);
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
  function poster(f){
    if(f.posterHidden===true||f.posterHidden==='on')return null;
    const data=posterData(f.posterData),url=imageURL(f.posterURL),colours=palette(f.posterPalette);
    if(data||url)return {url:data||url,source:imageURL(f.posterSourceURL),credit:clean(f.posterCredit,200)||'Poster artwork · rights belong to its owner',palette:colours||{...neutralPalette},uploaded:!!data};
    if(clean(f.title).normalize('NFKC').toLowerCase()==='sound of metal'&&['','2019','2020'].includes(String(f.year||'')))return {...metalArtwork,palette:colours||metalArtwork.palette};
    return null;
  }
  function entry(values,{id,date,watchlist=false}={}) {
    const title=clean(values.title);if(!title)throw Error('Choose or enter a film title.');
    const year=clean(values.year,4);if(year && !/^\d{4}$/.test(year))throw Error('Use a four-digit year, or leave it blank.');
    const rating=values.rating==='none'?null:Number(values.rating);
    if(!watchlist && (values.rating==='' || values.rating==null || (values.rating!=='none' && (!Number.isFinite(rating)||rating<.5||rating>5||rating*2!==Math.round(rating*2)))))throw Error('Choose your rating, or explicitly choose No rating.');
    const watchedDate=clean(values.date,10);
    if(!watchlist && (!/^\d{4}-\d{2}-\d{2}$/.test(watchedDate)||!Number.isFinite(Date.parse(watchedDate))||new Date(watchedDate).toISOString().slice(0,10)!==watchedDate||watchedDate>date))throw Error('Choose a valid watched date, not a future date.');
    const letterboxdURI=uri(values.letterboxdURI);
    if(values.letterboxdURI?.trim()&&!letterboxdURI)throw Error('Use an HTTPS film link from Letterboxd or boxd.it.');
    const out={id,title,year,filmKey:clean(values.filmKey,400)||identity({title,year}),date:watchlist?date:watchedDate,mode:watchlist?'Film watchlist':'Film diary',track:'Personal',minutes:0,rating:watchlist?null:rating,genres:clean(values.genres,300).split(',').map(g=>g.trim()).filter(Boolean).slice(0,12),note:clean(values.note,3000),rewatch:values.rewatch===true||values.rewatch==='on',letterboxdURI,letterboxdStatus:watchlist?'watchlist-pending':'diary-pending'};
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
    if(new TextEncoder().encode(JSON.stringify(out)).length>48000)throw Error('This card is too large to sync safely. Use a smaller poster or shorter image/source links.');
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
      if(!watched[key]&&!sessions.some(s=>s.mode==='Film diary'&&s.filmKey===key))map.set(key,{...f,filmKey:key});
    }
    return [...map.values()];
  }
  const api={personal,identity,entry,csv,watchlist,uri,exportable,imageURL,poster,posterData,palette,paletteFromPixels,posterContrast};
  root.ACTING_JOURNAL=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
