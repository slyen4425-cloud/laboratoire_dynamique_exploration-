// Single composition root shared by native editors, native play and Capture.
// Release owner selected in code, never a URL or storage preference.
// Keep legacy until the matching Capture release can adopt this contract.
import {createWorldAuthoringAccessV1} from './world-document-authoring-access-v1.js';
import {openMigratedWorldDocumentOwnerV1} from './world-document-transactional-owner-v1.js';
export const WORLD_DOCUMENT_RELEASE_OWNER_V1='legacy';
export async function openWorldDocumentReleaseAccessV1({
 storage=globalThis.localStorage,sessionStorage=globalThis.sessionStorage,
 universeId=null,makeId=()=>globalThis.crypto.randomUUID(),owner=null,store=null
}={}){
 if(Boolean(owner)!==Boolean(store))throw Error('Composition WorldDocument incomplète');
 if(!owner&&WORLD_DOCUMENT_RELEASE_OWNER_V1==='indexeddb'){
  ({owner,store}=await openMigratedWorldDocumentOwnerV1({legacyStorage:storage,makeId}));
 }
 return createWorldAuthoringAccessV1({storage,sessionStorage,universeId,makeId,owner,store});
}
