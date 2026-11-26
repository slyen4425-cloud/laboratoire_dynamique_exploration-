// World authoring access seam: same native commands, async acknowledgement.
// The caller selects ONE owner for its lifetime. No fallback or dual writes.
// Until all consumers migrate, the default entry point uses legacy storage.
import {createExplorationWorldDocumentLibraryV1} from '../builder/exploration-world-document-library-v1.js';
import {createExplorationUniverseWorldProjectsV1} from '../builder/exploration-universe-world-projects-v1.js';
import {readWorldAssemblerDraft,saveWorldAssemblerDraft,readWorldAssemblerHandoff,saveWorldAssemblerHandoff,WORLD_ASSEMBLER_DRAFT_KEY,WORLD_ASSEMBLER_HANDOFF_KEY} from '../builder/world-assembler-handoff.js';
import {createExplorationUniverseWorkspaceStorageV1} from './exploration-universe-workspace-storage-v1.js';
import {serializeWorldBuilderDraft} from '../builder/world-builder-draft.js';

export function createWorldAuthoringAccessV1({storage,sessionStorage,universeId=null,owner=null,store=null,makeId=()=>globalThis.crypto.randomUUID()}={}){
 if(!storage||!sessionStorage||typeof makeId!=='function'||Boolean(owner)!==Boolean(store))
  throw TypeError('Propriétaire WorldDocument et transport requis');
 const workspace=s=>universeId===null?s:createExplorationUniverseWorkspaceStorageV1(s,universeId);
 const sessions=workspace(sessionStorage);
 const draftKey=universeId===null?WORLD_ASSEMBLER_DRAFT_KEY:
  'gensrpg.exploration.universe.workspace.v1:'+universeId+':'+WORLD_ASSEMBLER_DRAFT_KEY;
 function run(command){
  if(owner)return owner.run(command);
  const library=createExplorationWorldDocumentLibraryV1({storage});
  const projects=createExplorationUniverseWorldProjectsV1({storage,makeId});
  const scoped=workspace(storage);
  function readDraft(){
   const value=readWorldAssemblerDraft(scoped);
   if(!value&&scoped.getItem(WORLD_ASSEMBLER_DRAFT_KEY)!==null)throw Error('Monde actif illisible : aucune récupération destructive');
   if(value&&universeId!==null)projects.load(universeId,value.id);
   return value;
  }
  function saveDraft(document,{expectedDocument}={}){
   if(expectedDocument===undefined)throw Error('Version attendue du monde obligatoire');
   const current=readDraft();
   if((current?serializeWorldBuilderDraft(current):null)!==(expectedDocument?serializeWorldBuilderDraft(expectedDocument):null))
    throw Error('Conflit de document actif : recharger avant enregistrement');
   if(universeId!==null)projects.load(universeId,document.id);
   return saveWorldAssemblerDraft(scoped,document);
  }
  return command({library,projects,readDraft,saveDraft});
 }
 const list=()=>run(({library,projects})=>universeId===null?library.list():projects.list(universeId));
 return Object.freeze({
  durable:Boolean(owner),
  async list(){return list();},
  async load(id){return run(({library,projects})=>universeId===null?library.load(id):projects.load(universeId,id));},
  async readDraft(){return run(({readDraft})=>readDraft(universeId));},
  async saveDraft(document,expectedDocument){return run(({saveDraft})=>saveDraft(document,{universeId,expectedDocument}));},
  // Unload has no async durability guarantee. Only the existing synchronous
  // legacy owner may be invoked here, never a fallback writer for IndexedDB.
  saveDraftOnUnload(document,expectedDocument){
   if(owner)throw Error('IndexedDB exige une sauvegarde confirmée avant fermeture');
   return run(({saveDraft})=>saveDraft(document,{universeId,expectedDocument}));
  },
  async archive(document,{replace=false}={}){return run(({library,projects})=>universeId===null?library.save(document,{replace}):projects.save(universeId,document));},
  async activate(id){return run(({library,projects})=>universeId===null?library.activate(id):projects.activate(universeId,id));},
  async addBlank(options){if(universeId===null)throw Error('Projet univers requis');return run(({projects})=>projects.addBlank(universeId,options));},
  async remove(id,options){if(universeId!==null)throw Error('Suppression de monde de projet non autorisée');return run(({library})=>library.remove(id,options));},
  async writeHandoff(document,areaId){
   if(!owner)return saveWorldAssemblerHandoff(sessions,document,areaId);
   const row=await store.read(draftKey);
   if(!row||serializeWorldBuilderDraft(row.document)!==serializeWorldBuilderDraft(document)||
      !row.document.areas.some(a=>a.id===areaId))
    throw Error('Transfert bloqué : révision WorldDocument non confirmée');
   // Only the reference crosses sessionStorage, not a second large map.
   sessions.setItem(WORLD_ASSEMBLER_HANDOFF_KEY,JSON.stringify({schemaVersion:2,worldId:document.id,areaId,revision:row.revision}));
  },
  async readHandoff(){
   if(!owner)return readWorldAssemblerHandoff(sessions);
   const raw=sessions.getItem(WORLD_ASSEMBLER_HANDOFF_KEY);
   if(raw===null)return null;
   let ref;
   try{ref=JSON.parse(raw);}catch{throw Error('Transfert de carte illisible : conservation');}
   if(ref?.schemaVersion!==2||typeof ref.worldId!=='string'||typeof ref.areaId!=='string'||!Number.isSafeInteger(ref.revision))
    throw Error('Transfert historique incompatible : revenir au monde enregistré sans supprimer le transfert');
   const row=await store.read(draftKey);
   if(!row||row.revision!==ref.revision||row.document.id!==ref.worldId||!row.document.areas.some(a=>a.id===ref.areaId))
    throw Error('Transfert de carte périmé : recharger le monde, aucune carte écrasée');
   sessions.removeItem(WORLD_ASSEMBLER_HANDOFF_KEY);
   return Object.freeze({document:row.document,areaId:ref.areaId});
  }
 });
}
