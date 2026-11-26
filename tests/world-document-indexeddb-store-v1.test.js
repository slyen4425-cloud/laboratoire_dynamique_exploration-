import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {encodeWorldDocumentStorageV1} from '../src/storage/world-document-web-storage-codec-v1.js';
import {prepareLegacyWorldDocumentV1,createWorldDocumentIndexedDbStoreV1} from '../src/storage/world-document-indexeddb-store-v1.js';
const draft='gensrpg.world-assembler.document.v1';
const archive='gensrpg.exploration.world-library.document.v1:';
test('migration prepares old and compact canonical bytes without changing world identity',()=>{
 const w=createBlankWorldBuilderDraft({id:'Monde_alpha',width:80*28,height:64*21});
 const world={...w,areas:w.areas.map((a,i)=>i===0?{...a,sculptTerrain:createSculptTerrain({width:80,height:64,levels:Array(80*64).fill(5)})}:a)};
 const raw=serializeWorldBuilderDraft(world),compact=encodeWorldDocumentStorageV1(raw);
 assert.notEqual(compact,raw);
 for(const key of [draft,archive+'Monde_alpha','gensrpg.exploration.universe.workspace.v1:unv_abcdefgh:'+draft]){
  assert.equal(prepareLegacyWorldDocumentV1(key,raw).serialized,raw);
  assert.equal(prepareLegacyWorldDocumentV1(key,compact).serialized,raw);
 }
 assert.throws(()=>prepareLegacyWorldDocumentV1(archive+'wrong-world',raw),/incompatible/);
 assert.throws(()=>prepareLegacyWorldDocumentV1('gensrpg.core.save',raw),/non autorisée/);
 assert.throws(()=>prepareLegacyWorldDocumentV1(draft,'bad json'));
});
test('unavailable IndexedDB fails without falling back to localStorage',async()=>{
 const store=createWorldDocumentIndexedDbStoreV1({indexedDBFactory:null});
 const document=createBlankWorldBuilderDraft({id:'Monde_alpha'});
 await assert.rejects(store.read(draft),/indisponible/);
 await assert.rejects(store.commit([{key:draft,document,expectedRevision:null}]),/indisponible/);
 await assert.rejects(store.migrateLegacy([{key:draft,raw:serializeWorldBuilderDraft(document)}]),/indisponible/);
});
test('missing revision and duplicate transaction keys fail before opening a database',async()=>{
 const store=createWorldDocumentIndexedDbStoreV1({indexedDBFactory:null});
 const document=createBlankWorldBuilderDraft({id:'Monde_alpha'});
 await assert.rejects(store.commit([{key:draft,document}]),/Révision attendue/);
 const entry={key:draft,document,expectedRevision:null};
 await assert.rejects(store.commit([entry,entry]),/doublon/);
});
