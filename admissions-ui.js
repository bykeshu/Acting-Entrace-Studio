(() => {
  const data=window.ACTING_ADMISSIONS;
  if(!data)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const links=ids=>ids.map(id=>{const s=data.sources.find(s=>s.sourceId===id);return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`;}).join(' · ');
  const sections=[...new Set(data.facts.map(r=>r.section))];
  document.querySelector('#admissionsComparison').innerHTML=sections.map(section=>`<section class="panel admission-section"><h2>${esc(section)}</h2><div class="admission-table-wrap"><table class="admission-table"><caption>${esc(section)} comparison · checked ${data.verifiedOn}</caption><thead><tr><th scope="col">Detail</th><th scope="col">FTII Screen Acting</th><th scope="col">NSD New Delhi</th></tr></thead><tbody>${data.facts.filter(r=>r.section===section).map(r=>`<tr><th scope="row">${esc(r.label)}${r.status!=='official'?`<small>${esc(r.status)}</small>`:''}</th><td data-institution="FTII">${esc(r.ftii)}<small class="admission-source">${links(r.ftiiSources)}</small></td><td data-institution="NSD">${esc(r.nsd)}<small class="admission-source">${links(r.nsdSources)}</small></td></tr>`).join('')}</tbody></table></div></section>`).join('');
  const existing=window.ACTING_SEED.resources.filter(r=>data.movedResourceIds.includes(r.id)&&!['r0','r1','r13'].includes(r.id));
  document.querySelector('#admissionsSources').innerHTML=data.sources.map(s=>`<article class="resource"><div><h3><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></h3><p>${esc(s.publisher)} · ${esc(s.examCycle)} · ${s.sourceType} · checked ${s.verifiedOn}</p><p>${esc(s.locator)}</p></div><span class="status">${esc(s.access)}</span></article>`).join('')+existing.map(r=>`<article class="resource"><div><h3><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a></h3><p>${esc(r.publisher)} · ${/2024/.test(r.title)?'Archived 2024 cycle; historical only':'2026 audition reference'} · last catalogue check ${esc(r.verifiedOn)} · ${esc(r.access)}; not reverified today</p></div></article>`).join('');
  document.querySelector('#admissionsGaps').innerHTML=data.gaps.map(g=>`<li>${esc(g)}</li>`).join('');
  document.querySelector('#admissionsPrint').addEventListener('click',()=>window.print());
  if(window.location.hash==='#admissions')window.ACTING_FILM_STORE.open('admissions');
})();
