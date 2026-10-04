(function(root){
  const learningCategories=new Set(['open text','licensed edition','publisher edition','rights reference','catalogue','open academic','government book','scholarly book','digitized book','digitized history','folk theatre','practitioner study','practitioner','oral history']);
  const shelf=r=>learningCategories.has(r.category)?'library':/past paper|official|audition guidance/.test(r.category)?'exam':'research';
  const priorities={start_here:'Start here',add_next:'Add next',extended:'Extended',prescribed_play:'Prescribed play · NSD 2026'};
  function filter(rows,f={}){return rows.filter(r=>Object.entries(f).every(([key,value])=>{
    if(!value||value==='all')return true;
    if(key==='search')return [r.title,r.romanTitle,r.author,r.publisher,r.why,...(r.topics||[])].join(' ').toLowerCase().includes(value.trim().toLowerCase());
    if(key==='track')return (r.tracks||[]).includes(value);
    if(key==='topic')return (r.topics||[]).includes(value);
    if(key==='access'&&value==='local_pdf')return !!r.localPdf;
    return r[key]===value;
  }));}
  function action(r){
    if(r.localPdf)return {url:r.localPdf,label:'Open PDF',accessType:r.pdfLicense?'open_licensed_download':'public_domain_download'};
    if(r.archiveScan)return {url:r.archiveScan.url,label:'Read scan',accessType:'external_archive_scan'};
    if(r.internetArchive)return {...r.internetArchive,label:r.internetArchive.accessType==='view_record_rights_unverified'?'View record':r.internetArchive.label};
    return {url:r.accessUrl,label:r.access==='pdf_lead'?'Check PDF source':r.access==='open_text'?'Read text':'Edition / Buy / Locate',accessType:r.access};
  }
  function personalAction(r,local,protocol){
    if(protocol!=='file:')return null;
    const copy=local?.[r.id];
    if(!copy||!/^\.\.\/study-material\/archive-scans\/[A-Za-z0-9_]+\.pdf$/.test(copy.url))return null;
    return {...copy,label:'Open personal local PDF',accessType:'personal_local_copy'};
  }
  const api={shelf,priorities,filter,action,personalAction};root.ACTING_LIBRARY=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
