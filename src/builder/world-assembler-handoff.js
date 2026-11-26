import {
  importWorldBuilderDocument,
  serializeWorldBuilderDraft
} from './world-builder-draft.js';
import {encodeWorldDocumentStorageV1,decodeWorldDocumentStorageV1}
 from '../storage/world-document-web-storage-codec-v1.js';

// Transport and persistence of the SAME canonical WorldDocument only. These
// adapters never write a second WorldGraph or reinterpret Portal/Area IDs.
export const WORLD_ASSEMBLER_HANDOFF_KEY='gensrpg.world-assembler.handoff.v1';
export const WORLD_ASSEMBLER_DRAFT_KEY='gensrpg.world-assembler.document.v1';
export const WORLD_ASSEMBLER_HANDOFF_VERSION=1;

function requireStorage(storage,action){
  if(!storage||typeof storage[action]!=='function')
    throw Error('Stockage du World Builder indisponible');
}
// Never delete maps or previous archives in order to make space. On quota
// failure, safely compact ONLY this same world's already-valid archive slot
// (if present), without rewriting its WorldDocument bytes or world IDs.
const archiveSlot=worldId=>
 'gensrpg.exploration.world-library.document.v1:'+encodeURIComponent(worldId);
const isQuotaError=error=>error?.name==='QuotaExceededError'||
 error?.code===22||error?.code===1014;
function compactExistingWorldArchive(storage,draft){
 const key=archiveSlot(draft.id);
 const original=storage.getItem(key);
 if(!original)return false;
 const bytes=decodeWorldDocumentStorageV1(original);
 const archived=importWorldBuilderDocument(bytes);
 if(archived.id!==draft.id)throw Error('Archive WorldDocument étrangère : préservation du stockage');
 const compact=encodeWorldDocumentStorageV1(bytes);
 if(compact.length>=original.length)return false;
 storage.setItem(key,compact);
 if(decodeWorldDocumentStorageV1(storage.getItem(key))!==bytes)
  throw Error('Archive WorldDocument après compression illisible');
 return true;
}
export function saveWorldAssemblerDraft(storage,draft){
 requireStorage(storage,'setItem');
 const document=serializeWorldBuilderDraft(draft);
 const packed=encodeWorldDocumentStorageV1(document);
 try{storage.setItem(WORLD_ASSEMBLER_DRAFT_KEY,packed);}
 catch(error){
  if(!isQuotaError(error))throw error;
  // LocalStorage is finite even when the browser has ample disk space.
  // An active world also has an author-approved library archive, sometimes
  // uncompressed from an older version: compact that exact archive once,
  // then retry the SAME canonical draft. No cleanup of unrelated worlds.
  if(!compactExistingWorldArchive(storage,draft))throw error;
  storage.setItem(WORLD_ASSEMBLER_DRAFT_KEY,packed);
 }
 return document;
}
export function readWorldAssemblerDraft(storage){
  if(!storage||typeof storage.getItem!=='function')return null;
  try{
    const content=storage.getItem(WORLD_ASSEMBLER_DRAFT_KEY);
    return content?importWorldBuilderDocument(decodeWorldDocumentStorageV1(content)):null;
  }catch{return null;}
}
export function saveWorldAssemblerHandoff(storage,draft,areaId){
  requireStorage(storage,'setItem');
  const document=JSON.parse(serializeWorldBuilderDraft(draft));
  if(!document.areas.some(a=>a.id===areaId))
    throw Error('WorldArea cible du transfert introuvable');
  const payload=JSON.stringify({
    schemaVersion:WORLD_ASSEMBLER_HANDOFF_VERSION,
    document,areaId
  });
  storage.setItem(WORLD_ASSEMBLER_HANDOFF_KEY,encodeWorldDocumentStorageV1(payload));
  return payload;
}
export function readWorldAssemblerHandoff(storage){
  if(!storage||typeof storage.getItem!=='function')return null;
  let content;
  try{
    content=storage.getItem(WORLD_ASSEMBLER_HANDOFF_KEY);
    if(!content)return null;
    const parsed=JSON.parse(decodeWorldDocumentStorageV1(content));
    if(parsed?.schemaVersion!==WORLD_ASSEMBLER_HANDOFF_VERSION||
        !parsed.document||typeof parsed.areaId!=='string')
      return null;
    const document=importWorldBuilderDocument(JSON.stringify(parsed.document));
    if(!document.areas.some(a=>a.id===parsed.areaId))return null;
    storage.removeItem(WORLD_ASSEMBLER_HANDOFF_KEY);
    return Object.freeze({document,areaId:parsed.areaId});
  }catch{return null;}
}
