const fs=require('node:fs');
const path=require('node:path');
const data=require('../admissions-data.js');
const root=path.resolve(__dirname,'..');
const refs=ids=>ids.map(id=>{const s=data.sources.find(s=>s.sourceId===id);return `[${s.title}](${s.url})`;}).join(', ');
let md=`# FTII and NSD admissions cheat sheet\n\nChecked ${data.verifiedOn}. ${data.scope}\n\n2026 application windows have passed. Next-cycle dates are not verified as announced.\n`;
for(const section of [...new Set(data.facts.map(r=>r.section))]){
 md+=`\n## ${section}\n\n| Detail | FTII Screen Acting | NSD New Delhi |\n| --- | --- | --- |\n`;
 for(const r of data.facts.filter(r=>r.section===section))md+=`| ${r.label} | ${r.ftii} (${refs(r.ftiiSources)}) | ${r.nsd} (${refs(r.nsdSources)}) |\n`;
}
md+='\n## Documents and readiness\n\nShared items appear once. Required, conditional, stage-specific and advised items are distinguished. Keep originals; joining letters can add forms or specify copies.\n\n';
for(const d of data.documents)md+=`- **${d.title}** — ${d.appliesTo}; ${d.stage}; ${d.requirement}. ${d.note} Sources: ${refs(d.sourceIds)}.\n`;
md+='\n## Verification gaps\n\n'+data.gaps.map(g=>`- ${g}`).join('\n')+'\n\n## Sources\n\n';
for(const s of data.sources)md+=`- [${s.title}](${s.url}) — ${s.publisher}; ${s.examCycle}; ${s.sourceType}; ${s.access}; verified ${s.verifiedOn}. ${s.locator}\n`;
fs.writeFileSync(path.join(root,'ADMISSIONS_CHEAT_SHEET.md'),md);
fs.writeFileSync(path.join(root,'admissions-spec.json'),JSON.stringify(data,null,2)+'\n');
console.log('Admissions cheat sheet and source catalogue written.');
