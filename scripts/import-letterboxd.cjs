'use strict';
// No history files, artifacts, reviews or credentials are written to disk/logs.
const {parseFeed,MAX_BYTES}=require('./letterboxd-feed.cjs');
const PROJECT='acting-studio-entrance',API_KEY='AIzaSyB9G3IxXSQiJoLOScNH2t6dAEs84HGIdpQ';
async function request(url,options={}){
  const response=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(20000)});
  return response;
}
async function feed(){
  const response=await request('https://letterboxd.com/saltinsea/rss/');
  if(!response.ok)throw Error('FEED_HTTP');
  const chunks=[];let length=0;
  for await(const chunk of response.body){length+=chunk.length;if(length>MAX_BYTES)throw Error('FEED_SIZE');chunks.push(chunk);}
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return parseFeed(Buffer.concat(chunks).toString('utf8'),today);
}
const value=v=>v===null?{nullValue:null}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{doubleValue:v}:{stringValue:v};
async function run(env=process.env){
  const result=await feed();
  if(env.LETTERBOXD_CHECK_ONLY==='true'){console.log(`RSS check passed: ${result.entries.length} eligible entries; ${result.skipped} skipped. No writes.`);return;}
  const {LETTERBOXD_IMPORT_EMAIL:email,LETTERBOXD_IMPORT_PASSWORD:password,LETTERBOXD_OWNER_UID:owner,LETTERBOXD_WRITER_UID:writer}=env;
  if(!email||!password||!owner||!writer)throw Error('SETUP_REQUIRED');
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(owner)||!/^[A-Za-z0-9_-]{1,128}$/.test(writer)||owner===writer)throw Error('SETUP_INVALID');
  const auth=await request(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  if(!auth.ok)throw Error('IMPORTER_SIGN_IN_FAILED');
  const token=await auth.json();
  if(token.localId!==writer||!token.idToken)throw Error('IMPORTER_UID_MISMATCH');
  const base=`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
  const headers={Authorization:`Bearer ${token.idToken}`,'Content-Type':'application/json'};
  let added=0,existing=0;
  for(const entry of result.entries){
    const fields=Object.fromEntries(Object.entries(entry).filter(([k])=>!['id','date'].includes(k)).map(([k,v])=>[k,value(v)]));
    fields.watchedAt={timestampValue:`${entry.date}T00:00:00Z`};fields.schemaVersion={integerValue:'1'};
    const name=`projects/${PROJECT}/databases/(default)/documents/users/${owner}/letterboxdImports/${entry.id}`;
    const response=await request(`${base}:commit`,{method:'POST',headers,body:JSON.stringify({writes:[{update:{name,fields},currentDocument:{exists:false},updateTransforms:[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}]}]})});
    if(response.ok)added++;
    else{const error=await response.json().catch(()=>({}));if(response.status===409&&error.error?.status==='ALREADY_EXISTS')existing++;else throw Error(response.status===403?'IMPORT_RULES_DENIED':'IMPORT_WRITE_FAILED');}
  }
  const statusName=`projects/${PROJECT}/databases/(default)/documents/users/${owner}/letterboxdStatus/latest`;
  const response=await request(`${base}:commit`,{method:'POST',headers,body:JSON.stringify({writes:[{update:{name:statusName,fields:{schemaVersion:{integerValue:'1'},eligibleCount:{integerValue:String(result.entries.length)},skippedCount:{integerValue:String(result.skipped)}}},updateTransforms:[{fieldPath:'checkedAt',setToServerValue:'REQUEST_TIME'}]}]})});
  if(!response.ok)throw Error('IMPORT_STATUS_FAILED');
  console.log(`Private inbox updated: ${added} new; ${existing} already present; ${result.skipped} skipped.`);
}
if(require.main===module)run().catch(error=>{const allowed=new Set(['FEED_HTTP','FEED_SIZE','FEED_FORMAT','FEED_PROFILE','SETUP_REQUIRED','SETUP_INVALID','IMPORTER_SIGN_IN_FAILED','IMPORTER_UID_MISMATCH','IMPORT_RULES_DENIED','IMPORT_WRITE_FAILED','IMPORT_STATUS_FAILED']);console.error(`Letterboxd import failed: ${allowed.has(error.message)?error.message:'NETWORK_OR_FEED_ERROR'}. No private details logged.`);process.exitCode=1;});
module.exports={run,value,feed};
