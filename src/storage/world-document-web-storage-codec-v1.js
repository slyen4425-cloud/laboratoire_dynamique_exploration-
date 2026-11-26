// Lossless encoding of the EXISTING canonical WorldDocument JSON in browser
// Web Storage. This is not a new world format, model, archive or authority.
// Small/historical JSON remains byte-for-byte readable without migration.
export const WORLD_DOCUMENT_COMPRESSION_PREFIX_V1='gensrpg-world-lzw12-v1:';
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const DICTIONARY_SIZE=4096;

function encodeBytes(bytes){
 if(!bytes.length)return '';
 const entries=new Map();let next=256;
 let previous=String.fromCharCode(bytes[0]),out='';
 const write=word=>{
  const code=word.length===1?word.charCodeAt(0):entries.get(word);
  if(code===undefined)throw Error('Internal WorldDocument compression error');
  out+=ALPHABET[code>>6]+ALPHABET[code&63];
 };
 for(let i=1;i<bytes.length;i++){
  const ch=String.fromCharCode(bytes[i]),candidate=previous+ch;
  if(entries.has(candidate)){previous=candidate;continue;}
  write(previous);
  if(next<DICTIONARY_SIZE)entries.set(candidate,next++);
  previous=ch;
 }
 write(previous);
 return out;
}
function decodeBytes(packed){
 if(!packed||packed.length%2)throw Error('Document de monde compressé incomplet');
 const dict=new Array(DICTIONARY_SIZE);
 for(let i=0;i<256;i++)dict[i]=String.fromCharCode(i);
 let next=256;
 const codeAt=i=>{
  const hi=ALPHABET.indexOf(packed[i]),lo=ALPHABET.indexOf(packed[i+1]);
  if(hi<0||lo<0)throw Error('Code de stockage WorldDocument invalide');
  return (hi<<6)|lo;
 };
 const initial=codeAt(0);
 if(initial>255)throw Error('En-tête de monde compressé invalide');
 let previous=dict[initial],pieces=[previous],count=previous.length;
 for(let i=2;i<packed.length;i+=2){
  const code=codeAt(i);
  const value=dict[code]??(code===next?previous+previous[0]:null);
  if(value===null)throw Error('Document de monde compressé corrompu');
  pieces.push(value);count+=value.length;
  if(next<DICTIONARY_SIZE)dict[next++]=previous+value[0];
  previous=value;
 }
 const buffer=new Uint8Array(count);let offset=0;
 for(const part of pieces)for(let i=0;i<part.length;i++)buffer[offset++]=part.charCodeAt(i);
 return new TextDecoder('utf-8',{fatal:true}).decode(buffer);
}
export function decodeWorldDocumentStorageV1(raw){
 if(typeof raw!=='string')throw new TypeError('WorldDocument storage input must be text');
 if(!raw.startsWith(WORLD_DOCUMENT_COMPRESSION_PREFIX_V1))return raw;
 return decodeBytes(raw.slice(WORLD_DOCUMENT_COMPRESSION_PREFIX_V1.length));
}
export function encodeWorldDocumentStorageV1(serialized){
 if(typeof serialized!=='string')throw new TypeError('WorldDocument serialized data must be text');
 // Tiny worlds keep the original literal JSON to preserve all old consumers.
 if(serialized.length<16384)return serialized;
 const candidate=WORLD_DOCUMENT_COMPRESSION_PREFIX_V1+encodeBytes(new TextEncoder().encode(serialized));
 if(candidate.length>serialized.length*.9)return serialized;
 // Validate EVERY compressed write against the original bytes before touching
 // storage; no irreversible transition and no lossy simplification of terrain.
 if(decodeWorldDocumentStorageV1(candidate)!==serialized)
  throw Error('Compression WorldDocument non réversible : ancienne sauvegarde conservée');
 return candidate;
}
