import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

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
  ready=false;
  const uid=user.uid,priorMarker=bridge.marker(),hadLocal=bridge.hasLocalProgress();
  activeUid=uid;
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
    flush();
  },error=>{bridge.status(errorText(error));ready=false;});
}

onAuthStateChanged(auth,user=>{
  if(user){account.textContent=user.email||"Account";account.title="Signed in — click to sign out";startListening(user);}
  else{if(unsubscribe){unsubscribe();unsubscribe=null;}activeUid=null;ready=false;bridge.deactivate();account.textContent="Sign in to sync";account.title="Sign in for phone/laptop sync";}
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
