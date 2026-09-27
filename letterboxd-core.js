/* Feed imports are personal viewing records, never coursework. No network here. */
((root)=>{
  const normalizeTitle=value=>String(value||'').normalize('NFKC').trim().toLowerCase();
  function filmURL(value){
    try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='letterboxd.com'&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash&&/^\/film\/[a-z0-9-]+\/$/.test(u.pathname)?u.href:'';}catch{return '';}
  }
  function date(value){
    return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  }
  function valid(item,today){
    return /^[a-f0-9]{64}$/.test(item.id||'')&&typeof item.title==='string'&&item.title.trim().length>0&&item.title.length<=200
      &&typeof item.year==='string'&&/^(18|19|20|21)\d{2}$/.test(item.year)
      &&date(item.date)&&item.date>='1888-01-01'&&item.date<=today&&typeof item.filmURL==='string'&&item.filmURL.length<=512&&filmURL(item.filmURL)===item.filmURL
      &&typeof item.entryURL==='string'&&item.entryURL.length<=512&&/^https:\/\/letterboxd\.com\/saltinsea\/film\/[a-z0-9-]+\/(?:[1-9][0-9]*\/)?$/.test(item.entryURL)
      &&typeof item.rewatch==='boolean'&&(item.rating===null||(typeof item.rating==='number'&&item.rating>=.5&&item.rating<=5&&Number.isInteger(item.rating*2)));
  }
  function plan(item,records,today){
    if(!valid(item,today))return {kind:'invalid'};
    const id=`lb:${item.id}`;
    if(records.some(r=>r.id===id))return {kind:'existing'};
    const candidates=records.filter(r=>r.mode==='Film diary'&&(
      filmURL(r.letterboxdURI)===item.filmURL||
      normalizeTitle(r.title)===normalizeTitle(item.title)&&(!r.year||String(r.year)===item.year)));
    // Never overwrite a locally edited rating, thought, date or poster. An undated
    // snapshot is conservatively kept rather than turning it into a second watch.
    if(candidates.some(r=>r.date===item.date||!r.date))return {kind:'existing'};
    if(records.some(r=>r.mode==='Film diary'&&normalizeTitle(r.title)===normalizeTitle(item.title)&&r.date===item.date&&r.year&&String(r.year)!==item.year))return {kind:'conflict'};
    return {kind:'create',record:{id,title:item.title,year:item.year,filmKey:`letterboxd:${item.filmURL}`,date:item.date,
      mode:'Film diary',track:'Personal',minutes:0,rating:item.rating,genres:[],note:'',rewatch:item.rewatch,
      letterboxdURI:item.filmURL,letterboxdStatus:'observed',letterboxdEntryURL:item.entryURL,letterboxdImportId:item.id}};
  }
  const api={filmURL,date,valid,plan};root.ACTING_LETTERBOXD=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
