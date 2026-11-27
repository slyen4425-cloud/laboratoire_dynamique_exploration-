import {createUserMaterialRecord} from '../materials/user-material-library.js';
import {createUserWorldObjectRecord} from '../objects/user-object-library.js';
import {createUserMaterialStore} from '../storage/user-material-store.js';
import {createUserWorldObjectStore} from '../storage/user-world-object-store.js';
import {normalizeGraphicAnimation} from './graphic-animation-v1.js';
import {listObjectLibraryFolders,resolveObjectLibraryFolder} from '../objects/object-library-taxonomy.js';
const hex=buffer=>Array.from(new Uint8Array(buffer),v=>v.toString(16).padStart(2,'0')).join('');
const sameBytes=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function semantic(r,type){
 return JSON.stringify([r.kind,r.mimeType,r.width,r.height,normalizeGraphicAnimation(r.animation,r.width,r.height),
  type==='object'?r.collisionRole:r.terrainFamilyId??null]);
}
// Existing stores are the only owners. Identity is generated from content
// and technical properties, not a name or presentation folder.
export function createGraphicLibraryImporter({materialStore=createUserMaterialStore(),objectStore=createUserWorldObjectStore(),subtle=globalThis.crypto?.subtle}={}){
 return Object.freeze({async save(prepared,{type,kind,label,folderId,collisionRole,terrainFamilyId}={}){
  if(type!=='material'&&type!=='object')throw Error('Type de ressource invalide.');
  if(!(prepared?.blob instanceof Blob)||prepared.blob.size!==prepared.bytes||prepared.blob.type!==prepared.mimeType)throw Error('Données de l’image incohérentes.');
  if(!subtle?.digest)throw Error('Empreinte sécurisée indisponible.');
  const store=type==='object'?objectStore:materialStore,factory=type==='object'?createUserWorldObjectRecord:createUserMaterialRecord;
  const folder=type==='object'?resolveObjectLibraryFolder(folderId):null;
  if(type==='object'&&(!folder||folder.defaultKind==='bridge'))throw Error('Dossier technique non pris en charge.');
  const input={...prepared,kind:folder?.defaultKind??kind,label,terrainFamilyId,collisionRole,categoryId:folder?.categoryId,folderId:folder?.id,folderLabel:folder?.label};
  const draft=factory({...input,idToken:'validation'});
  const signature=semantic(draft,type),data=new Uint8Array(await prepared.blob.arrayBuffer());
  const hash=hex(await subtle.digest('SHA-256',data));
  const idToken=hex(await subtle.digest('SHA-256',new TextEncoder().encode(hash+'|'+signature)));
  const candidate=factory({...input,idToken});
  const identical=async r=>r?.blob instanceof Blob&&r.blob.size===data.length&&semantic(r,type)===signature&&sameBytes(new Uint8Array(await r.blob.arrayBuffer()),data);
  for(const r of await store.list())if(await identical(r))return Object.freeze({record:r,reused:true});
  try{await store.add(candidate);}
  catch(error){
   if(error?.name!=='ConstraintError')throw error;
   const winner=await store.get(candidate.id);
   if(!await identical(winner))throw error;
   return Object.freeze({record:winner,reused:true});
  }
  const stored=await store.get(candidate.id);
  if(!await identical(stored))throw Error('Vérification de l’enregistrement impossible.');
  return Object.freeze({record:stored,reused:false});
 }});
}
export function graphicImportObjectFolders(){return listObjectLibraryFolders().filter(f=>f.defaultKind!=='bridge');}
