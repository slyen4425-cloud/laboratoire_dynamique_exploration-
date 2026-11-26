// Async transaction boundary around the existing native world commands.
// No alternate graph, IDs, library, or universe allocation implementation.
// Callers must await the operation before navigation and UI acknowledgement.
import {createExplorationWorldDocumentLibraryV1} from '../builder/exploration-world-document-library-v1.js';
import {createExplorationUniverseWorldProjectsV1} from '../builder/exploration-universe-world-projects-v1.js';
import {readWorldAssemblerDraft,saveWorldAssemblerDraft,WORLD_ASSEMBLER_DRAFT_KEY} from '../builder/world-assembler-handoff.js';
import {createExplorationUniverseWorkspaceStorageV1} from './exploration-universe-workspace-storage-v1.js';
import {serializeWorldBuilderDraft} from '../builder/world-builder-draft.js';
export function createWorldDocumentTransactionalOwnerV1({store,makeId=()=>globalThis.crypto.randomUUID()}={}){
 if(typeof store?.executeCommand!=='function'||typeof makeId!=='function')
  throw TypeError('Autorité IndexedDB WorldDocument requise');
 const scoped=(storage,id)=>id===null?storage:createExplorationUniverseWorkspaceStorageV1(storage,id);
 return Object.freeze({
  async run(command){
   if(typeof command!=='function')throw TypeError('Commande native requise');
   return store.executeCommand(storage=>{
    const library=createExplorationWorldDocumentLibraryV1({storage});
    const projects=createExplorationUniverseWorldProjectsV1({storage,makeId});
    const readDraft=(universeId=null)=>{
     const workspace=scoped(storage,universeId);
     const world=readWorldAssemblerDraft(workspace);
     if(!world&&workspace.getItem(WORLD_ASSEMBLER_DRAFT_KEY)!==null)
      throw Error('Document actif illisible : conservation');
     if(world&&universeId!==null)projects.load(universeId,world.id);
     return world;
    };
    const saveDraft=(document,{universeId=null,expectedDocument}={})=>{
     if(expectedDocument===undefined)throw Error('Version active attendue obligatoire');
     const current=readDraft(universeId);
     const raw=current?serializeWorldBuilderDraft(current):null;
     const expected=expectedDocument===null?null:serializeWorldBuilderDraft(expectedDocument);
     if(raw!==expected)throw Error('Conflit de document actif : recharger avant enregistrement');
     if(universeId!==null)projects.load(universeId,document.id);
     return saveWorldAssemblerDraft(scoped(storage,universeId),document);
    };
    return command(Object.freeze({library,projects,readDraft,saveDraft}));
   });
  }
 });
}
