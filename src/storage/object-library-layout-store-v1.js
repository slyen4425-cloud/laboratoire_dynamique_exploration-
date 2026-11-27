import {normalizeObjectLibraryLayout} from '../objects/object-library-layout-v1.js';
// Metadata-only authority; do not upgrade the old V80 asset databases or
// store a second copy of any image. World backup can export this exact record.
export const OBJECT_LIBRARY_LAYOUT_DB='gensrpg-exploration-library-layout-v1';
export function createObjectLibraryLayoutStore({indexedDBFactory=globalThis.indexedDB}={}){
 let pending;
 const open=()=>{
  if(!indexedDBFactory?.open)return Promise.reject(Error('IndexedDB indisponible.'));
  if(!pending)pending=new Promise((resolve,reject)=>{
   const req=indexedDBFactory.open(OBJECT_LIBRARY_LAYOUT_DB,1);
   req.onupgradeneeded=()=>req.result.createObjectStore('layout');
   req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();pending=null;};resolve(db);};
   req.onerror=()=>reject(req.error??Error('Lecture du classement impossible.'));
   req.onblocked=()=>reject(Error('Stockage du classement bloqué.'));
  }).catch(error=>{pending=null;throw error;});
  return pending;
 };
 async function transact(mode,operation){
  const db=await open();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction('layout',mode),store=tx.objectStore('layout');
   let result,error;
   tx.oncomplete=()=>resolve(result);
   tx.onabort=()=>reject(error??tx.error??Error('Transaction annulée.'));
   tx.onerror=()=>reject(error??tx.error??Error('Transaction impossible.'));
   const req=store.get('objects');
   req.onsuccess=()=>{try{
    const raw=req.result??{revision:0,layout:normalizeObjectLibraryLayout()};
    if(!Number.isSafeInteger(raw.revision)||raw.revision<0)throw Error('Révision du classement invalide.');
    const current={revision:raw.revision,layout:normalizeObjectLibraryLayout(raw.layout)};
    result=operation(current,store);
   }catch(e){error=e;tx.abort();}};
  });
 }
 return Object.freeze({
  load:()=>transact('readonly',current=>current),
  save:(layout,expectedRevision)=>transact('readwrite',(current,store)=>{
   if(current.revision!==expectedRevision)throw Error('Classement modifié dans un autre onglet : recharge avant de modifier.');
   const next={revision:current.revision+1,layout:normalizeObjectLibraryLayout(layout)};
   store.put(next,'objects');return next;
  })
 });
}
