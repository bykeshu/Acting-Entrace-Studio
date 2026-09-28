(() => {
  const data=window.ACTING_STUDY,core=window.ACTING_LIBRARY,$=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const sources=new Map(data.sources.map(s=>[s.sourceId,s]));
  const accessLabels={buy_or_borrow:'Buy or borrow',borrow_or_reference:'Borrow / reference',library_or_catalogue:'Locate via library',open_text:'Open text',open_or_buy:'Open text / edition'};
  const addOptions=(id,values)=>{$(id).insertAdjacentHTML('beforeend',[...new Set(values)].sort().map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''));};
  addOptions('#studyLanguage',data.materials.map(r=>r.language));
  addOptions('#studyTopic',data.materials.flatMap(r=>r.topics));
  $('#studyAccess').insertAdjacentHTML('beforeend',Object.entries(accessLabels).map(([v,label])=>`<option value="${v}">${label}</option>`).join(''));
  const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  function render(){
    const f=Object.fromEntries(['Priority','Language','Topic','Track','Access','Search'].map(k=>[k.toLowerCase(),$('#study'+k).value]));
    const rows=core.filter(data.materials,f);
    $('#studyCount').textContent=`${rows.length} of ${data.materials.length} books & plays · catalogue checked ${data.verifiedOn} · opening is not completion`;
    $('#studyCards').innerHTML=rows.map((r,i)=>{
      const a=core.action(r),evidence=(r.evidenceSourceIds||[]).map(id=>sources.get(id)).filter(Boolean);
      return `<article class="study-book" data-study-id="${esc(r.id)}"><div class="study-book-spine" aria-hidden="true">${String(i+1).padStart(2,'0')} / ${esc(core.priorities[r.priority])}</div><div class="study-book-body"><p class="eyebrow">${esc(r.language)} · ${esc(r.tracks.join(' / '))}</p><h2>${esc(r.title)}</h2>${r.romanTitle?`<small>${esc(r.romanTitle)}</small>`:''}<p class="study-author">${esc(r.author)}</p><div class="meta">${r.topics.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><p>${esc(r.why)}</p><p class="study-availability">${esc(r.availabilityNote||'Edition and availability may change; check the linked source before buying or borrowing.')}${r.localPdfNote?' '+esc(r.localPdfNote):''}</p><div class="study-actions">${link(a.url,a.label)}${r.accessUrl!==a.url?link(r.accessUrl,'Edition / Buy / Locate'):''}</div><small>${esc(r.localPdf?'Historical public-domain PDF · available offline after opening online':a.accessType.replaceAll('_',' '))} · checked ${esc(data.verifiedOn)}</small><details><summary>Why this is on the shelf</summary><p>Evidence of relevance, not a blanket official reading prescription. NSD plays refer to the 2026 cycle.</p>${evidence.map(s=>`<p>${link(s.url,s.title)}<small>${esc(s.sourceType.replaceAll('_',' '))} · ${esc(s.examCycle)} · checked ${esc(s.verifiedOn)}</small></p>`).join('')}</details></div></article>`;
    }).join('')||'<p class="empty">No books match these filters.</p>';
    // Keep original learning links, but never let papers or guidelines enter this shelf.
    const known=new Set(data.materials.flatMap(r=>[r.accessUrl,r.internetArchive?.url]));
    const reading=window.ACTING_SEED.resources.filter(r=>core.shelf(r)==='library'&&!known.has(r.url));
    $('#studyFurtherReading').innerHTML=reading.map(r=>`<article class="resource"><div><h3>${esc(r.title)}</h3><p>${esc(r.publisher)} · ${esc(r.category)} · checked ${esc(r.verifiedOn)}</p></div><span class="status">${esc(r.track)} · ${esc(r.access)}</span>${link(r.url,'Open reference')}</article>`).join('');
  }
  ['Priority','Language','Topic','Track','Access'].forEach(k=>$('#study'+k).addEventListener('change',render));
  $('#studySearch').addEventListener('input',render);
  window.ACTING_STUDY_UI={render};render();
})();
