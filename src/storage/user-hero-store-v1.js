// One isolated IndexedDB authority for authored hero definitions and image
// Blobs. WorldBuilder stores only refs; GenSRPG Core never writes these bytes.
import {validateUserHeroDefinitionV1} from '../actors/user-hero-definition-v1.js';

export const USER_HERO_DB_NAME='gensrpg-exploration-user-heroes-v1';
export const USER_HERO_STORE_NAME='heroes';
export const USER_HERO_DB_VERSION=1;

export function createUserHeroStoreV1({
 indexedDBFactory=typeof indexedDB==='undefined'?null:indexedDB
}={}){
 if(!indexedDBFactory?.open)throw new Error('IndexedDB required for persistent hero images');
 let dbPromise=null;
 function open(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
   const request=indexedDBFactory.open(USER_HERO_DB_NAME,USER_HERO_DB_VERSION);
   request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains(USER_HERO_STORE_NAME))
     db.createObjectStore(USER_HERO_STORE_NAME,{keyPath:'id'});
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error??new Error('Hero IndexedDB open failed'));
   request.onblocked=()=>reject(new Error('Hero IndexedDB blocked'));
  });
  return dbPromise;
 }
 async function transact(mode,createRequest){
  const db=await open();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(USER_HERO_STORE_NAME,mode);
   let value;
   tx.oncomplete=()=>resolve(value);
   tx.onerror=()=>reject(tx.error??new Error('Hero media transaction failed'));
   tx.onabort=()=>reject(tx.error??new Error('Hero media transaction aborted'));
   try{
    const req=createRequest(tx.objectStore(USER_HERO_STORE_NAME));
    req.onsuccess=()=>{value=req.result};
    req.onerror=()=>reject(req.error??new Error('Hero media request failed'));
   }catch(e){tx.abort();reject(e)}
  });
 }
 return Object.freeze({
  async list(){
   const rows=await transact('readonly',store=>store.getAll());
   return Object.freeze((rows??[]).map(validateUserHeroDefinitionV1)
    .sort((a,b)=>a.name.localeCompare(b.name,'fr')));
  },
  async get(id){
   if(typeof id!=='string')throw new TypeError('Hero definition id required');
   const row=await transact('readonly',store=>store.get(id));
   return row?validateUserHeroDefinitionV1(row):null;
  },
  async put(record){
   validateUserHeroDefinitionV1(record);
   await transact('readwrite',store=>store.put(record));
   return record.id;
  },
  async delete(id){
   const row=await this.get(id);
   if(row)await transact('readwrite',store=>store.delete(id));
   return Boolean(row);
  }
 });
}
