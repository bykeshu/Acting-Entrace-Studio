(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ACTING_MUSIC=api;})(globalThis,()=>{
  function source(value){const u=new URL(value);if(u.protocol!=='https:'||!['music.youtube.com','www.youtube.com','youtube.com','m.youtube.com','youtu.be'].includes(u.hostname))throw Error('Use an HTTPS YouTube song or playlist link.');const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v');const list=u.searchParams.get('list');if((id&&!/^[\w-]{11}$/.test(id))||(list&&!/^[\w-]{1,200}$/.test(list))||(!id&&!list))throw Error('Copy a song or playlist link using Share in YouTube Music.');return {id,list};}
  function artwork(url){try{const u=new URL(url);return u.protocol==='https:'&&/(^|\.)ytimg\.com$/.test(u.hostname)?u.href:'';}catch{return '';}}
  function track(item){const id=typeof item.id==='string'?item.id:item.id?.videoId||item.snippet?.resourceId?.videoId;if(!/^[\w-]{11}$/.test(id||''))return null;const s=item.snippet||{};const t=s.thumbnails||{};return {id,title:s.title||'YouTube track',artist:s.videoOwnerChannelTitle||s.channelTitle||'YouTube',art:artwork((t.maxres||t.high||t.medium||t.default)?.url||'')};}
  function time(seconds){seconds=Math.max(0,Math.floor(Number(seconds)||0));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
  function palette(pixels){let r=0,g=0,b=0,n=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<200)continue;r+=pixels[i];g+=pixels[i+1];b+=pixels[i+2];n++;}if(!n)return [76,46,67];return [r,g,b].map(v=>Math.round(v/n));}
  const moods = [
    {id:'podcasts',label:'Podcasts',query:'podcast conversations',podcast:true},
    {id:'sleep',label:'Sleep',query:'sleep music soft ambient'},
    {id:'relax',label:'Relax',query:'relaxing chill songs'},
    {id:'romance',label:'Romance',query:'romantic love songs'},
    {id:'energise',label:'Energise',query:'energetic upbeat songs'},
    {id:'party',label:'Party',query:'party dance songs'},
    {id:'sad',label:'Sad',query:'sad emotional songs'},
    {id:'feel-good',label:'Feel good',query:'feel good happy songs'},
    {id:'commute',label:'Commute',query:'commute road trip songs'},
    {id:'work-out',label:'Work out',query:'workout energetic songs'},
    {id:'focus',label:'Focus',query:'focus instrumental music'}
  ];
  function mixTracks(tracks,index=0){const selected=tracks[index];if(!selected)return [];const seen=new Set();return [selected,...tracks.slice(index+1),...tracks.slice(0,index)].filter(t=>{if(seen.has(t.id))return false;seen.add(t.id);return true;});}
  class Queue{
    constructor(){this.tracks=[];this.index=-1;this.shuffle=false;this.repeat='off';this.history=[];this.remaining=[];}
    load(tracks,index=0){this.tracks=tracks.slice();this.index=Math.min(Math.max(0,index),tracks.length-1);this.history=[];this.resetShuffle();}
    append(tracks){const seen=new Set(this.tracks.map(t=>t.id));for(const track of tracks){if(seen.has(track.id))continue;seen.add(track.id);this.remaining.push(this.tracks.length);this.tracks.push(track);}}
    resetShuffle(){this.remaining=this.tracks.map((_,i)=>i).filter(i=>i!==this.index);}
    next(ended=false,random=Math.random){if(!this.tracks.length)return null;if(ended&&this.repeat==='one')return this.current();let next;if(this.shuffle){if(!this.remaining.length){if(this.repeat!=='all')return null;this.resetShuffle();}next=this.remaining.length?this.remaining.splice(Math.floor(random()*this.remaining.length),1)[0]:this.index;}else{next=this.index+1;if(next>=this.tracks.length){if(this.repeat!=='all')return null;next=0;}}this.history.push(this.index);this.index=next;return this.current();}
    previous(){if(!this.tracks.length)return null;this.index=this.history.length?this.history.pop():Math.max(0,this.index-1);this.resetShuffle();return this.current();}
    current(){return this.tracks[this.index]||null;}
  }
  return {source,artwork,track,time,palette,moods,mixTracks,Queue};
});
