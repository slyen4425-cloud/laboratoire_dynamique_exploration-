// Single save/transition coordinator for Sculpt authoring. A destination
// never mounts before the owner confirms the current document.
import {serializeWorldBuilderDraft} from '../builder/world-builder-draft.js';
export function createSculptWorldPersistenceV1({initialDocument=null,commit,commitOnUnload=null,onTransition=()=>{}}={}){
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
  try{onTransition(true);return await action(save);}
  finally{active=false;onTransition(false);}
 }
 function flushOnUnload(document){
  if(active||queued||typeof commitOnUnload!=='function')return false;
  if(raw(document)!==raw(confirmed)){
   commitOnUnload(document,confirmed);confirmed=document;
  }
  return true;
 }
 return Object.freeze({save,transition,flushOnUnload,
  get busy(){return active||queued>0;},
  get transitioning(){return active;},get confirmed(){return confirmed;}
 });
}

// Autosave is a scheduler only. The same transition coordinator owns every
// write and expected document. No alternate cache, fallback or pagehide write.
export function installSculptWorldAutosaveV1({persistence,capture,canSave=()=>true,
 root=globalThis,delayMs=1200,maxDelayMs=15000,onState=()=>{}}={}){
 if(!persistence||typeof capture!=='function')throw TypeError('Session Sculpt requise');
 let timer=null,deadline=null,dirty=false,disposed=false,writing=false,generation=0;
 const clear=()=>{if(timer!==null)root.clearTimeout(timer);timer=null;if(deadline!==null)root.clearTimeout(deadline);deadline=null;};
 function schedule(){
  if(disposed)return;
  dirty=true;generation++;onState('pending');
  if(timer!==null)root.clearTimeout(timer);
  timer=root.setTimeout(()=>{void flush();},delayMs);
  if(deadline===null)deadline=root.setTimeout(()=>{void flush();},maxDelayMs);
 }
 async function flush(){
  clear();
  if(disposed||!dirty)return false;
  if(writing||persistence.transitioning||!canSave()){
   // Keep the unsaved indication; the next editor interaction or explicit
   // navigation can flush it. Never save a play projection.
   return false;
  }
  writing=true;const revision=generation;
  try{
   const document=capture();
   if(!document)return false;
   if(serializeWorldBuilderDraft(document)!==(persistence.confirmed?serializeWorldBuilderDraft(persistence.confirmed):null))
    await persistence.save(document);
   if(revision===generation){dirty=false;onState('saved');}
   return true;
  }catch(error){onState('error',error);return false;}
  finally{
   writing=false;
   if(!disposed&&revision!==generation&&timer===null)schedule();
  }
 }
 return Object.freeze({schedule,flush,
  get pending(){return dirty||writing;},
  dispose(){disposed=true;clear();}
 });
}
