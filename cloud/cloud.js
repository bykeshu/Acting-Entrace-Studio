import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";

const config={
  apiKey:"AIzaSyB9G3IxXSQiJoLOScNH2t6dAEs84HGIdpQ",
  authDomain:"acting-studio-entrance.firebaseapp.com",
  projectId:"acting-studio-entrance",
  storageBucket:"acting-studio-entrance.firebasestorage.app",
  messagingSenderId:"1085322780975",
  appId:"1:1085322780975:web:22e99e0d0088e27a7441da"
};
const app=initializeApp(config);
const auth=getAuth(app);
const db=getFirestore(app);
const bridge=window.ACTING_SYNC;
const account=document.querySelector("#cloudAccount");
const form=document.querySelector("#cloudForm");
const email=document.querySelector("#cloudEmail");
const password=document.querySelector("#cloudPassword");
const message=document.querySelector("#cloudMessage");
let unsubscribe=null,activeUid=null,ready=false,flushing=false;
const importMessage=document.querySelector('#letterboxdImportStatus');
const importForm=document.querySelector('#letterboxdImportForm');
let importUnsubscribers=[],importInbox=[],importReceipts=new Set(),inboxReady=false,receiptsReady=false,importing=false,importAgain=false,importEnabled=false,importSetup=null;
function stopImports(){
  importUnsubscribers.forEach(stop=>stop());importUnsubscribers=[];
  importInbox=[];importReceipts=new Set();inboxReady=false;receiptsReady=false;importEnabled=false;importSetup=null;
  if(importForm)importForm.reset();
  const ownerField=document.querySelector('#letterboxdOwnerUid');if(ownerField)ownerField.value='';
  if(importMessage)importMessage.textContent='Sign in to connect daily imports.';
}
async function reconcileImports(uid){
  if(!ready||activeUid!==uid||!inboxReady||!receiptsReady||!importEnabled||!navigator.onLine)return;
  if(importing){importAgain=true;return;}
  importing=true;let conflicts=0;
  try{
    for(const item of importInbox){
      if(activeUid!==uid||!ready||!importEnabled)break;
      if(importReceipts.has(item.id))continue;
      const planned=window.ACTING_LETTERBOXD.plan(item,window.ACTING_FILM_STORE.read(),window.ACTING_FILM_STORE.today());
      if(['invalid','conflict'].includes(planned.kind)){conflicts++;continue;}
      const batch=writeBatch(db);
      if(planned.kind==='create'){
        // Receipt + ordinary owner session event are atomic. Two open devices
        // cannot both create receipts; a failed competing batch changes nothing.
        batch.set(doc(db,'users',uid,'events',crypto.randomUUID()),{kind:'session',entityId:planned.record.id,action:'put',payload:JSON.stringify(planned.record),schemaVersion:1,createdAt:serverTimestamp()});
      }
      batch.set(doc(db,'users',uid,'letterboxdReceipts',item.id),{schemaVersion:1,createdAt:serverTimestamp()});
      await batch.commit();
      if(activeUid!==uid)break;
      importReceipts.add(item.id);
    }
    if(conflicts&&activeUid===uid)importMessage.textContent=`${conflicts} feed entries need manual matching; your existing cards were kept unchanged.`;
  }catch(error){if(activeUid===uid)importMessage.textContent='Import reconciliation paused; private cards are unchanged. It will retry on the next connection.';}
  finally{importing=false;if(importAgain){importAgain=false;if(activeUid)queueMicrotask(()=>reconcileImports(activeUid));}}
}
function startImports(uid){
  if(!importMessage||!window.ACTING_LETTERBOXD)return;
  document.querySelector('#letterboxdOwnerUid').value=uid;
  importMessage.textContent='Checking daily-import setup…';
  const denied=()=>{if(activeUid===uid)importMessage.textContent='Daily imports are not connected yet. Setup requires the reviewed private-inbox rules and GitHub secrets.';};
  importUnsubscribers.push(onSnapshot(doc(db,'users',uid,'integrations','letterboxd'),snapshot=>{
    if(activeUid!==uid)return;
    importSetup=snapshot.exists()?snapshot.data():null;importEnabled=importSetup?.enabled===true;
    document.querySelector('#letterboxdWriterUid').value=importSetup?.writerUid||'';
    importMessage.textContent=importEnabled?'Private inbox connected. Waiting for a verified cloud check.':'Daily imports are off; your normal progress sync remains active.';
    reconcileImports(uid);
  },denied));
  importUnsubscribers.push(onSnapshot(collection(db,'users',uid,'letterboxdReceipts'),{includeMetadataChanges:true},snapshot=>{
    if(activeUid!==uid||snapshot.metadata.fromCache)return;
    importReceipts=new Set(snapshot.docs.filter(d=>!d.metadata.hasPendingWrites).map(d=>d.id));receiptsReady=true;reconcileImports(uid);
  },denied));
  importUnsubscribers.push(onSnapshot(collection(db,'users',uid,'letterboxdImports'),{includeMetadataChanges:true},snapshot=>{
    if(activeUid!==uid||snapshot.metadata.fromCache)return;
    importInbox=snapshot.docs.filter(d=>!d.metadata.hasPendingWrites).map(d=>{const x=d.data();return {...x,id:d.id,date:x.watchedAt?.toDate?.().toISOString().slice(0,10)||''};});
    inboxReady=true;reconcileImports(uid);
  },denied));
  importUnsubscribers.push(onSnapshot(doc(db,'users',uid,'letterboxdStatus','latest'),snapshot=>{
    if(activeUid!==uid||!snapshot.exists())return;
    const at=snapshot.data().checkedAt?.toDate?.();
    if(at)importMessage.textContent=`Last cloud check: ${new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(at)} IST. Daily, not instant. ${importEnabled?'Inbox connected.':'Imports currently off.'}`;
  },denied));
}
importForm?.addEventListener('submit',async event=>{
  event.preventDefault();if(!activeUid||!ready){importMessage.textContent='Sign in and wait for normal progress sync first.';return;}
  const writerUid=document.querySelector('#letterboxdWriterUid').value.trim(),uid=activeUid;
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(writerUid)||writerUid===uid){importMessage.textContent='Enter the separate importer account’s UID, not your own UID or its password.';return;}
  const enabled=event.submitter?.value!=='disable';
  if(!confirm(enabled?'Allow this separate Firebase account to add Letterboxd metadata to your private import inbox? It cannot read your history, notes or study records.':'Disable this importer’s inbox access? Existing cards remain intact.'))return;
  try{await setDoc(doc(db,'users',uid,'integrations','letterboxd'),{writerUid,username:'saltinsea',enabled,schemaVersion:1});}
  catch{importMessage.textContent='Setup could not be saved. Verify the reviewed inbox rules are published; normal progress sync is unchanged.';}
});

function errorText(error){
  const code=String(error?.code||"");
  if(code.includes("invalid-credential"))return "Email or password is incorrect.";
  if(code.includes("email-already-in-use"))return "An account already uses that email. Sign in instead.";
  if(code.includes("weak-password"))return "Use a stronger password (at least 6 characters).";
  if(code.includes("network-request-failed")||code.includes("unavailable"))return "Network unavailable. Your work remains on this device.";
  if(code.includes("permission-denied"))return "Cloud access denied. The project rules must be published before syncing.";
  return code?`Cloud error: ${code}`:"Cloud connection failed.";
}

async function flush(){
  if(!ready||!activeUid||flushing||!navigator.onLine)return;
  flushing=true;
  try{
    while(activeUid && bridge.outbox(activeUid).length){
      const uid=activeUid;
      const event=bridge.outbox(uid)[0];
      bridge.status("Syncing…");
      await setDoc(doc(db,"users",uid,"events",event.id),{
        kind:event.kind,entityId:event.entityId,action:event.action,payload:event.payload,
        schemaVersion:1,createdAt:serverTimestamp()
      });
      bridge.acknowledge(uid,event.id);
      if(uid!==activeUid)break;
    }
    if(activeUid)bridge.status(bridge.outbox(activeUid).length?"Pending sync":"Synced");
  }catch(error){bridge.status(errorText(error));}
  finally{flushing=false;}
}

function startListening(user){
  if(unsubscribe)unsubscribe();
  stopImports();
  ready=false;
  const uid=user.uid,priorMarker=bridge.marker(),hadLocal=bridge.hasLocalProgress();
  activeUid=uid;
  startImports(uid);
  bridge.status("Connecting…");
  let first=true;
  unsubscribe=onSnapshot(collection(db,"users",uid,"events"),{includeMetadataChanges:true},snapshot=>{
    if(activeUid!==uid||snapshot.metadata.fromCache)return;
    const events=snapshot.docs.map(item=>({id:item.id,...item.data()})).filter(item=>item.createdAt);
    events.sort((a,b)=>a.createdAt.toMillis()-b.createdAt.toMillis()||a.id.localeCompare(b.id));
    if(first){
      first=false;
      if(events.length && priorMarker!==uid && hadLocal){
        if(!confirm("This account already has cloud progress. Merge this device's progress into it? Cancel keeps your local data and signs out, so you can export a backup first.")){
          signOut(auth);return;
        }
        bridge.queueCurrent(uid);
      }else if(!events.length && !bridge.outbox(uid).length){bridge.queueCurrent(uid);}
      bridge.activate(uid);
      ready=true;
    }
    bridge.applyRemote(uid,events);
    reconcileImports(uid);
    flush();
  },error=>{bridge.status(errorText(error));ready=false;});
}

onAuthStateChanged(auth,user=>{
  if(user){account.textContent=user.email||"Account";account.title="Signed in — click to sign out";startListening(user);}
  else{if(unsubscribe){unsubscribe();unsubscribe=null;}stopImports();activeUid=null;ready=false;bridge.deactivate();account.textContent="Sign in to sync";account.title="Sign in for phone/laptop sync";}
});

account.addEventListener("click",async()=>{
  if(auth.currentUser){if(confirm("Sign out of cloud sync on this device? Local progress stays here."))await signOut(auth);}
  else document.querySelector("#cloudDialog").showModal();
});
form.addEventListener("submit",async event=>{
  event.preventDefault();message.textContent="Connecting…";
  const submitter=event.submitter;
  try{
    if(submitter?.value==="create")await createUserWithEmailAndPassword(auth,email.value.trim(),password.value);
    else await signInWithEmailAndPassword(auth,email.value.trim(),password.value);
    password.value="";document.querySelector("#cloudDialog").close();message.textContent="";
  }catch(error){message.textContent=errorText(error);}
});
window.addEventListener("acting:outbox",flush);
window.addEventListener("online",flush);
window.addEventListener("online",()=>{if(activeUid)reconcileImports(activeUid);});
