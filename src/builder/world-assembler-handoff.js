import {
  importWorldBuilderDocument,
  serializeWorldBuilderDraft
} from './world-builder-draft.js?rev=forest1-entrances-v1';

// Transport and persistence of the SAME canonical WorldDocument only. These
// adapters never write a second WorldGraph or reinterpret Portal/Area IDs.
export const WORLD_ASSEMBLER_HANDOFF_KEY='gensrpg.world-assembler.handoff.v1';
export const WORLD_ASSEMBLER_DRAFT_KEY='gensrpg.world-assembler.document.v1';
export const WORLD_ASSEMBLER_HANDOFF_VERSION=1;

function requireStorage(storage,action){
  if(!storage||typeof storage[action]!=='function')
    throw Error('Stockage du World Builder indisponible');
}
export function saveWorldAssemblerDraft(storage,draft){
  requireStorage(storage,'setItem');
  const document=serializeWorldBuilderDraft(draft);
  storage.setItem(WORLD_ASSEMBLER_DRAFT_KEY,document);
  return document;
}
export function readWorldAssemblerDraft(storage){
  if(!storage||typeof storage.getItem!=='function')return null;
  try{
    const content=storage.getItem(WORLD_ASSEMBLER_DRAFT_KEY);
    return content?importWorldBuilderDocument(content):null;
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
  storage.setItem(WORLD_ASSEMBLER_HANDOFF_KEY,payload);
  return payload;
}
export function readWorldAssemblerHandoff(storage){
  if(!storage||typeof storage.getItem!=='function')return null;
  let content;
  try{
    content=storage.getItem(WORLD_ASSEMBLER_HANDOFF_KEY);
    if(content)storage.removeItem(WORLD_ASSEMBLER_HANDOFF_KEY);
    if(!content)return null;
    const parsed=JSON.parse(content);
    if(parsed?.schemaVersion!==WORLD_ASSEMBLER_HANDOFF_VERSION||
        !parsed.document||typeof parsed.areaId!=='string')
      return null;
    const document=importWorldBuilderDocument(JSON.stringify(parsed.document));
    if(!document.areas.some(a=>a.id===parsed.areaId))return null;
    return Object.freeze({document,areaId:parsed.areaId});
  }catch{return null;}
}
