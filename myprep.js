/* MyPrep navigation only. The tracker, accounts and backup format stay unchanged. */
(() => {
  const dialog = document.querySelector('#prepNavigate');
  const currentWeekly = document.querySelector('link[href^="weekly-theme.css"]');
  // This one-time layout is replaced by the next scheduled Pinterest composition.
  const revision=currentWeekly?.getAttribute('href').split('?v=')[1];
  document.body.classList.toggle('prep-consolidated', ['weekly-20260928034844-1e770310','weekly-20261019040445-0ebc2dde'].includes(revision));
  function openSections(){ dialog.showModal(); }
  document.querySelector('#prepSections').addEventListener('click',openSections);
  document.querySelector('#prepMore').addEventListener('click',openSections);
  document.querySelector('#prepNavClose').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-go]'))dialog.close();});
  document.querySelector('#prepAccount').addEventListener('click',()=>{dialog.close();document.querySelector('#cloudAccount').click();});
  document.querySelector('#prepExport').addEventListener('click',()=>document.querySelector('#exportBtn').click());
  const importer=document.querySelector('#prepImport');
  importer.addEventListener('change',()=>{
    document.querySelector('#importInput').files=importer.files;
    document.querySelector('#importInput').dispatchEvent(new Event('change'));
    importer.value='';
  });
  document.querySelector('#prepImportLabel').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();importer.click();}});
  function updateNavigation(){
    const room=document.body.dataset.room;
    document.querySelectorAll('.prep-dock [data-go]').forEach(button=>{
      if(button.dataset.go===room)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    document.querySelector('#prepMore').classList.toggle('active',!['today','syllabus','practice','journal'].includes(room));
  }
  new MutationObserver(updateNavigation).observe(document.body,{attributes:true,attributeFilter:['data-room']});
  updateNavigation();
})();
