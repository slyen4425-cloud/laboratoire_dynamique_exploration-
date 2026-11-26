// Backend de remplacement du stockage WorldDocument (préparation, non branché).
// Le serializer/importer natif reste seul propriétaire du document.
import {serializeWorldBuilderDraft,importWorldBuilderDocument} from '../builder/world-builder-draft.js';
import {decodeWorldDocumentStorageV1} from './world-document-web-storage-codec-v1.js';

export const WORLD_DOCUMENT_DB_NAME='gensrpg-exploration-world-documents-v1';
export const WORLD_DOCUMENT_STORE_NAME='documents';
const DRAFT='gensrpg.world-assembler.document.v1';
const ARCHIVE='gensrpg.exploration.world-library.document.v1:';
const SCOPED=/^gensrpg\.exploration\.universe\.workspace\.v1:unv_[a-z0-9-]{8,80}:gensrpg\.world-assembler\.document\.v1$/;

function checkedKey(key){
 if(typeof key!=='string'||!(key===DRAFT||SCOPED.test(key)||key.startsWith(ARCHIVE)))
  throw new TypeError('Clé de WorldDocument non autorisée');
 if(key.startsWith(ARCHIVE)){
  const id=decodeURIComponent(key.slice(ARCHIVE.length));
  if(!id||ARCHIVE+encodeURIComponent(id)!==key)throw new TypeError('Clé archive non canonique');
 }
 return key;
}
function checkedBytes(key,raw){
 checkedKey(key);
 const document=importWorldBuilderDocument(raw);
 if(key.startsWith(ARCHIVE)&&ARCHIVE+encodeURIComponent(document.id)!==key)
  throw new Error('Identifiant de l’archive incompatible');
 return serializeWorldBuilderDraft(document);
}
export function prepareLegacyWorldDocumentV1(key,raw){
 if(typeof raw!=='string')throw new TypeError('Sauvegarde historique requise');
 return Object.freeze({key:checkedKey(key),serialized:checkedBytes(key,decodeWorldDocumentStorageV1(raw))});
}
// Snapshot only the existing WorldDocument keys, not gameplay saves, media,
 // presets, indexes or unrelated universes. Capture the raw bytes before
 // writing IndexedDB; never erase the legacy values here.
export function snapshotLegacyWorldDocumentsV1(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.key!=='function'||
    !Number.isSafeInteger(storage.length))throw new TypeError('Stockage historique requis');
 const entries=[];
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(typeof key!=='string'||!(key===DRAFT||SCOPED.test(key)||key.startsWith(ARCHIVE)))continue;
  const raw=storage.getItem(key);
  prepareLegacyWorldDocumentV1(key,raw);
  entries.push(Object.freeze({key,raw}));
 }
 if(new Set(entries.map(e=>e.key)).size!==entries.length)
  throw new Error('Stockage historique modifié pendant l’inventaire');
 return Object.freeze(entries.sort((a,b)=>a.key.localeCompare(b.key)));
}
function checkedRow(key,row){
 if(row===undefined)return null;
 if(!row||row.key!==key||!Number.isSafeInteger(row.revision)||row.revision<1||
  typeof row.serialized!=='string'||checkedBytes(key,row.serialized)!==row.serialized||
  (row.previous!==null&&(typeof row.previous!=='string'||checkedBytes(key,row.previous)!==row.previous)))
  throw new Error('WorldDocument IndexedDB illisible : conservation');
 return row;
}
function publicRow(row){
 return row?Object.freeze({key:row.key,revision:row.revision,
  document:importWorldBuilderDocument(row.serialized),
  previous:row.previous===null?null:importWorldBuilderDocument(row.previous)}):null;
}
export function createWorldDocumentIndexedDbStoreV1({indexedDBFactory=globalThis.indexedDB}={}){
 let opening;
 function open(){
  if(!indexedDBFactory?.open)return Promise.reject(new Error('IndexedDB WorldDocument indisponible'));
  if(opening)return opening;
  opening=new Promise((resolve,reject)=>{
   const request=indexedDBFactory.open(WORLD_DOCUMENT_DB_NAME,1);
   let blocked=false;
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains(WORLD_DOCUMENT_STORE_NAME))
     request.result.createObjectStore(WORLD_DOCUMENT_STORE_NAME,{keyPath:'key'});
   };
   request.onblocked=()=>{blocked=true;reject(new Error('IndexedDB WorldDocument bloqué par un autre onglet'));};
   request.onerror=()=>reject(request.error??new Error('Ouverture IndexedDB impossible'));
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
 async function transaction(mode,run){
  const db=await open();
  return new Promise((resolve,reject)=>{
   let tx,value,failure;
   try{tx=db.transaction(WORLD_DOCUMENT_STORE_NAME,mode);}
   catch(error){reject(error);return;}
   const fail=error=>{failure=error;try{tx.abort();}catch{reject(error);}};
   tx.oncomplete=()=>failure?reject(failure):resolve(value);
   tx.onabort=()=>reject(failure??tx.error??new Error('Transaction WorldDocument annulée'));
   tx.onerror=()=>{ /* default IndexedDB abort; no success before completion */ };
   try{run(tx.objectStore(WORLD_DOCUMENT_STORE_NAME),v=>{value=v;},fail);}
   catch(error){fail(error);}
  });
 }
 function batch(entries,migration){
  if(!Array.isArray(entries)||!entries.length)throw new TypeError('Lot WorldDocument non vide requis');
  const keys=new Set();
  const validated=entries.map(e=>{
   const key=checkedKey(e.key);
   if(keys.has(key))throw new Error('Clé WorldDocument en doublon dans le lot');
   keys.add(key);
   const serialized=checkedBytes(key,e.serialized);
   if(!migration&&e.expectedRevision!==null&&(!Number.isSafeInteger(e.expectedRevision)||e.expectedRevision<1))
    throw new TypeError('Révision attendue obligatoire (null pour création)');
   return {...e,key,serialized};
  });
  return transaction('readwrite',(store,done,fail)=>{
   const result=[];
   function next(i){
    if(i===validated.length){done(Object.freeze(result));return;}
    const entry=validated[i],req=store.get(entry.key);
    req.onsuccess=()=>{
     try{
      const old=checkedRow(entry.key,req.result);
      if(migration&&old){
       if(old.serialized!==entry.serialized)throw new Error('Conflit de migration : versions préservées');
       result.push(publicRow(old));next(i+1);return;
      }
      if(!migration&&(old?.revision??null)!==entry.expectedRevision)
       throw new Error('Conflit de révision WorldDocument : recharger avant de sauvegarder');
      if(old?.serialized===entry.serialized){result.push(publicRow(old));next(i+1);return;}
      const revision=(old?.revision??0)+1;
      if(!Number.isSafeInteger(revision))throw new Error('Révision WorldDocument hors limites');
      const row={key:entry.key,revision,serialized:entry.serialized,previous:old?.serialized??null};
      const put=store.put(row);
      put.onsuccess=()=>{
       const verify=store.get(entry.key);
       verify.onsuccess=()=>{
        try{
         const saved=checkedRow(entry.key,verify.result);
         if(!saved||saved.revision!==row.revision||saved.serialized!==row.serialized||saved.previous!==row.previous)
          throw new Error('Relecture transactionnelle WorldDocument incohérente');
         result.push(publicRow(saved));next(i+1);
        }catch(error){fail(error);}
       };
      };
     }catch(error){fail(error);}
    };
   }
   next(0);
  });
 }
 return Object.freeze({
  async read(key){
   checkedKey(key);
   return transaction('readonly',(store,done,fail)=>{
    const req=store.get(key);
    req.onsuccess=()=>{try{done(publicRow(checkedRow(key,req.result)));}catch(error){fail(error);}};
   });
  },
  async inventory(){
   // Metadata only: do not allocate all maps in the UI just to list them.
   return transaction('readonly',(store,done,fail)=>{
    const rows=[],request=store.openCursor();
    request.onsuccess=()=>{
     try{
      const cursor=request.result;
      if(!cursor){done(Object.freeze(rows));return;}
      const row=checkedRow(checkedKey(cursor.key),cursor.value);
      const document=importWorldBuilderDocument(row.serialized);
      rows.push(Object.freeze({key:row.key,revision:row.revision,id:document.id,areaCount:document.areas.length}));
      cursor.continue();
     }catch(error){fail(error);}
    };
   });
  },
  async migrateFromStorage(storage){
   const before=snapshotLegacyWorldDocumentsV1(storage);
   if(!before.length)return Object.freeze({count:0,sourceUnchanged:true});
   await batch(before.map(e=>prepareLegacyWorldDocumentV1(e.key,e.raw)),true);
   const after=snapshotLegacyWorldDocumentsV1(storage);
   // A changing legacy writer blocks cutover. Both copies are preserved,
   // and the caller MUST NOT activate until the old writer is fenced.
   const sourceUnchanged=after.length===before.length&&after.every((e,i)=>e.key===before[i].key&&e.raw===before[i].raw);
   return Object.freeze({count:before.length,sourceUnchanged});
  },
  async commit(entries){
   if(!Array.isArray(entries))throw new TypeError('Lot requis');
   return batch(entries.map(e=>({key:e.key,expectedRevision:e.expectedRevision,
    serialized:serializeWorldBuilderDraft(e.document)})),false);
  },
  // Migration explicite de copies validées, pas de suppression du Web Storage.
  // L'activation et le retrait de l'ancien écrivain appartiennent au raccord.
  async migrateLegacy(entries){
   if(!Array.isArray(entries))throw new TypeError('Lot historique requis');
   return batch(entries.map(e=>prepareLegacyWorldDocumentV1(e.key,e.raw)),true);
  }
 });
}
