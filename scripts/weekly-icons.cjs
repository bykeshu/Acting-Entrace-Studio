/* Original mask-safe film/aperture/ticket marks. Rasterise our geometry, not third-party art. */
const zlib=require('node:zlib');
const rgb=h=>h.slice(1).match(/../g).map(n=>parseInt(n,16));
const crc=buffer=>{let c=0xffffffff;for(const b of buffer){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
function chunk(type,data){const label=Buffer.from(type),n=Buffer.alloc(4),end=Buffer.alloc(4);n.writeUInt32BE(data.length);end.writeUInt32BE(crc(Buffer.concat([label,data])));return Buffer.concat([n,label,data,end]);}
function colour(x,y,t){
 const dx=x-256,dy=y-256,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
 let c=t.stage;
 if(r<192)c=t.accent;
 if(t.layout==='specimen'){
  if(r<148)c=t.stage;
  if(r<110)c=t.accent;
  if(r<70)c=t.mark;
  if(r<29)c=t.panel;
 }else if(t.layout==='editorial'){
  if(x>109&&x<403&&y>152&&y<360)c=t.stage;
  if(x>127&&x<385&&y>179&&y<333)c=t.paper;
  if(Math.abs(x-256)<8&&y>152&&y<360)c=t.stage;
  if(x>209&&x<303&&y>224&&y<288)c=t.mark;
 }else if(t.layout==='ribbon'){
  if(x>135&&x<377&&y>167&&y<351)c=t.stage;
  if(x>157&&x<355&&y>188&&y<316)c=t.panel;
  if(x>157&&x<355&&y>128&&y<180&&Math.floor((x+y)/35)%2===0)c=t.stage;
  if(x>180&&x<333&&y>290&&y<316)c=t.mark;
 }else{
  const star=108+40*Math.cos(8*angle);
  if(r<star)c=t.stage;
  if(r<60)c=t.mark;
  if(r<23)c=t.panel;
 }
 return rgb(c);
}
function png(size,t){
 const rows=Buffer.alloc((size*3+1)*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const offset=y*(size*3+1)+1+x*3;
  const c=colour((x+.5)*512/size,(y+.5)*512/size,t);rows[offset]=c[0];rows[offset+1]=c[1];rows[offset+2]=c[2];
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
function svg(t){
 const art={specimen:`<circle cx="256" cy="256" r="148" fill="${t.stage}"/><circle cx="256" cy="256" r="110" fill="${t.accent}"/><circle cx="256" cy="256" r="70" fill="${t.mark}"/><circle cx="256" cy="256" r="29" fill="${t.panel}"/>`,editorial:`<path fill="${t.stage}" d="M109 152h294v208H109z"/><path fill="${t.paper}" d="M127 179h258v154H127z"/><path stroke="${t.stage}" stroke-width="16" d="M256 152v208"/><path fill="${t.mark}" d="M209 224h94v64h-94z"/>`,ribbon:`<path fill="${t.stage}" d="M135 167h242v184H135z"/><path fill="${t.panel}" d="M157 188h198v128H157z"/><path stroke="${t.stage}" stroke-width="28" d="m160 146 40 28m18-28 40 28m18-28 40 28"/><path fill="${t.mark}" d="M180 290h153v26H180z"/>`,collage:`<path fill="${t.stage}" d="m256 106 34 65 72-22-22 73 66 34-66 34 22 72-72-22-34 66-34-66-73 22 22-72-65-34 65-34-22-73 73 22z"/><circle cx="256" cy="256" r="60" fill="${t.mark}"/><circle cx="256" cy="256" r="23" fill="${t.panel}"/>`};
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Acting Studio weekly ${t.layout} cinema mark</title><path fill="${t.stage}" d="M0 0h512v512H0z"/><circle cx="256" cy="256" r="192" fill="${t.accent}"/>${art[t.layout]}</svg>\n`;
}
module.exports={png,svg};
