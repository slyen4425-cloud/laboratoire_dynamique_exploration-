// Reproducible author-asset build: native Node only, no network or dependency.
// The original ZIP is never a browser resource. Reject unexpected layouts.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {inflateRawSync,deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const SOURCE='Genesis_textures_animees_eau_lave.zip';
const EXPECTED='cd1535c7211f80efb378f7ea57c68dab23c21c7d';
const names=['eau_bleue_profonde','eau_turquoise','eau_riviere','eau_marais','lave'];
export const FRAME_WIDTH=168,FRAME_HEIGHT=126,SOURCE_FRAME_COUNT=9,SUBFRAMES=4,FRAME_COUNT=SOURCE_FRAME_COUNT*SUBFRAMES,ATLAS_COLUMNS=6,ATLAS_ROWS=6;
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
function crc(b){let n=0xffffffff;for(const v of b)n=(n>>>8)^crcTable[(n^v)&255];return (n^0xffffffff)>>>0;}
function unzip(b){
 let p=b.length-22;while(p>=Math.max(0,b.length-65557)&&b.readUInt32LE(p)!==0x06054b50)p--;
 if(p<0||b.readUInt32LE(p)!==0x06054b50)throw Error('ZIP end absent');
 const count=b.readUInt16LE(p+10);p=b.readUInt32LE(p+16);const files=new Map();
 for(let i=0;i<count;i++){
  if(b.readUInt32LE(p)!==0x02014b50)throw Error('ZIP directory invalid');
  const method=b.readUInt16LE(p+10),sum=b.readUInt32LE(p+16),packed=b.readUInt32LE(p+20),size=b.readUInt32LE(p+24);
  const n=b.readUInt16LE(p+28),extra=b.readUInt16LE(p+30),comment=b.readUInt16LE(p+32),local=b.readUInt32LE(p+42);
  const name=b.toString('utf8',p+46,p+46+n);p+=46+n+extra+comment;
  if(!names.some(x=>name===x+'.gif')||files.has(name)||size>2_000_000||b.readUInt32LE(local)!==0x04034b50)throw Error('Unexpected ZIP entry '+name);
  const start=local+30+b.readUInt16LE(local+26)+b.readUInt16LE(local+28);
  const data=b.subarray(start,start+packed);
  const raw=method===0?data:method===8?inflateRawSync(data,{maxOutputLength:size}):null;
  if(!raw||raw.length!==size||crc(raw)!==sum)throw Error('ZIP CRC/size '+name);
  files.set(name,raw);
 }
 if(files.size!==names.length)throw Error('Incomplete author ZIP');return files;
}
function lzw(data,min,length){
 const clear=1<<min,end=clear+1,table=new Array(4096);let next,bits,prev=null,bit=0,out=0;
 const result=new Uint8Array(length);
 const reset=()=>{for(let i=0;i<clear;i++)table[i]=Uint8Array.of(i);next=end+1;bits=min+1;prev=null;};reset();
 while(bit+bits<=data.length*8){
  let code=0;for(let k=0;k<bits;k++,bit++)code|=((data[bit>>3]>>(bit&7))&1)<<k;
  if(code===clear){reset();continue;}if(code===end)break;
  let entry=code<next?table[code]:null;
  if(!entry&&code===next&&prev){entry=new Uint8Array(prev.length+1);entry.set(prev);entry[prev.length]=prev[0];}
  if(!entry||out+entry.length>length)throw Error('GIF LZW invalid');
  result.set(entry,out);out+=entry.length;
  if(prev&&next<4096){const a=new Uint8Array(prev.length+1);a.set(prev);a[prev.length]=entry[0];table[next++]=a;if(next===(1<<bits)&&bits<12)bits++;}
  prev=entry;
 }
 if(out!==length)throw Error('GIF incomplete frame '+out+'/'+length);return result;
}
function decodeGif(b){
 if(!/^GIF8[79]a$/.test(b.toString('ascii',0,6)))throw Error('Invalid GIF');
 const w=b.readUInt16LE(6),h=b.readUInt16LE(8);if(w>512||h>512||w<64||h<64)throw Error('GIF dimensions');
 let p=13;const palette=flag=>{const n=3*(2<<(flag&7)),a=b.subarray(p,p+n);p+=n;return a;};
 const global=b[10]&128?palette(b[10]):null,frames=[],transparentCounts=[];let transparentIndex=null;
 const blocks=()=>{const a=[];while(p<b.length){const n=b[p++];if(!n)return Buffer.concat(a);a.push(b.subarray(p,p+n));p+=n;}throw Error('GIF block truncated');};
 while(p<b.length){const tag=b[p++];if(tag===0x3b)break;if(tag===0x21){const label=b[p++],extension=blocks();if(label===0xf9&&extension.length===4)transparentIndex=extension[0]&1?extension[3]:null;continue;}if(tag!==0x2c)throw Error('GIF block '+tag);
  const x=b.readUInt16LE(p),y=b.readUInt16LE(p+2),fw=b.readUInt16LE(p+4),fh=b.readUInt16LE(p+6),flag=b[p+8];p+=9;
  if(x||y||fw!==w||fh!==h||(flag&64))throw Error('Only complete non-interlaced approved frames accepted');
  const colors=flag&128?palette(flag):global;if(!colors)throw Error('GIF palette absent');
  const min=b[p++],indices=lzw(blocks(),min,w*h),rgb=Buffer.alloc(w*h*3);
  for(let i=0;i<indices.length;i++){const c=indices[i]*3;rgb[i*3]=colors[c];rgb[i*3+1]=colors[c+1];rgb[i*3+2]=colors[c+2];}
  transparentCounts.push(transparentIndex===null?0:indices.reduce((n,v)=>n+(v===transparentIndex?1:0),0));transparentIndex=null;
  frames.push(rgb);
 }
 if(frames.length!==SOURCE_FRAME_COUNT)throw Error('Expected nine author frames');return {w,h,frames,transparentCounts};
}
function tile(rgb,sw,sh){
 const w=FRAME_WIDTH,h=FRAME_HEIGHT,out=Buffer.alloc(w*h*3);
 // Downsample the approved art, then correct opposing edge offsets
 // continuously over the entire frame; no mirrored border strip.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sx=(x+.5)*sw/w-.5,sy=(y+.5)*sh/h-.5,x0=Math.floor(sx),y0=Math.floor(sy),a=sx-x0,b=sy-y0;
  for(let c=0;c<3;c++){const at=(u,v)=>rgb[(Math.min(sh-1,v)*sw+Math.min(sw-1,u))*3+c];
   out[(y*w+x)*3+c]=Math.round((1-b)*((1-a)*at(x0,y0)+a*at(x0+1,y0))+b*((1-a)*at(x0,y0+1)+a*at(x0+1,y0+1)));}
 }
 return sealTile(out,w,h);
}
// Make opposing edges continuous by distributing the colour offset over
// the entire frame, not by mirroring a narrow rectangular border strip.
// Retain local texture detail and avoid a repeated strip with zero motion.
export function sealTile(out,w,h){
 if(w<2||h<2)return out;
 const values=Float64Array.from(out);
 for(let y=0;y<h;y++)for(let c=0;c<3;c++){
  const a=(y*w)*3+c,b=(y*w+w-1)*3+c;
  const delta=values[b]-values[a];
  for(let x=0;x<w;x++)values[(y*w+x)*3+c]-=delta*(x/(w-1)-.5);
 }
 for(let x=0;x<w;x++)for(let c=0;c<3;c++){
  const a=x*3+c,b=((h-1)*w+x)*3+c;
  const delta=values[b]-values[a];
  for(let y=0;y<h;y++)values[(y*w+x)*3+c]-=delta*(y/(h-1)-.5);
 }
 for(let i=0;i<out.length;i++)out[i]=Math.max(0,Math.min(255,Math.round(values[i])));
 // Exact equality despite floating point rounding at a half-integer.
 for(let y=0;y<h;y++)out.copy(out,(y*w+w-1)*3,y*w*3,y*w*3+3);
 out.copy(out,(h-1)*w*3,0,w*3);
 return out;
}
// Deterministic, local block flow with bilinear sampling. Preserve all nine
// approved keyframes; only the three between each pair are synthesized.
// No optical-flow dependency or runtime procedural animation.
const wrap=(v,n)=>((v%n)+n)%n;
function motionField(a,b,w,h){
 const step=12,cols=Math.ceil(w/step),rows=Math.ceil(h/step),field=[];
 const luminance=(buf,x,y)=>{const i=(wrap(y,h)*w+wrap(x,w))*3;return (buf[i]*2+buf[i+1]*4+buf[i+2])/7;};
 for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
  const x=gx*step+step/2,y=gy*step+step/2;
  let best=Infinity,dx=0,dy=0;
  for(let v=-5;v<=5;v++)for(let u=-5;u<=5;u++){
   let cost=(Math.abs(u)+Math.abs(v))*2;
   for(let j=-6;j<=6;j+=3)for(let i=-6;i<=6;i+=3){
    const delta=luminance(a,x+i,y+j)-luminance(b,x+i+u,y+j+v);
    cost+=Math.abs(delta);
   }
   if(cost<best){best=cost;dx=u;dy=v;}
  }
  field.push([dx,dy]);
 }
 return {field,step,cols,rows};
}
function flowAt({field,step,cols,rows},x,y,c){
 const u=x/step-.5,v=y/step-.5,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;
 const get=(p,q)=>field[wrap(q,rows)*cols+wrap(p,cols)][c];
 return (1-b)*((1-a)*get(i,j)+a*get(i+1,j))+b*((1-a)*get(i,j+1)+a*get(i+1,j+1));
}
function sample(buf,w,h,x,y,c){
 const i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j;
 const get=(p,q)=>buf[(wrap(q,h)*w+wrap(p,w))*3+c];
 return (1-b)*((1-a)*get(i,j)+a*get(i+1,j))+b*((1-a)*get(i,j+1)+a*get(i+1,j+1));
}
export function interpolateSurfaceLoop(keyframes,w=FRAME_WIDTH,h=FRAME_HEIGHT){
 if(keyframes.length!==SOURCE_FRAME_COUNT||keyframes.some(f=>f.length!==w*h*3)||w<24||h<24)throw Error('Invalid surface keyframes');
 const result=[];
 for(let k=0;k<keyframes.length;k++){
  const a=keyframes[k],b=keyframes[(k+1)%keyframes.length];
  const forward=motionField(a,b,w,h),backward=motionField(b,a,w,h);
  result.push(a);
  for(let n=1;n<SUBFRAMES;n++){
   const t=n/SUBFRAMES,out=Buffer.alloc(w*h*3);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const ax=x-t*flowAt(forward,x,y,0),ay=y-t*flowAt(forward,x,y,1);
    const bx=x-(1-t)*flowAt(backward,x,y,0),by=y-(1-t)*flowAt(backward,x,y,1);
    for(let c=0;c<3;c++)out[(y*w+x)*3+c]=Math.round((1-t)*sample(a,w,h,ax,ay,c)+t*sample(b,w,h,bx,by,c));
   }
   result.push(sealTile(out,w,h));
  }
 }
 return result;
}
function pngChunk(name,data){const type=Buffer.from(name),header=Buffer.alloc(4),tail=Buffer.alloc(4);header.writeUInt32BE(data.length);tail.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([header,type,data,tail]);}
// Diagnostic only: detect fixed straight-line contrast across all frames,
// and report transparency that the existing RGB decoder currently ignores.
// No threshold used as proof of aesthetic quality, no pixels changed.
function auditGrid(frames,w,h){
 const axis=horizontal=>{
  const n=horizontal?w:h,m=horizontal?h:w,energy=Array(n).fill(0),signed=Array(n).fill(0);
  for(const buf of frames)for(let p=0;p<n;p++)for(let q=0;q<m;q++){
   const idx=(horizontal?q*w+p:p*w+q)*3,prev=(horizontal?q*w+(p+n-1)%n:((p+n-1)%n)*w+q)*3;
   let d=0;for(let c=0;c<3;c++)d+=buf[idx+c]-buf[prev+c];
   energy[p]+=Math.abs(d/3);signed[p]+=d/3;
  }
  const denom=frames.length*m;const avg=energy.map(v=>v/denom),mean=avg.reduce((a,b)=>a+b,0)/n;
  const top=avg.map((v,i)=>({at:i,contrast:+v.toFixed(2),signed:+(signed[i]/denom).toFixed(2)})).sort((a,b)=>b.contrast-a.contrast).slice(0,12);
  const periodic=[];
  for(let step=4;step<=Math.floor(n/3);step++)if(n%step===0){
   let max=0,phase=0;for(let offset=0;offset<step;offset++){let sum=0;for(let i=offset;i<n;i+=step)sum+=avg[i];const score=sum/(n/step);if(score>max){max=score;phase=offset;}}
   periodic.push({step,phase,ratio:+(max/Math.max(mean,.001)).toFixed(2)});
  }
  return {mean:+mean.toFixed(2),edge:avg[0],top,periodic:periodic.sort((a,b)=>b.ratio-a.ratio).slice(0,6)};
 };
 return {x:axis(true),y:axis(false)};
}
function atlas(gif,name){
 const {w:sw,h:sh,frames,transparentCounts}=decodeGif(gif),w=FRAME_WIDTH*ATLAS_COLUMNS,h=FRAME_HEIGHT*ATLAS_ROWS,stride=w*3+1,raw=Buffer.alloc(stride*h);
 const loop=interpolateSurfaceLoop(frames.map(frame=>tile(frame,sw,sh)));
 console.log('WATER GRID SOURCE AUDIT '+JSON.stringify({name,source:[sw,sh],transparentCounts,raw:auditGrid(frames,sw,sh),atlas:auditGrid(loop,FRAME_WIDTH,FRAME_HEIGHT)}));
 for(let i=0;i<loop.length;i++){const img=loop[i],x=(i%ATLAS_COLUMNS)*FRAME_WIDTH,y=Math.floor(i/ATLAS_COLUMNS)*FRAME_HEIGHT;
  for(let j=0;j<FRAME_HEIGHT;j++)img.copy(raw,(y+j)*stride+1+x*3,j*FRAME_WIDTH*3,(j+1)*FRAME_WIDTH*3);}
 // PNG Sub filter, deterministic lossless RGB.
 for(let y=0;y<h;y++){const base=y*stride;raw[base]=1;for(let x=w*3;x>3;x--)raw[base+x]=(raw[base+x]-raw[base+x-3])&255;}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',ihdr),pngChunk('IDAT',deflateSync(raw,{level:9})),pngChunk('IEND',Buffer.alloc(0))]);
}
export function buildLivingWaterAtlases(root=process.cwd()){
 const dir=join(root,'assets/exploration/materials/forest/water/animated');
 const source=join(root,SOURCE);
 if(!existsSync(source)){
  if(names.every(n=>{const p=join(dir,n+'.png');if(!existsSync(p))return false;const b=readFileSync(p);return b.length>=24&&b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))&&b.readUInt32BE(16)===FRAME_WIDTH*ATLAS_COLUMNS&&b.readUInt32BE(20)===FRAME_HEIGHT*ATLAS_ROWS;}))return null;
  throw Error('Missing approved source ZIP and built water atlases');
 }
 const zip=readFileSync(source),sha=createHash('sha1').update('blob '+zip.length+'\0').update(zip).digest('hex');
 if(sha!==EXPECTED)throw Error('Water author ZIP revision mismatch '+sha);
 const entries=unzip(zip);mkdirSync(dir,{recursive:true});const sizes={};
 for(const name of names){const data=atlas(entries.get(name+'.gif'),name);writeFileSync(join(dir,name+'.png'),data);sizes[name]=data.length;}
 const total=Object.values(sizes).reduce((a,b)=>a+b,0);
 if(total>6*1024*1024)throw Error('Water atlas budget exceeded '+total);
 console.log('LIVING WATER ATLAS BUILD '+JSON.stringify({sourceSha:sha,sourceFrames:SOURCE_FRAME_COUNT*names.length,frames:FRAME_COUNT*names.length,dimensions:[FRAME_WIDTH*ATLAS_COLUMNS,FRAME_HEIGHT*ATLAS_ROWS],bytes:total,sizes}));return {total,sizes};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))buildLivingWaterAtlases(resolve(process.argv[2]??'.'));
