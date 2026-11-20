// Dedicated authoritative IndexedDB collection for authored NPC definitions.
// Hero records and WorldArea placements remain untouched.
import {validateUserNpcDefinitionV1} from '../actors/user-npc-definition-v1.js';
export const USER_NPC_DB_NAME='gensrpg-exploration-user-npcs-v1';
export const USER_NPC_STORE_NAME='npcs';
export function createUserNpcStoreV1({indexedDBFactory=typeof indexedDB==='undefined'?null:indexedDB}={}){
 if(!indexedDBFactory?.open)throw new Error('IndexedDB nécessaire pour enregistrer les PNJ');
 let database=null;
 function open(){
  if(database)return database;
  database=new Promise((resolve,reject)=>{
   const req=indexedDBFactory.open(USER_NPC_DB_NAME,1);
   req.onupgradeneeded=()=>{
    if(!req.result.objectStoreNames.contains(USER_NPC_STORE_NAME))
     req.result.createObjectStore(USER_NPC_STORE_NAME,{keyPath:'id'});
   };
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error??new Error('Échec ouverture PNJ'));
   req.onblocked=()=>reject(new Error('Base PNJ bloquée par un autre onglet'));
  });
  return database;
 }
 async function transaction(mode,operation){
  const db=await open();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(USER_NPC_STORE_NAME,mode);let result;
   tx.oncomplete=()=>resolve(result);
   tx.onerror=()=>reject(tx.error??new Error('Transaction PNJ impossible'));
   tx.onabort=()=>reject(tx.error??new Error('Transaction PNJ annulée'));
   try{
    const request=operation(tx.objectStore(USER_NPC_STORE_NAME));
    request.onsuccess=()=>{result=request.result;};
    request.onerror=()=>reject(request.error??new Error('Requête PNJ impossible'));
   }catch(error){tx.abort();reject(error);}
  });
 }
 return Object.freeze({
  async list(){
   const all=await transaction('readonly',s=>s.getAll());
   return Object.freeze((all??[]).map(validateUserNpcDefinitionV1)
    .sort((a,b)=>a.name.localeCompare(b.name,'fr')));
  },
  async get(id){
   if(typeof id!=='string')throw new TypeError('ID PNJ requis');
   const found=await transaction('readonly',s=>s.get(id));
   return found?validateUserNpcDefinitionV1(found):null;
  },
  async put(record){
   validateUserNpcDefinitionV1(record);
   await transaction('readwrite',s=>s.put(record));
   return record.id;
  }
  // Never automatically delete a definition referenced by existing maps.
 });
}
