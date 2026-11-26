// Single save/transition coordinator for Sculpt authoring. A destination
// never mounts before the owner confirms the current document.
import {serializeWorldBuilderDraft} from '../builder/world-builder-draft.js';
export function createSculptWorldPersistenceV1({initialDocument=null,commit,commitOnUnload=null}={}){
 if(typeof commit!=='function')throw TypeError('Propriétaire WorldDocument requis');
 let confirmed=initialDocument,queued=0,active=false,tail=Promise.resolve();
 const raw=document=>document===null?null:serializeWorldBuilderDraft(document);
 async function save(document){
  raw(document);queued++;
  const operation=tail.then(async()=>{
   try{
    // Even unchanged data must check the owner's revision before navigation.
    await commit(document,confirmed);confirmed=document;
    return document;
   }finally{queued--;}
  });
  tail=operation.catch(()=>{});
  return operation;
 }
 async function transition(action){
  if(active)throw Error('Une transition de carte est déjà en cours');
  active=true;
  try{return await action(save);}
  finally{active=false;}
 }
 function flushOnUnload(document){
  if(active||queued||typeof commitOnUnload!=='function')return false;
  if(raw(document)!==raw(confirmed)){
   commitOnUnload(document,confirmed);confirmed=document;
  }
  return true;
 }
 return Object.freeze({save,transition,flushOnUnload,
  get busy(){return active||queued>0;},get confirmed(){return confirmed;}
 });
}
