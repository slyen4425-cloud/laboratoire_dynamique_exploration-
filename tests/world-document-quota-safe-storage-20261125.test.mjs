import test from 'node:test';
import assert from 'node:assert/strict';
import {
 encodeWorldDocumentStorageV1,decodeWorldDocumentStorageV1,
 WORLD_DOCUMENT_COMPRESSION_PREFIX_V1
} from '../src/storage/world-document-web-storage-codec-v1.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft}
 from '../src/builder/world-builder-draft.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {
 WORLD_ASSEMBLER_DRAFT_KEY,WORLD_ASSEMBLER_HANDOFF_KEY,
 saveWorldAssemblerDraft,readWorldAssemblerDraft,
 saveWorldAssemblerHandoff,readWorldAssemblerHandoff
} from '../src/builder/world-assembler-handoff.js';
import {
 createExplorationWorldDocumentLibraryV1,EXPLORATION_WORLD_LIBRARY_SLOT_V1
} from '../src/builder/exploration-world-document-library-v1.js';
function store(quota=Infinity){
 const data=new Map();
 return {data,
  getItem:key=>data.get(key)??null,
  setItem(key,value){
   value=String(value);
   const used=[...data.entries()].reduce((total,[k,v])=>total+
    k.length+(k===key?value.length:v.length),0)+
    (data.has(key)?0:key.length+value.length);
   if(used>quota)throw Object.assign(new Error('Storage quota'),{name:'QuotaExceededError',code:22});
   data.set(key,value);
  },
  removeItem:key=>data.delete(key),
  key:i=>[...data.keys()][i]??null,
  get length(){return data.size;}
 };
}
function hugeWorld(){
 const width=80,height=64,world=createBlankWorldBuilderDraft({
  id:'Monde_alpha',width:width*28,height:height*21
 });
 return {...world,areas:world.areas.map((area,i)=>i===0?{
  ...area,
  sculptTerrain:createSculptTerrain({width,height,levels:Array(width*height).fill(5)})
 }:area)};
}
test('small legacy JSON remains unchanged; corrupted compressed documents fail closed',()=>{
 const old='{"name":"Forêt des Érables","id":"world-1"}';
 assert.equal(encodeWorldDocumentStorageV1(old),old);
 assert.equal(decodeWorldDocumentStorageV1(old),old);
 assert.throws(()=>decodeWorldDocumentStorageV1(
  WORLD_DOCUMENT_COMPRESSION_PREFIX_V1+'AB!'),/incomplet|invalide/);
});
test('dense real WorldDocument is compact, lossless and same IDs, areas and terrain',()=>{
 const world=hugeWorld(),original=serializeWorldBuilderDraft(world);
 assert.ok(original.length>16384);
 const stored=encodeWorldDocumentStorageV1(original);
 assert.ok(stored.startsWith(WORLD_DOCUMENT_COMPRESSION_PREFIX_V1));
 assert.ok(stored.length<original.length*.5,
  'terrain remains unchanged while saving Web Storage space');
 assert.equal(decodeWorldDocumentStorageV1(stored),original);
 const storage=store();
 saveWorldAssemblerDraft(storage,world);
 const opened=readWorldAssemblerDraft(storage);
 assert.equal(opened.id,world.id);
 assert.deepEqual(opened.areas[0].sculptTerrain.levels,world.areas[0].sculptTerrain.levels);
 assert.equal(serializeWorldBuilderDraft(opened),original);
 const selected=world.areas[0].id;
 saveWorldAssemblerHandoff(storage,world,selected);
 assert.equal(readWorldAssemblerHandoff(storage)?.document.id,world.id);
 assert.equal(storage.getItem(WORLD_ASSEMBLER_HANDOFF_KEY),null,
  'handoff remains single-use after successful validation');
});
test('quota failure only compacts the SAME existing archive; no world or asset is deleted',()=>{
 const world=hugeWorld(),raw=serializeWorldBuilderDraft(world),encoded=encodeWorldDocumentStorageV1(raw);
 const slot=EXPLORATION_WORLD_LIBRARY_SLOT_V1+encodeURIComponent(world.id);
 const other='gensrpg.exploration.world-library.document.v1:other-world';
 const immutable='{"id":"other-world","payload":"do not modify"}';
 const capacity=slot.length+raw.length+other.length+immutable.length+
  WORLD_ASSEMBLER_DRAFT_KEY.length+encoded.length-20;
 const storage=store(capacity);
 storage.setItem(slot,raw);
 storage.setItem(other,immutable);
 saveWorldAssemblerDraft(storage,world);
 assert.equal(decodeWorldDocumentStorageV1(storage.getItem(slot)),raw);
 assert.equal(storage.getItem(other),immutable,'unrelated archive untouched');
 assert.equal(decodeWorldDocumentStorageV1(storage.getItem(WORLD_ASSEMBLER_DRAFT_KEY)),raw);
 assert.deepEqual(readWorldAssemblerDraft(storage).areas[0].sculptTerrain.levels,
  world.areas[0].sculptTerrain.levels);
 const library=createExplorationWorldDocumentLibraryV1({storage});
 assert.equal(library.load(world.id).id,world.id);
});
test('unrecoverable quota or corrupt archive never wipes the previous valid active draft',()=>{
 const world=hugeWorld(),raw=serializeWorldBuilderDraft(world);
 const old=createBlankWorldBuilderDraft({id:'old-world'});
 const storage=store();
 saveWorldAssemblerDraft(storage,old);
 const previous=storage.getItem(WORLD_ASSEMBLER_DRAFT_KEY);
 storage.setItem(EXPLORATION_WORLD_LIBRARY_SLOT_V1+encodeURIComponent(world.id),'not-json');
 const corruptSlot=EXPLORATION_WORLD_LIBRARY_SLOT_V1+encodeURIComponent(world.id);
 const frozen=store(previous.length+WORLD_ASSEMBLER_DRAFT_KEY.length+corruptSlot.length+100);
 frozen.setItem(WORLD_ASSEMBLER_DRAFT_KEY,previous);
 frozen.setItem(corruptSlot,'not-json');
 assert.throws(()=>saveWorldAssemblerDraft(frozen,world));
 assert.equal(frozen.getItem(WORLD_ASSEMBLER_DRAFT_KEY),previous);
 assert.equal(readWorldAssemblerDraft(frozen).id,'old-world');
 assert.ok(raw.length>previous.length);
});
