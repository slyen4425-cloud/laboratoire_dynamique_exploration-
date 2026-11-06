// Official Exploration WorldDocument archive. World Builder continues to
// own its one editable draft. Every archived document uses the same official
// WorldDocument serializer and importer, without an alternate world graph.
import {serializeWorldBuilderDraft,importWorldBuilderDocument}
 from './world-builder-draft.js';
import {readWorldAssemblerDraft,saveWorldAssemblerDraft}
 from './world-assembler-handoff.js';

export const EXPLORATION_WORLD_LIBRARY_INDEX_V1=
 'gensrpg.exploration.world-library.index.v1';
export const EXPLORATION_WORLD_LIBRARY_SLOT_V1=
 'gensrpg.exploration.world-library.document.v1:';
const SCHEMA='gensrpg.exploration.world-library.index.v1';
function id(value){
 if(typeof value!=='string'||!value.trim()||value.length>130||
    /[\u0000-\u001f\u007f]/.test(value))
  throw new TypeError('Identifiant de WorldDocument officiel invalide');
 return value;
}
function slotKey(value){return EXPLORATION_WORLD_LIBRARY_SLOT_V1+encodeURIComponent(id(value));}
function indexShape(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||
    Object.keys(value).length!==3||
    value.schema!==SCHEMA||value.version!==1||
    !Array.isArray(value.worldIds)||value.worldIds.some(x=>{
     try{return id(x)!==x;}catch{return true;}
    })||
    value.worldIds.length!==new Set(value.worldIds).size)
  throw new Error('Index de bibliothèque de mondes corrompu : sauvegardes préservées');
 return value;
}
export function createExplorationWorldDocumentLibraryV1({storage}={}){
 if(!storage||typeof storage.getItem!=='function'||
    typeof storage.setItem!=='function')
  throw new TypeError('Stockage local officiel World Builder requis');
 function index(){
  const content=storage.getItem(EXPLORATION_WORLD_LIBRARY_INDEX_V1);
  if(content===null)return {schema:SCHEMA,version:1,worldIds:[]};
  try{return indexShape(JSON.parse(content));}
  catch(error){throw new Error('Index de mondes invalide ou corrompu : '+error.message);}
 }
 function ids(){
  const values=new Set(index().worldIds);
  // When the document write succeeds but the index write fails, its exact
  // unchanged bytes remain recoverable from the official archive key.
  if(Number.isSafeInteger(storage.length)&&typeof storage.key==='function'){
   for(let n=0;n<storage.length;n++){
    const k=storage.key(n);
    if(typeof k!=='string'||!k.startsWith(EXPLORATION_WORLD_LIBRARY_SLOT_V1))continue;
    let key;
    try{key=decodeURIComponent(k.slice(EXPLORATION_WORLD_LIBRARY_SLOT_V1.length));}
    catch{throw new Error('Clé de WorldDocument archive illisible');}
    if(slotKey(key)!==k)throw new Error('Clé de WorldDocument archive incompatible');
    values.add(key);
   }
  }
  return [...values];
 }
 function load(worldId){
  const key=slotKey(worldId);
  if(!ids().includes(worldId))throw new Error('WorldDocument absent de la bibliothèque');
  const serialized=storage.getItem(key);
  if(typeof serialized!=='string')throw new Error('WorldDocument archivé manquant, sans récupération destructive');
  let document;
  try{document=importWorldBuilderDocument(serialized);}
  catch(error){throw new Error('Document du monde corrompu : '+error.message);}
  if(document.id!==worldId)throw new Error('Identifiant du monde archivé incompatible');
  return document;
 }
 function list(){
  return Object.freeze(ids().map(worldId=>{
   const world=load(worldId);
   return Object.freeze({id:world.id,areaCount:world.areas.length,
    initialAreaId:world.initialAreaId});
  }));
 }
 function save(document,{replace=false}={}){
  // The existing World Builder owns syntax, areas, portals, encounters and
  // dimensions. Do not try to normalize it in an unrelated second codec.
  const serialized=serializeWorldBuilderDraft(document);
  const verified=importWorldBuilderDocument(serialized);
  const worldId=id(verified.id),key=slotKey(worldId);
  const existing=storage.getItem(key);
  if(existing!==null&&existing!==serialized&&replace!==true)
   throw new Error('Ce monde existe déjà : confirmation nécessaire pour remplacer sa version archivée');
  if(existing!==serialized)storage.setItem(key,serialized);
  const known=ids();
  if(!known.includes(worldId))
   throw new Error('Enregistrement du monde non retrouvé après sauvegarde');
  const current=index();
  if(!current.worldIds.includes(worldId))
   storage.setItem(EXPLORATION_WORLD_LIBRARY_INDEX_V1,JSON.stringify({
    schema:SCHEMA,version:1,worldIds:[...current.worldIds,worldId]
   }));
  return Object.freeze({id:worldId,areaCount:verified.areas.length});
 }
 function activate(worldId){
  const selected=load(worldId);
  const current=readWorldAssemblerDraft(storage);
  if(current){
   const original=serializeWorldBuilderDraft(current);
   const registered=storage.getItem(slotKey(current.id));
   if(registered!==original)
    throw new Error('Enregistre d’abord le monde actif dans la bibliothèque pour conserver ses modifications');
  }
  // Reuse the SAME official handoff used by the World Builder and native
  // Sculpt Play. This one explicit transition never touches AdventureSave.
  saveWorldAssemblerDraft(storage,selected);
  return selected;
 }
 return Object.freeze({list,load,save,activate});
}
