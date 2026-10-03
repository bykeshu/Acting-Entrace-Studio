const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function accountHarness({stored,blockedStorage=false,fetchResponse}={}) {
  const elements = new Map(), writes = [], requests = [], revoked = [];
  let now = 1000, oauth;
  const element = () => ({value:'',textContent:'',hidden:false,disabled:false,children:[],listeners:{},
    addEventListener(type,fn){this.listeners[type]=fn;},
    append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},
    get childElementCount(){return this.children.length;},
    requestSubmit(){this.submitted=true;},click(){this.clicked=true;}});
  const get = selector => {if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);};
  const google = {accounts:{oauth2:{initTokenClient(config){oauth=config;return {requestAccessToken(params){requests.push(params);}};},
    hasGrantedAllScopes(response,scope){return response.scope === scope;},revoke(token,cb){revoked.push(token);cb({successful:true});}}}};
  const context = {window:{google},google,document:{querySelector:get,createElement:element,createTextNode:text=>({textContent:text})},
    localStorage:{getItem(){if(blockedStorage)throw Error('blocked');return stored;},setItem(key,value){writes.push([key,value]);}},
    location:{protocol:'https:'},Date:{now:()=>now},URL,URLSearchParams,
    fetch:async(url,options)=>{requests.push({url:String(url),options});return fetchResponse ? fetchResponse() : {ok:true,status:200,json:async()=>({items:[{id:'PL_example',snippet:{title:'<img onerror=alert(1)>'}}]})};}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../music-account.js'),'utf8'),context);
  return {get,writes,requests,revoked,oauth:()=>oauth,advance(ms){now+=ms;},
    connect:()=>get('#musicConnect').listeners.click(),flush:()=>new Promise(resolve=>setImmediate(resolve))};
}
const scope = 'https://www.googleapis.com/auth/youtube.readonly';
test('Google client is preconfigured on fresh devices and survives blocked storage',()=>{
  for(const blockedStorage of [false,true]){
    const h=accountHarness({blockedStorage});
    assert.match(h.get('#musicClientId').value,/^1085322780975-.*\.apps\.googleusercontent\.com$/);
    assert.equal(h.writes.length,0);
  }
  assert.equal(accountHarness({stored:'custom.apps.googleusercontent.com'}).get('#musicClientId').value,'custom.apps.googleusercontent.com');
});
test('Account connection requests read-only access and renders playlist titles as text without storing tokens',async()=>{
  const h=accountHarness();await h.connect();
  assert.equal(h.oauth().scope,scope);assert.equal(h.oauth().include_granted_scopes,false);
  h.oauth().callback({access_token:'synthetic-token',scope,expires_in:3600});await h.flush();
  const fetchRequest=h.requests.find(r=>r.url);
  assert.equal(new URL(fetchRequest.url).searchParams.get('mine'),'true');
  assert.equal(fetchRequest.options.credentials,'omit');
  const row=h.get('#musicPlaylists').children[0];
  assert.equal(row.children[0].textContent,'<img onerror=alert(1)>');
  row.children[1].listeners.click();
  assert.equal(h.get('#musicLink').value,'https://music.youtube.com/playlist?list=PL_example');
  assert.equal(h.get('#musicPlayerForm').submitted,true);
  assert.equal(h.writes.length,0);
  h.get('#musicDisconnect').listeners.click();
  assert.equal(h.get('#musicPlaylists').childElementCount,0);
  assert.equal(h.get('#musicStop').clicked,true);
  assert.deepEqual(h.revoked,['synthetic-token']);
});
test('Denied scope never fetches playlists and expired connections require reconnecting',async()=>{
  const denied=accountHarness();await denied.connect();
  denied.oauth().callback({access_token:'synthetic-token',scope:'unrelated'});
  assert.equal(denied.requests.filter(r=>r.url).length,0);
  assert.match(denied.get('#musicAccountStatus').textContent,/not granted/);
  const expired=accountHarness();await expired.connect();
  expired.oauth().callback({access_token:'synthetic-token',scope,expires_in:1});await expired.flush();
  expired.advance(2000);await expired.get('#musicMore').listeners.click();
  assert.match(expired.get('#musicAccountStatus').textContent,/expired/);
  assert.equal(expired.get('#musicPlaylists').childElementCount,0);
});
test('Disconnect ignores a late API response instead of restoring private playlists',async()=>{
  let resolveResponse;
  const h=accountHarness({fetchResponse:()=>new Promise(resolve=>{resolveResponse=resolve;})});
  await h.connect();h.oauth().callback({access_token:'synthetic-token',scope});
  h.get('#musicDisconnect').listeners.click();
  resolveResponse({ok:true,status:200,json:async()=>({items:[{id:'PL_example'}]})});await h.flush();
  assert.equal(h.get('#musicPlaylists').childElementCount,0);
  assert.match(h.get('#musicAccountStatus').textContent,/Disconnected/);
});
