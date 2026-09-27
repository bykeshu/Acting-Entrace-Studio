'use strict';
const sax=require('sax'),{createHash}=require('node:crypto');
const core=require('../letterboxd-core.js');
const MAX_BYTES=2*1024*1024;
function parseFeed(xml,today){
  if(typeof xml!=='string'||Buffer.byteLength(xml)>MAX_BYTES||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('FEED_FORMAT');
  const parser=sax.parser(true,{xmlns:true,strictEntities:true}),stack=[],items=[];
  let item=null,field='',text='',rootSeen=false,channelURL='';
  const names=new Set(['filmTitle','filmYear','watchedDate','rewatch','memberRating']);
  parser.onopentag=n=>{
    stack.push(n.local);
    if(stack.length>20)throw Error('FEED_DEPTH');
    if(stack.length===1){if(n.local!=='rss')throw Error('FEED_FORMAT');rootSeen=true;}
    if(stack.join('/')==='rss/channel/item'){if(items.length>=100)throw Error('FEED_LIMIT');item={};}
    if(stack.join('/')==='rss/channel/link'&&!n.uri){field='channelURL';text='';}
    if(item&&stack.length===4&&((n.uri==='https://letterboxd.com'&&names.has(n.local))||(!n.uri&&['guid','link'].includes(n.local)))){
      field=n.local;text='';if(Object.hasOwn(item,field))throw Error('FEED_DUPLICATE_FIELD');
    }
  };
  const content=t=>{if(field){text+=t;if(text.length>4096)throw Error('FEED_FIELD_LIMIT');}};
  parser.ontext=content;parser.oncdata=content;
  parser.onclosetag=()=>{
    if(field&&stack.length===3&&field==='channelURL'){channelURL=text.trim();field='';}
    else if(item&&field&&stack.length===4){item[field]=text.trim();field='';}
    if(stack.join('/')==='rss/channel/item'){items.push(item);item=null;}
    stack.pop();
  };
  try{parser.write(xml).close();}catch{throw Error('FEED_FORMAT');}
  if(!rootSeen||channelURL!=='https://letterboxd.com/saltinsea/')throw Error('FEED_PROFILE');
  const unique=new Map();let skipped=0;
  for(const raw of items){
    if(!/^letterboxd-(watch|review)-[0-9]+$/.test(raw.guid||'')){skipped++;continue;}
    const link=raw.link||'',slug=link.match(/^https:\/\/letterboxd\.com\/saltinsea\/film\/([a-z0-9-]+)\/(?:[1-9][0-9]*\/)?$/)?.[1];
    if(!slug||!['Yes','No'].includes(raw.rewatch)){skipped++;continue;}
    const filmURL=`https://letterboxd.com/film/${slug}/`,watchedDate=raw.watchedDate||'';
    const id=createHash('sha256').update(`${filmURL}\n${watchedDate}`).digest('hex');
    const out={id,title:raw.filmTitle||'',year:raw.filmYear||'',date:watchedDate,filmURL,entryURL:link,
      rating:raw.memberRating?Number(raw.memberRating):null,rewatch:raw.rewatch==='Yes'};
    if(!core.valid(out,today)){skipped++;continue;}
    // A review and watched event for one calendar-day viewing are one card.
    if(!unique.has(id))unique.set(id,out);
  }
  return {entries:[...unique.values()],skipped};
}
module.exports={parseFeed,MAX_BYTES};
