// Portable copy of existing user asset records; never a new persistent owner.
// Restore is additive, idempotent and validates the complete input before any
// write. Separate IndexedDB databases cannot share one transaction: a failure
// can leave a verified subset, and a retry safely resumes without overwrite.
import {createUserMaterialRecord} from '../materials/user-material-library.js';
import {createUserWorldObjectRecord} from '../objects/user-object-library.js';
import {createUserMaterialStore} from '../storage/user-material-store.js';
import {createUserWorldObjectStore} from '../storage/user-world-object-store.js';
import {GRAPHIC_IMPORT_MAX_BYTES,GRAPHIC_IMPORT_MAX_DIMENSION,GRAPHIC_IMPORT_MAX_PIXELS} from './graphic-animation-v1.js';
export const GRAPHIC_LIBRARY_BACKUP_KIND='gensrpg-graphic-library-v1';
export const GRAPHIC_LIBRARY_BACKUP_MAX_BYTES=64*1024*1024;
const MAX_RECORDS=2048;
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const encode=bytes=>{let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);};
const decode=(s,bytes)=>{
 if(typeof s!=='string'||s.length!==4*Math.ceil(bytes/3)||!(/^[A-Za-z0-9+/]*={0,2}$/).test(s))throw Error('Encodage de ressource invalide.');
 const binary=atob(s);
 if(binary.length!==bytes)throw Error('Taille de ressource incohérente.');
 const result=Uint8Array.from(binary,c=>c.charCodeAt(0));
 if(encode(result)!==s)throw Error('Encodage de ressource non canonique.');
 return result;
};
function canonicalRecord(raw,type,blob){
 const prefix=type==='object'?'user.object.record.':'user.material.';
 if(typeof raw?.kind!=='string'||typeof raw?.id!=='string'||!raw.id.startsWith(prefix+raw.kind+'.'))throw Error('Identifiant de ressource invalide.');
 const idToken=raw.id.slice((prefix+raw.kind+'.').length);
 if(!/^[a-zA-Z0-9-]{1,160}$/.test(idToken)||!Number.isInteger(raw.bytes)||raw.bytes<1||raw.bytes>GRAPHIC_IMPORT_MAX_BYTES||
    !Number.isInteger(raw.width)||!Number.isInteger(raw.height)||raw.width>GRAPHIC_IMPORT_MAX_DIMENSION||raw.height>GRAPHIC_IMPORT_MAX_DIMENSION||
    raw.width*raw.height>GRAPHIC_IMPORT_MAX_PIXELS||blob.size!==raw.bytes||blob.type!==raw.mimeType)
   throw Error('Métadonnées de ressource invalides : '+raw.id);
 const factory=type==='object'?createUserWorldObjectRecord:createUserMaterialRecord;
 const record=factory({...raw,idToken,blob});
 if(record.id!==raw.id||record.assetId!==raw.assetId||(type==='object'&&record.definitionId!==raw.definitionId))
   throw Error('Identifiants de ressource incohérents : '+raw.id);
 if(type==='object'&&(!raw.baseSize||raw.baseSize.width!==record.baseSize.width||raw.baseSize.height!==record.baseSize.height))
   throw Error('Dimensions logiques incohérentes : '+raw.id);
 return record;
}
function metadata(record){const {blob,...meta}=record;return meta;}
function signature(record){return JSON.stringify(metadata(record));}
async function digest(blob,subtle){return hex(await subtle.digest('SHA-256',await blob.arrayBuffer()));}
const verifiedEqual=async(a,b,type,subtle)=>{
 if(!(a?.blob instanceof Blob))return false;
 const original=canonicalRecord(a,type,a.blob);
 return signature(original)===signature(b)&&await digest(original.blob,subtle)===await digest(b.blob,subtle);
};
async function validateImage(blob,meta){
 if(typeof createImageBitmap!=='function')throw Error('Décodage image indisponible.');
 const bitmap=await createImageBitmap(blob);
 try{if(bitmap.width!==meta.width||bitmap.height!==meta.height)throw Error('Dimensions de l’image différentes des métadonnées.');}
 finally{bitmap.close();}
}
export function createGraphicLibraryBackup({objectStore=createUserWorldObjectStore(),materialStore=createUserMaterialStore(),subtle=globalThis.crypto?.subtle,checkImage=validateImage}={}){
 const stores={object:objectStore,material:materialStore};
 function requireCrypto(){if(!subtle?.digest)throw Error('Vérification cryptographique indisponible.');}
 async function list(){
  const [objects,materials]=await Promise.all([objectStore.list(),materialStore.list()]);
  return [...objects.map(record=>({type:'object',record})),...materials.map(record=>({type:'material',record}))];
 }
 return Object.freeze({
  async counts(){const entries=await list();return Object.freeze({objects:entries.filter(e=>e.type==='object').length,materials:entries.filter(e=>e.type==='material').length});},
  async export(){
   requireCrypto();const entries=await list();
   if(entries.length>MAX_RECORDS||entries.reduce((sum,e)=>sum+Number(e.record.bytes),0)>GRAPHIC_LIBRARY_BACKUP_MAX_BYTES)
     throw Error('Bibliothèque trop volumineuse pour cette sauvegarde (64 Mio d’images).');
   const assets=[];
   for(const {type,record:raw} of entries){
    const record=canonicalRecord(raw,type,raw.blob);
    assets.push({type,meta:metadata(record),sha256:await digest(record.blob,subtle),data:encode(new Uint8Array(await record.blob.arrayBuffer()))});
   }
   return {kind:GRAPHIC_LIBRARY_BACKUP_KIND,version:1,assets};
  },
  async restore(raw){
   requireCrypto();
   if(typeof raw==='string'){
    if(raw.length>Math.ceil(GRAPHIC_LIBRARY_BACKUP_MAX_BYTES*4/3)+MAX_RECORDS*4096)throw Error('Fichier de sauvegarde trop volumineux.');
    raw=JSON.parse(raw);
   }
   if(raw?.kind!==GRAPHIC_LIBRARY_BACKUP_KIND||raw.version!==1||!Array.isArray(raw.assets)||raw.assets.length>MAX_RECORDS)
     throw Error('Format de sauvegarde graphique inconnu.');
   const prepared=[],ids=new Set();let total=0;
   // Preflight the entire package, including real image decoding and hashes.
   for(const entry of raw.assets){
    const {type,meta,data,sha256}=entry??{};
    if(!Object.hasOwn(stores,type)||!meta||!Number.isInteger(meta.bytes)||meta.bytes<1||meta.bytes>GRAPHIC_IMPORT_MAX_BYTES||
       !/^[a-f0-9]{64}$/.test(sha256??'')||ids.has(meta.id))throw Error('Entrée de sauvegarde invalide ou dupliquée.');
    total+=meta.bytes;if(total>GRAPHIC_LIBRARY_BACKUP_MAX_BYTES)throw Error('Sauvegarde trop volumineuse.');
    ids.add(meta.id);
    const blob=new Blob([decode(data,meta.bytes)],{type:meta.mimeType});
    const record=canonicalRecord(meta,type,blob);
    if(await digest(blob,subtle)!==sha256)throw Error('Empreinte différente : '+record.id);
    await checkImage(blob,record);
    const existing=await stores[type].get(record.id);
    if(existing&&!await verifiedEqual(existing,record,type,subtle))throw Error('Conflit local : '+record.id+' ; aucune ressource écrasée.');
    prepared.push({type,record});
   }
   let added=0,reused=0;
   try{
    for(const {type,record} of prepared){
     const store=stores[type];let existing=await store.get(record.id);
     if(!existing){
      try{await store.add(record);added++;}
      catch(error){if(error?.name!=='ConstraintError')throw error;reused++;}
      existing=await store.get(record.id);
     }else reused++;
     if(!await verifiedEqual(existing,record,type,subtle))throw Error('Conflit ou relecture impossible : '+record.id);
    }
   }catch(error){throw Error('Restauration interrompue après '+added+' ajout(s) ; aucun écrasement. Réessaie avec le même fichier. '+error.message);}
   return Object.freeze({added,reused});
  }
 });
}
