/* Personal cinema, never an exam score. Pure helpers also exercised by Node tests. */
((root) => {
  const personal = s => ['Film memory','Film diary','Film watchlist'].includes(s.mode);
  const clean = (s,n=200) => String(s ?? '').trim().slice(0,n);
  const identity = f => f.filmKey || (f.courseId ? `cinema-watched:${f.courseId}` : f.id ? `bucket-watched:${f.id}` : `film:${clean(f.title).normalize('NFKC').toLowerCase()}:${f.year||''}`);
  const uri = value => {
    try { const u=new URL(value); return u.protocol==='https:' && ['letterboxd.com','www.letterboxd.com','boxd.it'].includes(u.hostname) && !u.username && !u.password && u.pathname!=='/' ? u.href : ''; } catch { return ''; }
  };
  // URLs only: never bundle third-party artwork or put private diary records in the site.
  const imageURL = value => {
    if(!value || String(value).length>2048)return '';
    try {
      const u=new URL(String(value).trim()),host=u.hostname.toLowerCase();
      if(u.protocol!=='https:'||u.username||u.password||u.port||!host.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)||/\.(localhost|local|internal)$/.test(host)||host.includes(':'))return '';
      return u.href;
    }catch{return '';}
  };
  const metalArtwork={url:'https://s3.amazonaws.com/criterion-production/films/71b3c648d30693c6d47a84e88afb5a6d/UrNlfWgNeBSPUZtpsIDTa1BAlEmwFr_large.jpg',source:'https://www.criterion.com/films/32169-sound-of-metal',credit:'Sound of Metal (2019) · Criterion cover by William Laboury'};
  function poster(f){
    if(f.posterHidden===true||f.posterHidden==='on')return null;
    const url=imageURL(f.posterURL);
    if(url)return {url,source:imageURL(f.posterSourceURL),credit:clean(f.posterCredit,200)||'Poster artwork · rights belong to its owner'};
    if(clean(f.title).normalize('NFKC').toLowerCase()==='sound of metal'&&['','2019','2020'].includes(String(f.year||'')))return {...metalArtwork};
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
    if(values.posterHidden===true||values.posterHidden==='on')out.posterHidden=true;
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
  const api={personal,identity,entry,csv,watchlist,uri,exportable,imageURL,poster};
  root.ACTING_JOURNAL=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
