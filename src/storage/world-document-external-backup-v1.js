// A physical WorldDocument recovery copy, NOT a second runtime store.
// Caller supplies a directory selected by the author and a committed document.
// All validation and restoration remain the existing native serializer/importer.
import {serializeWorldBuilderDraft,importWorldBuilderDocument} from '../builder/world-builder-draft.js';

const DB='gensrpg-exploration-backup-preferences-v1';
const STORE='preferences';
const FOLDER='world-external-directory';
const safeName=value=>String(value).replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,68)||'monde';
const timestamp=now=>new Date(now).toISOString().replace(/[:.]/g,'-');

export async function selectWorldBackupDirectoryV1(root=globalThis){
 if(typeof root.showDirectoryPicker!=='function')
  throw new Error('Sélection de dossier externe non disponible dans ce navigateur. Utilise Exporter.');
 // Must be invoked directly from a user gesture. Never simulate permission.
 const directory=await root.showDirectoryPicker({mode:'readwrite',id:'gensrpg-world-backups'});
 if(directory?.kind!=='directory')throw new Error('Dossier de sauvegarde non sélectionné');
 return directory;
}
export async function worldBackupDirectoryPermissionV1(directory){
 if(directory?.kind!=='directory'||typeof directory.queryPermission!=='function')
  return 'unsupported';
 return directory.queryPermission({mode:'readwrite'});
}
export async function requestWorldBackupDirectoryPermissionV1(directory){
 if(directory?.kind!=='directory'||typeof directory.requestPermission!=='function')
  throw new Error('Réautorisation du dossier externe indisponible');
 return directory.requestPermission({mode:'readwrite'});
}
// Persist only an opaque, user-authorized handle. Never mirror world contents
// in this preferences DB. Clearing browser data drops the handle, not files.
export function createWorldBackupDirectoryPreferenceV1({indexedDBFactory=globalThis.indexedDB}={}){
 let opening;
 function open(){
  if(!indexedDBFactory?.open)return Promise.reject(new Error('Préférences de dossier indisponibles'));
  if(opening)return opening;
  opening=new Promise((resolve,reject)=>{
   const request=indexedDBFactory.open(DB,1);
   let blocked=false;
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);
   };
   request.onblocked=()=>{blocked=true;reject(Error('Préférences de sauvegarde bloquées'))};
   request.onerror=()=>reject(request.error??Error('Ouverture des préférences impossible'));
   request.onsuccess=()=>{
    const db=request.result;
    if(blocked){db.close();return;}
    db.onversionchange=()=>{db.close();opening=null;};
    resolve(db);
   };
  });
  opening.catch(()=>{opening=null;});
  return opening;
 }
 async function access(mode,command){
  const db=await open();
  return new Promise((resolve,reject)=>{
   let tx,answer;
   try{tx=db.transaction(STORE,mode);}catch(error){reject(error);return;}
   tx.oncomplete=()=>resolve(answer);
   tx.onabort=()=>reject(tx.error??Error('Préférences non enregistrées'));
   try{
    const request=command(tx.objectStore(STORE));
    request.onsuccess=()=>{answer=request.result};
   }catch(error){try{tx.abort();}catch{}reject(error);}
  });
 }
 return Object.freeze({
  async load(){return (await access('readonly',store=>store.get(FOLDER)))??null;},
  async remember(directory){
   if(directory?.kind!=='directory')throw TypeError('Dossier autorisé requis');
   await access('readwrite',store=>store.put(directory,FOLDER));
  },
  async forget(){await access('readwrite',store=>store.delete(FOLDER));}
 });
}
// Plain native .world.json: existing import accepts it without the backup DB.
// Append-only unique name preserves all previous copies, including on failure.
// The user can restore from an independent directory after a browser data purge.
export async function writeVerifiedWorldBackupV1({
 directory,document,now=Date.now(),makeId=()=>globalThis.crypto.randomUUID()
}={}){
 if(await worldBackupDirectoryPermissionV1(directory)!=='granted')
  throw new Error('Autorisation d’écriture du dossier requise. Réautorise-le dans Sauvegardes.');
 const serialized=serializeWorldBuilderDraft(document);
 const validated=importWorldBuilderDocument(serialized);
 if(serializeWorldBuilderDraft(validated)!==serialized)
  throw Error('Export WorldDocument non canonique');
 const nonce=String(makeId());
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(nonce))throw Error('Identifiant de copie généré invalide');
 const name=safeName(validated.id)+'-'+timestamp(now)+'-'+nonce+'.world.json';
 // Refuse even an improbable collision; never overwrite an existing backup.
 try{await directory.getFileHandle(name,{create:false});throw Error('Copie de secours déjà présente : aucun écrasement');}
 catch(error){if(error?.name!=='NotFoundError')throw error;}
 const handle=await directory.getFileHandle(name,{create:true});
 let writable;
 try{
  writable=await handle.createWritable({keepExistingData:false});
  await writable.write(serialized);
  await writable.close();
 }catch(error){
  if(writable)try{await writable.abort();}catch{}
  throw Error('Copie externe non confirmée : '+(error?.message??error));
 }
 const file=await handle.getFile();
 const reopened=await file.text();
 if(reopened!==serialized||serializeWorldBuilderDraft(importWorldBuilderDocument(reopened))!==serialized)
  throw Error('Relecture du fichier externe incohérente : anciennes copies conservées');
 return Object.freeze({name,worldId:validated.id,bytes:new TextEncoder().encode(serialized).byteLength});
}
// Reads the exact committed revision from the existing IndexedDB authority.
// A failed backup cannot roll back, rewrite or falsely acknowledge the draft.
export async function backupCommittedWorldDocumentV1({store,key,expectedRevision,directory,...options}={}){
 if(!store?.read||!Number.isSafeInteger(expectedRevision)||expectedRevision<1)
  throw TypeError('Révision WorldDocument sauvegardée requise');
 const row=await store.read(key);
 if(!row||row.revision!==expectedRevision)
  throw Error('Révision à sauvegarder modifiée : demande une copie de la dernière révision');
 const result=await writeVerifiedWorldBackupV1({...options,directory,document:row.document});
 return Object.freeze({...result,revision:row.revision});
}
