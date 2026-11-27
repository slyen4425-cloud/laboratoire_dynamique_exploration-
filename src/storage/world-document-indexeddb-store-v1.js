// Backend de remplacement du stockage WorldDocument (préparation, non branché).
// Le serializer/importer natif reste seul propriétaire du document.
import {serializeWorldBuilderDraft,importWorldBuilderDocument} from '../builder/world-builder-draft.js';
import {decodeWorldDocumentStorageV1} from './world-document-web-storage-codec-v1.js';
import {validateExplorationWorldLibraryIndexV1} from '../builder/exploration-world-document-library-v1.js';
import {validateExplorationUniverseWorldIndexV1} from '../builder/exploration-universe-world-projects-v1.js';

export const WORLD_DOCUMENT_DB_NAME='gensrpg-exploration-world-documents-v1';
export const WORLD_DOCUMENT_STORE_NAME='documents';
const DRAFT='gensrpg.world-assembler.document.v1';
const ARCHIVE='gensrpg.exploration.world-library.document.v1:';
const SCOPED=/^gensrpg\.exploration\.universe\.workspace\.v1:unv_[a-z0-9-]{8,80}:gensrpg\.world-assembler\.document\.v1$/;

const LIBRARY_INDEX='gensrpg.exploration.world-library.index.v1';
const PROJECT_INDEX='gensrpg.exploration.universe-worlds.index.v1';
const CUTOVER='gensrpg.exploration.world-document.cutover.v1';
const isMetadata=key=>key===LIBRARY_INDEX||key===PROJECT_INDEX||key===CUTOVER;
const isDocumentKey=key=>typeof key==='string'&&(key===DRAFT||SCOPED.test(key)||key.startsWith(ARCHIVE));
function checkedKey(key){
 if(!isDocumentKey(key)&&!isMetadata(key))
  throw new TypeError('Clé de WorldDocument non autorisée');
 if(key.startsWith(ARCHIVE)){
  const id=decodeURIComponent(key.slice(ARCHIVE.length));
  if(!id||ARCHIVE+encodeURIComponent(id)!==key)throw new TypeError('Clé archive non canonique');
 }
 return key;
}
function checkedBytes(key,raw){
 checkedKey(key);
 if(key===CUTOVER){
  const marker=JSON.parse(raw);
  if(marker?.schemaVersion!==1||!Array.isArray(marker.entries))throw Error('Marqueur de migration illisible');
  let previous=null;
  const entries=marker.entries.map(entry=>{
   if((!isDocumentKey(entry.key)&&entry.key!==LIBRARY_INDEX&&entry.key!==PROJECT_INDEX)||
      !/^[0-9a-f]{64}$/.test(entry.sha256)||previous!==null&&previous.localeCompare(entry.key)>=0)
    throw Error('Inventaire de migration illisible');
   previous=entry.key;return {key:checkedKey(entry.key),sha256:entry.sha256};
  });
  return JSON.stringify({schemaVersion:1,entries});
 }
 if(isMetadata(key)){
  const validator=key===LIBRARY_INDEX?validateExplorationWorldLibraryIndexV1:validateExplorationUniverseWorldIndexV1;
  return JSON.stringify(validator(JSON.parse(raw)));
 }
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
  (row.serialized===null?(!key.startsWith(ARCHIVE)||typeof row.previous!=='string'):
   (typeof row.serialized!=='string'||checkedBytes(key,row.serialized)!==row.serialized))||
  (row.previous!==null&&(typeof row.previous!=='string'||checkedBytes(key,row.previous)!==row.previous)))
  throw new Error('WorldDocument IndexedDB illisible : conservation');
 return row;
}
function publicRow(row){
 return row&&row.serialized!==null&&!isMetadata(row.key)?Object.freeze({key:row.key,revision:row.revision,
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
   if(isMetadata(key))throw Error('Métadonnées réservées aux commandes transactionnelles du propriétaire');
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
      if(old?.serialized===null)throw Error('Archive retirée : restauration explicite requise');
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
 // Execute the EXISTING native synchronous commands against a transaction-
 // private memory view. No actual Web Storage writes, no live cache. The
 // result is returned only when IndexedDB commits every touched key.
 function executeCommand(command){
  if(typeof command!=='function')throw TypeError('Commande WorldDocument requise');
  return transaction('readwrite',(store,done,fail)=>{
   const request=store.getAll();
   request.onsuccess=()=>{
    try{
     const before=new Map(request.result.map(r=>[checkedKey(r.key),checkedRow(r.key,r)]));
     const next=new Map([...before].filter(([,r])=>r.serialized!==null).map(([key,r])=>[key,r.serialized]));
     let open=true;
     const ensure=()=>{if(!open)throw Error('Transaction WorldDocument terminée');};
     const view=Object.freeze({
      get length(){ensure();return next.size;},
      key(i){ensure();return [...next.keys()][i]??null;},
      getItem(key){ensure();checkedKey(key);return next.get(key)??null;},
      setItem(key,value){
       ensure();checkedKey(key);
       if(before.get(key)?.serialized===null)throw Error('Archive retirée : restauration explicite requise');
       next.set(key,checkedBytes(key,isMetadata(key)?String(value):decodeWorldDocumentStorageV1(String(value))));
      },
      removeItem(key){ensure();checkedKey(key);if(!key.startsWith(ARCHIVE))throw Error('Retrait réservé à une archive explicite');next.delete(key);}
     });
     let result;
     try{result=command(view);if(result&&typeof result.then==='function')throw TypeError('Commande synchrone requise dans la transaction');}
     finally{open=false;}
     const changes=[];
     for(const key of new Set([...before.keys(),...next.keys()])){
      const old=before.get(key),value=next.get(key)??null;
      if((old?.serialized??null)===value)continue;
      const revision=(old?.revision??0)+1;
      if(!Number.isSafeInteger(revision))throw Error('Révision WorldDocument hors limites');
      changes.push({key,revision,serialized:value,previous:old?.serialized??null});
     }
     function put(i){
      if(i===changes.length){done(result);return;}
      const row=changes[i],request=store.put(row);
      request.onsuccess=()=>{
       const verify=store.get(row.key);
       verify.onsuccess=()=>{try{
        const actual=checkedRow(row.key,verify.result);
        if(actual.revision!==row.revision||actual.serialized!==row.serialized||actual.previous!==row.previous)
         throw Error('Relecture transactionnelle incohérente');
        put(i+1);
       }catch(e){fail(e);}};
      };
     }
     put(0);
    }catch(e){fail(e);}
   };
  });
 }
 function ownerSnapshot(storage){
  const entries=snapshotLegacyWorldDocumentsV1(storage).map(e=>({...e,serialized:prepareLegacyWorldDocumentV1(e.key,e.raw).serialized}));
  for(const key of [LIBRARY_INDEX,PROJECT_INDEX]){
   const raw=storage.getItem(key);
   if(raw!==null)entries.push({key,raw,serialized:checkedBytes(key,raw)});
  }
  return entries.sort((a,b)=>a.key.localeCompare(b.key));
 }
 async function sourceMarker(entries){
  if(!globalThis.crypto?.subtle)throw Error('Contexte sécurisé requis pour la migration WorldDocument');
  const encoder=new TextEncoder();
  const fingerprints=await Promise.all(entries.map(async entry=>({key:entry.key,
   sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(entry.raw))),b=>b.toString(16).padStart(2,'0')).join('')})));
  return checkedBytes(CUTOVER,JSON.stringify({schemaVersion:1,entries:fingerprints}));
 }
 async function readCutover(){
  return transaction('readonly',(store,done,fail)=>{
   const request=store.get(CUTOVER);
   request.onsuccess=()=>{try{done(checkedRow(CUTOVER,request.result)?.serialized??null);}catch(error){fail(error);}};
  });
 }
 async function verifyOwnerCutover(storage){
  const marker=await readCutover();
  if(marker===null)throw Error('Migration WorldDocument non confirmée');
  const actual=await sourceMarker(ownerSnapshot(storage));
  if(marker!==actual)throw Error('Stockage historique modifié après migration : versions conservées, accès bloqué');
  return true;
 }
 return Object.freeze({
  executeCommand,verifyOwnerCutover,
  // Atomic one-time migration plus a fingerprint of retained source bytes.
  // Reopening after editing the durable copy does NOT replay old documents.
  // An old tab that writes legacy bytes is detected, never silently imported.
  async prepareOwnerCutover(storage){
   const before=ownerSnapshot(storage),marker=await sourceMarker(before);
   await executeCommand(view=>{
    const existing=view.getItem(CUTOVER);
    if(existing!==null){if(existing!==marker)throw Error('Conflit de migration : versions conservées');return;}
    for(const entry of before){
     const value=view.getItem(entry.key);
     if(value!==null&&value!==entry.serialized)throw Error('Conflit de migration : versions conservées');
     if(value===null)view.setItem(entry.key,entry.serialized);
    }
    view.setItem(CUTOVER,marker);
   });
   await verifyOwnerCutover(storage);
   return Object.freeze({count:before.length,sourceUnchanged:true});
  },
  async migrateOwnerFromStorage(storage){
   const before=ownerSnapshot(storage);
   await executeCommand(view=>{
    for(const entry of before){
     const existing=view.getItem(entry.key);
     if(existing!==null&&existing!==entry.serialized)throw Error('Conflit de migration : versions préservées');
     if(existing===null)view.setItem(entry.key,entry.serialized);
    }
   });
   const after=ownerSnapshot(storage);
   return Object.freeze({count:before.length,sourceUnchanged:after.length===before.length&&after.every((e,i)=>e.key===before[i].key&&e.raw===before[i].raw)});
  },
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
      if(isMetadata(row.key)||row.serialized===null){cursor.continue();return;}
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
