const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M=require('../music-core.js');

function accountHarness({stored,blockedStorage=false,fetchResponse}={}) {
  const elements = new Map(), writes = [], requests = [], revoked = [];
  let now = 1000, oauth;
  const element = () => ({value:'',textContent:'',hidden:false,disabled:false,children:[],listeners:{},
    addEventListener(type,fn){this.listeners[type]=fn;},
    append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},
    get childElementCount(){return this.children.length;},
    requestSubmit(){this.submitted=true;},click(){this.clicked=true;},setAttribute(){},scrollIntoView(){}});
  const get = selector => {if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);};
  const google = {accounts:{oauth2:{initTokenClient(config){oauth=config;return {requestAccessToken(params){requests.push(params);}};},
    hasGrantedAllScopes(response,scope){return response.scope === scope;},revoke(token,cb){revoked.push(token);cb({successful:true});}}}};
  const context = {window:{google,ACTING_MUSIC:M,ACTING_MUSIC_PLAYER:{stop(){get('#musicStop').clicked=true;}}},google,document:{getElementById:id=>get('#'+id),querySelector:get,querySelectorAll:()=>[],createElement:element,createTextNode:text=>({textContent:text})},
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
  row.listeners.click(); await h.flush();
  assert.ok(h.requests.some(r=>r.url&&new URL(r.url).pathname.endsWith('/playlistItems')));
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
test('Source links reject lookalike hosts, injection and malformed IDs',()=>{
  assert.deepEqual(M.source('https://music.youtube.com/watch?v=abcdefghijk&list=PL_test'),{id:'abcdefghijk',list:'PL_test'});
  for(const link of ['javascript:alert(1)','https://youtube.com.evil.test/watch?v=abcdefghijk','http://youtu.be/abcdefghijk','https://youtu.be/bad','https://music.youtube.com/playlist?list=%22%3E'])assert.throws(()=>M.source(link));
  assert.equal(M.artwork('https://evil.test/image.jpg'),'');assert.equal(M.artwork('https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg'),'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
});
test('Queue ends, repeats one only on track end, and shuffle visits each track before repeating',()=>{
  const q=new M.Queue(), tracks=[{id:'a'},{id:'b'},{id:'c'}];q.load(tracks);assert.equal(q.next().id,'b');assert.equal(q.previous().id,'a');q.repeat='one';assert.equal(q.next(true).id,'a');assert.equal(q.next(false).id,'b');q.repeat='off';assert.equal(q.next().id,'c');assert.equal(q.next(),null);
  q.load(tracks);q.shuffle=true;assert.equal(q.next(false,()=>0).id,'b');assert.equal(q.next(false,()=>0).id,'c');assert.equal(q.next(),null);q.repeat='all';assert.ok(q.next());q.load([]);assert.equal(q.current(),null);assert.equal(q.next(),null);
});
test('Artwork palette ignores transparent pixels and track normalization rejects invalid videos',()=>{
  assert.deepEqual(M.palette([200,100,0,255,10,10,10,0]),[200,100,0]);assert.deepEqual(M.palette([]),[76,46,67]);assert.equal(M.time(125.9),'2:05');assert.equal(M.time(-1),'0:00');assert.equal(M.track({id:{videoId:'<script>'}}),null);
  assert.equal(M.track({snippet:{resourceId:{videoId:'abcdefghijk'},title:'A',videoOwnerChannelTitle:'B'}}).artist,'B');
});
test('Search uses music category and embeddable filter; late search is cleared on disconnect',async()=>{
  let resolveSearch;const h=accountHarness({fetchResponse:()=>h.requests.at(-1).url.includes('/search?')?new Promise(resolve=>{resolveSearch=resolve;}):{ok:true,status:200,json:async()=>({items:[]})}});await h.connect();h.oauth().callback({access_token:'synthetic-token',scope});await h.flush();h.get('#musicSearch').value='jazz';h.get('#musicSearchForm').listeners.submit({preventDefault(){}});await h.flush();const request=h.requests.find(r=>r.url?.includes('/search?'));const u=new URL(request.url);assert.equal(u.searchParams.get('videoCategoryId'),'10');assert.equal(u.searchParams.get('videoEmbeddable'),'true');h.get('#musicDisconnect').listeners.click();resolveSearch({ok:true,status:200,json:async()=>({items:[{id:{videoId:'abcdefghijk'},snippet:{title:'Private result'}}]})});await h.flush();assert.equal(h.get('#musicResults').childElementCount,0);assert.equal(h.writes.length,0);
});
function playerHarness(){
 const elements=new Map(),calls=[];let settings,visibility,roomChanged,scroll;
 const get=id=>{if(!elements.has(id))elements.set(id,{value:0,max:1,textContent:'',hidden:false,disabled:false,children:[],listeners:{},attrs:{},style:{setProperty(){}},classList:{toggle(name,on){this[name]=on;},remove(){}},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(key,value){this.attrs[key]=value;},removeAttribute(key){delete this.attrs[key];},append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},getBoundingClientRect(){return {bottom:200};},scrollIntoView(){}});return elements.get(id);};
 function Player(target,options){settings=options;for(const method of ['cueVideoById','loadVideoById','cuePlaylist','playVideo','pauseVideo','destroy','setShuffle','setLoop','seekTo','setVolume','nextVideo','previousVideo'])this[method]=(...args)=>calls.push([method,...args]);this.getPlaylist=()=>[];this.getPlaylistIndex=()=>0;this.getDuration=()=>200;this.getCurrentTime=()=>20;}
 const body={dataset:{room:'music'}},doc={body,hidden:false,getElementById:get,createElement:()=>get('created'),head:{append(){}},addEventListener(type,fn){if(type==='visibilitychange')visibility=fn;}};
 const win={ACTING_MUSIC:M,YT:{Player},addEventListener(type,fn){if(type==='scroll')scroll=fn;}},context={window:win,YT:win.YT,document:doc,location:{origin:'https://example.test',protocol:'https:'},Image:function(){},MutationObserver:function(fn){roomChanged=fn;this.observe=()=>{};},IntersectionObserver:function(){this.observe=()=>{};},setInterval(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../music-player.js'),'utf8'),context);
 return {get,calls,win,doc,ready(){settings.events.onReady();},event(state){settings.events.onStateChange({data:state});},scrollAbove(){get('musicVideoAnchor').getBoundingClientRect=()=>({bottom:-1});scroll();},leaveRoom(){body.dataset.room='study';roomChanged();},hide(){doc.hidden=true;visibility();},click:id=>get(id).listeners.click(),flush:()=>new Promise(resolve=>setImmediate(resolve))};
}
test('Custom controls cue safely, play/pause, advance tracks, seek and pause on leaving',async()=>{
 const h=playerHarness();h.win.ACTING_MUSIC_PLAYER.loadTracks([{id:'abcdefghijk',title:'A',artist:'Artist'},{id:'lmnopqrstuv',title:'B',artist:'Artist'}]);await h.flush();h.ready();assert.equal(h.get('musicToggle').disabled,true);const early=h.calls.length;h.click('musicToggle');assert.equal(h.calls.length,early);h.event(5);assert.equal(h.get('musicToggle').disabled,false);assert.equal(h.calls[0][0],'cueVideoById');assert.equal(h.get('musicTitle').textContent,'A');h.click('musicToggle');assert.equal(h.calls.at(-1)[0],'playVideo');h.event(1);h.click('musicToggle');assert.equal(h.calls.at(-1)[0],'pauseVideo');h.event(2);h.click('musicNext');await h.flush();assert.equal(h.calls.at(-1)[0],'cueVideoById');assert.equal(h.get('musicTitle').textContent,'B');h.click('musicRepeat');h.click('musicRepeat');h.event(0);await h.flush();assert.equal(h.calls.at(-1)[0],'loadVideoById');assert.equal(h.get('musicTitle').textContent,'B');h.get('musicSeek').value=45;h.get('musicSeek').listeners.change();assert.deepEqual(h.calls.at(-1),['seekTo',45,true]);h.leaveRoom();assert.equal(h.calls.at(-1)[0],'pauseVideo');h.hide();assert.equal(h.calls.at(-1)[0],'pauseVideo');h.win.ACTING_MUSIC_PLAYER.stop();assert.equal(h.calls.at(-1)[0],'destroy');assert.equal(h.get('musicToggle').disabled,true);
});
test('Clear before asynchronous startup prevents stale playback',async()=>{const h=playerHarness();h.win.ACTING_MUSIC_PLAYER.loadTracks([{id:'abcdefghijk',title:'A',artist:'B'}]);h.win.ACTING_MUSIC_PLAYER.stop();await h.flush();assert.equal(h.calls.length,0);assert.equal(h.get('musicTitle').textContent,'Choose your first record');});

test('Jumping to shelves floats the visible video; clearing removes the dock',async()=>{const h=playerHarness();h.win.ACTING_MUSIC_PLAYER.loadTracks([{id:'abcdefghijk',title:'A',artist:'B'}]);await h.flush();h.ready();h.scrollAbove();assert.equal(h.get('musicVideoDock').classList['music-floating'],true);h.leaveRoom();assert.equal(h.get('musicVideoDock').classList['music-floating'],false);});
