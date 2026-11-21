// Read-only ZIP sprite importer shared by Hero and NPC authoring.
// Does not write assets, add a cache, or alter the official MapActorRenderer.
const MAX_ZIP_BYTES=64*1024*1024;
const MAX_FRAME_BYTES=8*1024*1024;
const MAX_TOTAL_BYTES=64*1024*1024;
const MAGIC_PNG=[137,80,78,71,13,10,26,10];
const u16=(view,pos)=>{if(pos<0||pos+2>view.byteLength)throw new Error('Archive ZIP tronquée');return view.getUint16(pos,true);};
const u32=(view,pos)=>{if(pos<0||pos+4>view.byteLength)throw new Error('Archive ZIP tronquée');return view.getUint32(pos,true);};
const suffix=(path)=>path.split('/').pop();
function crc32(bytes){
 let result=0xffffffff;
 for(const byte of bytes){
  result^=byte;
  for(let bit=0;bit<8;bit++)result=(result>>>1)^((result&1)?0xedb88320:0);
 }
 return (result^0xffffffff)>>>0;
}
function safeName(name){
 if(!name||name.startsWith('/')||name.includes('\\')||name.includes('\0')||
    name.split('/').some(part=>part==='..'||part==='.'))
  throw new Error('Chemin non autorisé dans le ZIP');
 return name;
}
function assertMagic(content,mimeType){
 if(mimeType==='image/png'&&MAGIC_PNG.every((b,i)=>content[i]===b))return;
 if(mimeType==='image/webp'&&content.length>=12&&
  String.fromCharCode(...content.subarray(0,4))==='RIFF'&&
  String.fromCharCode(...content.subarray(8,12))==='WEBP')return;
 throw new Error('Fichier image corrompu ou format incorrect dans le ZIP');
}
async function uncompress(input,expectedSize){
 if(typeof DecompressionStream!=='function')
  throw new Error('Votre navigateur ne prend pas en charge les ZIP compressés');
 const stream=new Blob([input]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 const reader=stream.getReader(),chunks=[];
 let size=0;
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>expectedSize||size>MAX_FRAME_BYTES)throw new Error('ZIP décompressé trop volumineux');
   chunks.push(value);
  }
 }catch(error){await reader.cancel().catch(()=>{});throw error;}
 if(size!==expectedSize)throw new Error('Taille du sprite ZIP incohérente');
 const output=new Uint8Array(size);
 let offset=0;
 for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}
 return output;
}
/**
 * Extract PNG/WebP frames sorted naturally (frame_00, frame_01, ...).
 * Supports ordinary stored/deflated ZIP archives, with strict size, CRC and path checks.
 * Returns real File objects: the existing Hero/NPC image validators remain authoritative.
 */
export async function readActorAnimationZipV1(file,{exactFrames=6}={}){
 if(!(file instanceof Blob)||file.size<22||file.size>MAX_ZIP_BYTES||
    !/\.zip$/i.test(file.name??''))
  throw new RangeError('Choisis un ZIP valide de 64 Mo maximum');
 if(!Number.isInteger(exactFrames)||exactFrames<1||exactFrames>32)
  throw new RangeError('Nombre de frames attendu invalide');
 const raw=new Uint8Array(await file.arrayBuffer()),view=new DataView(raw.buffer);
 let end=-1;
 for(let p=raw.length-22;p>=Math.max(0,raw.length-65557);p--){
  if(u32(view,p)===0x06054b50&&p+22+u16(view,p+20)===raw.length){end=p;break;}
 }
 if(end<0||u16(view,end+4)!==0||u16(view,end+6)!==0||
    u16(view,end+8)!==u16(view,end+10))
  throw new Error('ZIP incomplet ou multivolume non accepté');
 const count=u16(view,end+10),centralSize=u32(view,end+12),centralOffset=u32(view,end+16);
 if(count<1||count>256||centralOffset+centralSize>end)
  throw new Error('Table des fichiers ZIP invalide');
 let cursor=centralOffset,total=0;
 const entries=[],names=new Set();
 for(let i=0;i<count;i++){
  if(u32(view,cursor)!==0x02014b50||cursor+46>centralOffset+centralSize)
   throw new Error('Entrée ZIP invalide');
  const flags=u16(view,cursor+8),method=u16(view,cursor+10);
  const crc=u32(view,cursor+16),packed=u32(view,cursor+20),unpacked=u32(view,cursor+24);
  const nameSize=u16(view,cursor+28),extraSize=u16(view,cursor+30),commentSize=u16(view,cursor+32);
  const localOffset=u32(view,cursor+42),next=cursor+46+nameSize+extraSize+commentSize;
  if(next>centralOffset+centralSize)throw new Error('Nom de fichier ZIP tronqué');
  const name=safeName(new TextDecoder('utf-8',{fatal:true}).decode(raw.subarray(cursor+46,cursor+46+nameSize)));
  cursor=next;
  if(name.endsWith('/')||name.startsWith('__MACOSX/'))continue;
  if(!/\.(png|webp)$/i.test(name))continue;
  if(flags&1||![0,8].includes(method)||unpacked<1||unpacked>MAX_FRAME_BYTES)
   throw new Error('Format ou taille du sprite ZIP non pris en charge : '+name);
  if(names.has(name.toLowerCase()))throw new Error('Nom de sprite répété : '+name);
  names.add(name.toLowerCase());
  total+=unpacked;
  if(total>MAX_TOTAL_BYTES)throw new Error('Images ZIP trop volumineuses');
  entries.push({name,flags,method,crc,packed,unpacked,localOffset});
 }
 if(cursor!==centralOffset+centralSize)throw new Error('Catalogue ZIP incomplet');
 if(entries.length!==exactFrames)
  throw new RangeError('Il faut exactement '+exactFrames+' images PNG/WebP par animation (ZIP : '+entries.length+')');
 entries.sort((a,b)=>a.name.localeCompare(b.name,'fr',{numeric:true,sensitivity:'base'}));
 const files=[];
 for(const entry of entries){
  const {name,flags,method,crc,packed,unpacked,localOffset}=entry;
  if(u32(view,localOffset)!==0x04034b50||u16(view,localOffset+8)!==method)
   throw new Error('Entête ZIP incompatible : '+name);
  const dataStart=localOffset+30+u16(view,localOffset+26)+u16(view,localOffset+28);
  if(dataStart+packed>centralOffset||dataStart<0)
   throw new Error('Données ZIP hors limites : '+name);
  const compressed=raw.subarray(dataStart,dataStart+packed);
  const bytes=method===0?compressed:await uncompress(compressed,unpacked);
  if(bytes.length!==unpacked||crc32(bytes)!==crc)
   throw new Error('Vérification CRC échouée : '+name);
  const mimeType=/\.png$/i.test(name)?'image/png':'image/webp';
  assertMagic(bytes,mimeType);
  files.push(new File([bytes],suffix(name),{type:mimeType}));
 }
 return Object.freeze(files);
}
