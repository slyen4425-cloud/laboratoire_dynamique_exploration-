// Official Exploration WorldDocument archive. World Builder continues to
// own its one editable draft. Every archived document uses the same official
// WorldDocument serializer and importer, without an alternate world graph.
import {serializeWorldBuilderDraft,importWorldBuilderDocument}
 from './world-builder-draft.js';
import {readWorldAssemblerDraft,saveWorldAssemblerDraft,WORLD_ASSEMBLER_DRAFT_KEY}
 from './world-assembler-handoff.js';
import {assertExplorationWorldDocumentIdV1 as id}
 from '../world/world-document-identity-v1.js';

export const EXPLORATION_WORLD_LIBRARY_INDEX_V1=
 'gensrpg.exploration.world-library.index.v1';
export const EXPLORATION_WORLD_LIBRARY_SLOT_V1=
 'gensrpg.exploration.world-library.document.v1:';
const SCHEMA='gensrpg.exploration.world-library.index.v1';
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
 // Explicit per-world removal. Never touch other WorldDocuments, presets,
 // adventure saves or draft bytes. The chosen active world must first be
 // replaced by a validated new blank WorldDocument, in this SAME handoff.
 function remove(worldId,{confirmed=false,replacement=null}={}){
  const checked=id(worldId);
  if(confirmed!==true)throw new Error('Suppression du monde : confirmation obligatoire');
  if(typeof storage.removeItem!=='function')
   throw new Error('Stockage local ne permet pas la suppression de monde');
  const selected=load(checked);
  const oldActiveBytes=storage.getItem(WORLD_ASSEMBLER_DRAFT_KEY);
  const active=readWorldAssemblerDraft(storage);
  if(oldActiveBytes!==null&&!active)
   throw new Error('Monde actif illisible : aucune suppression possible');
  let next=null;
  if(active?.id===checked){
   if(!replacement)throw new Error('Le monde actif doit être remplacé par un monde vierge avant sa suppression');
   const serialized=serializeWorldBuilderDraft(replacement);
   next=importWorldBuilderDocument(serialized);
   if(next.id===checked)throw new Error('Le nouveau monde doit avoir un identifiant différent');
   saveWorldAssemblerDraft(storage,next);
  }else if(replacement){
   throw new Error('Le remplacement est réservé au monde actuellement actif');
  }
  const current=index();
  // Change index before the archive bytes; if storage fails midway the
  // remaining bytes are discovered by ids(), not silently lost.
  const worldIds=current.worldIds.filter(x=>x!==checked);
  try{
   storage.setItem(EXPLORATION_WORLD_LIBRARY_INDEX_V1,JSON.stringify({
    schema:SCHEMA,version:1,worldIds
   }));
   storage.removeItem(slotKey(checked));
  }catch(error){
   // A failed storage operation never justifies deleting or rewriting
   // unrelated world slots or existing saved adventures.
   throw new Error('Suppression non terminée : '+error.message);
  }
  return Object.freeze({id:selected.id,activeReplacement:next});
 }
 function activate(worldId){
  const selected=load(worldId);
  // readWorldAssemblerDraft deliberately returns null for corrupted bytes;
  // never mistake them for an empty editor and erase the original draft.
  const activeBytes=storage.getItem(WORLD_ASSEMBLER_DRAFT_KEY);
  const current=readWorldAssemblerDraft(storage);
  if(activeBytes!==null&&!current)
   throw new Error('Document actif illisible : exporte ou répare la sauvegarde avant de changer de monde');
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
 return Object.freeze({list,load,save,activate,remove});
}
