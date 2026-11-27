import {GRAPHIC_IMPORT_MAX_BYTES,GRAPHIC_IMPORT_MAX_FRAMES} from './graphic-animation-v1.js';
const types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'};
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
const crc=bytes=>{let n=0xffffffff;for(const v of bytes)n=(n>>>8)^table[(n^v)&255];return (n^0xffffffff)>>>0;};
const bad=()=>{throw Error('Archive ZIP invalide ou non prise en charge.');};
async function inflateLimited(bytes,expected){
 if(typeof DecompressionStream!=='function')throw Error('Décompression ZIP indisponible.');
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 const reader=stream.getReader(),out=new Uint8Array(expected);let offset=0;
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;
   if(offset+value.length>expected){await reader.cancel();bad();}
   out.set(value,offset);offset+=value.length;
  }
 }finally{reader.releaseLock();}
 if(offset!==expected)bad();return out;
}
// Only image frames, bounded compressed and decoded bytes, no filesystem
// extraction. Reject ZIP64, encryption, path traversal and ambiguous entries.
export async function unpackGraphicFrameZip(file,{inflate=inflateLimited}={}){
 if(!(file instanceof Blob)||file.size<22||file.size>GRAPHIC_IMPORT_MAX_BYTES)bad();
 const b=new Uint8Array(await file.arrayBuffer()),v=new DataView(b.buffer);
 const u16=i=>v.getUint16(i,true),u32=i=>v.getUint32(i,true);
 const text=new TextDecoder('utf-8',{fatal:true});
 let end=b.length-22;
 while(end>=Math.max(0,b.length-65557)){
  if(u32(end)===0x06054b50&&end+22+u16(end+20)===b.length)break;
  end--;
 }
 if(end<Math.max(0,b.length-65557)||u16(end+4)||u16(end+6)||u16(end+8)!==u16(end+10))bad();
 const count=u16(end+10),start=u32(end+16),size=u32(end+12);
 if(!count||count>GRAPHIC_IMPORT_MAX_FRAMES+32||start+size!==end)bad();
 let p=start,total=0;const names=new Set(),out=[];
 for(let i=0;i<count;i++){
  if(p+46>end||u32(p)!==0x02014b50)bad();
  const flags=u16(p+8),method=u16(p+10),sum=u32(p+16),packed=u32(p+20),length=u32(p+24);
  const n=u16(p+28),extra=u16(p+30),comment=u16(p+32),local=u32(p+42);
  if(p+46+n+extra+comment>end||(flags&1)||u16(p+34)||(method!==0&&method!==8))bad();
  const rawName=b.subarray(p+46,p+46+n),name=text.decode(rawName);
  p+=46+n+extra+comment;
  const parts=name.split('/');
  if(!name||name.includes('\\')||name.includes('\u0000')||name.startsWith('/')||
     parts.some((part,j)=>part==='.'||part==='..'||part.includes(':')||(!part&&j!==parts.length-1))||names.has(name.toLowerCase()))bad();
  names.add(name.toLowerCase());
  if(name.endsWith('/')){if(length||packed)bad();continue;}
  const type=types[name.split('.').at(-1)?.toLowerCase()];
  if(!type||!length||!packed||length>GRAPHIC_IMPORT_MAX_BYTES||out.length>=GRAPHIC_IMPORT_MAX_FRAMES)
   throw Error('Le ZIP doit contenir uniquement des images PNG, JPEG ou WebP (64 frames maximum).');
  total+=length;if(total>GRAPHIC_IMPORT_MAX_BYTES)throw Error('ZIP décompressé limité à 8 Mio.');
  if(local+30>start||u32(local)!==0x04034b50||u16(local+6)!==flags||u16(local+8)!==method)bad();
  const ln=u16(local+26),lx=u16(local+28),dataStart=local+30+ln+lx;
  if(dataStart+packed>start||ln!==n||!rawName.every((byte,j)=>byte===b[local+30+j]))bad();
  const compressed=b.subarray(dataStart,dataStart+packed);
  const raw=method===0?compressed:await inflate(compressed,length);
  if(raw.length!==length||crc(raw)!==sum)bad();
  const image=new Blob([raw],{type});Object.defineProperty(image,'name',{value:name});out.push(image);
 }
 if(p!==end||!out.length)bad();
 const sort=new Intl.Collator('fr',{numeric:true,sensitivity:'base'});
 return out.sort((a,b)=>sort.compare(a.name,b.name));
}
