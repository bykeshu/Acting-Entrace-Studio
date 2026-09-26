// Mechanical synchronization of the public cinema catalogue into research JSON.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const appRoot = path.resolve(__dirname, '..');
const researchRoot = path.resolve(appRoot, '..', 'data');
const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(appRoot,'seed-data.js'),'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(appRoot,'cinema-data.js'),'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(appRoot,'bucket-data.js'),'utf8'), context);
const course = context.window.ACTING_CINEMA;
const bucket = context.window.ACTING_BUCKET;
for (const name of ['syllabus.json','resources.json']) {
  const filename = path.join(researchRoot,name);
  const data = JSON.parse(fs.readFileSync(filename,'utf8'));
  if (name === 'syllabus.json') {
    data.viewingPreference = {sourceType:'personal',updatedOn:bucket.checkedOn,note:bucket.preference,bucketList:'ftii-nsd-dashboard/bucket-data.js'};
    data.tracks = data.tracks.filter(t=>t.id!=='world');
    data.tracks.push({id:'world',name:'International cinema · supplementary',provenance:'supplementary',modules:course.modules});
  } else {
    data.resources = data.resources.filter(r=>!r.id.startsWith('cinema-source-')&&!r.id.startsWith('cinema-reception-')&&!r.id.startsWith('personal-movie-'));
    data.resources.push(...course.films.map(f=>({id:`cinema-source-${f.id}`,track:'International',category:'supplementary film reference',title:`${f.title} (${f.year}) — ${f.directors.join(' / ')}`,url:f.url,publisher:f.publisher,access:'reference',status:'metadata_verified',sourceType:'supplementary',verifiedOn:f.verifiedOn,availability:f.availability})));
    data.resources.push(...course.receptionSources.map((r,i)=>({id:`cinema-reception-${i}`,track:'International',category:'supplementary reception reference',access:'reference',status:'verified',sourceType:'supplementary',...r})));
    data.resources.push(...bucket.collections.map(c=>({id:`personal-movie-${c.id}`,track:'Personal',category:'personal movie bucket list',title:c.title,url:c.pinUrl,publisher:'The Cinema Stories / Pinterest',sourceType:'personal',access:'reference',status:'pin_titles_observed',checkedOn:bucket.checkedOn,titleCount:c.titleCount,note:bucket.preference+' Snapshot, not live syncing; film editions and India streaming access not independently verified.'})));
  }
  // Original dated entrance records stay unchanged; only the pack revision advances.
  data.version = course.version;
  fs.writeFileSync(filename,JSON.stringify(data,null,2)+'\n');
}
console.log(`Synchronized ${course.films.length} cinema references and ${course.modules.length} supplementary modules.`);
