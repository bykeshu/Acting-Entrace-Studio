const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('Bengali play shelf distinguishes local, online and catalogue access',()=>{
  const html=read('index.html'),sw=read('sw.js');
  for(const name of ['Dinabandhu Mitra','Michael Madhusudan Dutt','Girish Chandra Ghosh','Rabindranath Tagore','Bijon Bhattacharya','Utpal Dutt','Badal Sircar','Manoj Mitra','Dwijendralal Ray','Kazi Nazrul Islam'])assert.ok(html.includes(name),name);
  for(const play of ['Nil Darpan','Siraj-ud-Daulah','Raktakarabi','Dak Ghar','Nabanna','Tiner Talowar','Evam Indrajit','Baaki Itihaas','Michhil','Jagannath'])assert.ok(html.includes(play),play);
  assert.match(html,/Dak Ghar<\/strong> <small>Local PDF · English translation; Bengali text online/);
  assert.match(html,/Nabanna<\/strong> <small>Prescribed-list title · no local PDF/);
  assert.match(html,/Baaki Itihaas<\/strong> <small>Prescribed-list title · no local PDF/);
  assert.ok(html.includes('study-material/open-texts/Tagore_The_Post_Office_1914.pdf'));
  assert.ok(!/boierthikana\.com\/static\/pdf/i.test(html));
  assert.ok(html.includes('bengali-plays.css?v=20261001'));
  assert.ok(sw.includes('./bengali-plays.css?v=20261001'));
  assert.ok(fs.existsSync(path.join(root,'bengali-plays.css')));
});
