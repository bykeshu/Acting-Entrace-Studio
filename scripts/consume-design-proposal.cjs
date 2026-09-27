const fs=require('node:fs');
const path=require('node:path');
const {refresh}=require('./refresh-design.cjs');
function consume(repo=path.resolve(__dirname,'..')){
 const proposal=JSON.parse(fs.readFileSync(path.join(repo,'design/proposal.json'),'utf8'));
 if(Object.keys(proposal).sort().join()!=='design,proposalId'||!/^[-a-z0-9]{8,80}$/.test(proposal.proposalId)||proposal.design?.mode!=='fresh-ai')throw Error('Invalid fresh-AI proposal envelope');
 if(!['mode,presetId,rationale,tokens','compositionCss,mode,presetId,rationale,tokens'].includes(Object.keys(proposal.design).sort().join()))throw Error('Unexpected design fields');
 const history=JSON.parse(fs.readFileSync(path.join(repo,'design/history.json'),'utf8'));
 if(history.some(r=>r.proposalId===proposal.proposalId))return {alreadyProcessed:true,proposalId:proposal.proposalId};
 return refresh({repo,design:proposal.design,proposalId:proposal.proposalId,runner:process.env.GITHUB_ACTIONS?'github-actions':'local'});
}
if(require.main===module)console.log(JSON.stringify(consume(),null,2));
module.exports={consume};
