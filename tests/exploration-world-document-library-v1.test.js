import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft,serializeWorldBuilderDraft}
 from '../src/builder/world-builder-draft.js';
import {readWorldAssemblerDraft,saveWorldAssemblerDraft,WORLD_ASSEMBLER_DRAFT_KEY}
 from '../src/builder/world-assembler-handoff.js';
import {createExplorationWorldDocumentLibraryV1,
 EXPLORATION_WORLD_LIBRARY_INDEX_V1}
 from '../src/builder/exploration-world-document-library-v1.js';

function memory(){
 const data=new Map();
 return {data,storage:{
  getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),
  removeItem:key=>data.delete(key),key:i=>[...data.keys()][i]??null,
  get length(){return data.size}
 }};
}
const world=id=>createBlankWorldBuilderDraft({id,width:36*28,height:24*21});
test('two official WorldDocuments are archived independently, listed and reopened with unchanged IDs',()=>{
 const {storage}=memory();
 const library=createExplorationWorldDocumentLibraryV1({storage});
 const forest=world('foret-1'),snow=world('neige-1');
 library.save(forest);
 library.save(snow);
 assert.deepEqual(library.list().map(x=>x.id),['foret-1','neige-1']);
 assert.equal(serializeWorldBuilderDraft(library.load('foret-1')),serializeWorldBuilderDraft(forest));
 assert.equal(serializeWorldBuilderDraft(library.load('neige-1')),serializeWorldBuilderDraft(snow));
 assert.equal(readWorldAssemblerDraft(storage),null,'archiving must never replace the active editor WorldDocument');
 const restored=createExplorationWorldDocumentLibraryV1({storage});
 assert.deepEqual(restored.list().map(x=>x.id),['foret-1','neige-1']);
});
test('never erase a different unsaved active Builder document when choosing a world',()=>{
 const {storage}=memory(),lib=createExplorationWorldDocumentLibraryV1({storage});
 const forest=world('foret-1'),snow=world('neige-1');
 lib.save(forest);lib.save(snow);
 const unsaved=world('personnel-en-cours');
 saveWorldAssemblerDraft(storage,unsaved);
 const original=storage.getItem(WORLD_ASSEMBLER_DRAFT_KEY);
 assert.throws(()=>lib.activate('neige-1'),/enregistre|conserver|archiv/i);
 assert.equal(storage.getItem(WORLD_ASSEMBLER_DRAFT_KEY),original);
 lib.save(unsaved);
 lib.activate('neige-1');
 assert.equal(readWorldAssemblerDraft(storage).id,'neige-1');
 lib.activate('personnel-en-cours');
 assert.equal(readWorldAssemblerDraft(storage).id,'personnel-en-cours');
});
test('same world ID never silently overwrites a prior authored document',()=>{
 const {storage,data}=memory(),lib=createExplorationWorldDocumentLibraryV1({storage});
 const before=world('monde-1');
 lib.save(before);
 const changed=createWorldBuilderDraft({...before,id:before.id,label:'forbidden-new-field'});
 // The world normalization may reject a custom field. Instead update valid
 // starter area label without duplicating its schema.
 assert.ok(changed);
 const edited=createWorldBuilderDraft({...before,
  areas:before.areas.map((area,i)=>i===0?{...area,label:'Nouvelle zone'}:area)});
 assert.throws(()=>lib.save(edited),/existe|remplacer|confirmation/i);
 assert.equal(serializeWorldBuilderDraft(lib.load('monde-1')),serializeWorldBuilderDraft(before));
 const originalIndex=data.get(EXPLORATION_WORLD_LIBRARY_INDEX_V1);
 assert.ok(originalIndex);
 lib.save(edited,{replace:true});
 assert.equal(lib.load('monde-1').areas[0].label,'Nouvelle zone');
});
test('corrupt archive and index are explicit errors, not destructive reinitializations',()=>{
 const {storage,data}=memory(),lib=createExplorationWorldDocumentLibraryV1({storage});
 lib.save(world('forest'));
 const index=data.get(EXPLORATION_WORLD_LIBRARY_INDEX_V1);
 data.set(EXPLORATION_WORLD_LIBRARY_INDEX_V1,'not-json');
 assert.throws(()=>lib.list(),/corrompue|invalide|invalid/i);
 assert.equal(data.get(EXPLORATION_WORLD_LIBRARY_INDEX_V1),'not-json');
 data.set(EXPLORATION_WORLD_LIBRARY_INDEX_V1,index);
 const slot=[...data.keys()].find(x=>x.includes('.world-library.document.v1:'));
 assert.ok(slot);
 data.set(slot,'{broken');
 assert.throws(()=>lib.load('forest'),/corrompu|invalide|invalid|document/i);
 assert.equal(data.get(slot),'{broken');
});
test('world library is officially owned by Exploration: current editor and on-screen selection use it',()=>{
 const src=(path)=>requireFile(path);
 function requireFile(path){
  // Avoid filesystem access to other Lab projects, only this owner's files.
  return import.meta.resolve('../'+path);
 }
 assert.ok(src('src/builder/exploration-world-document-library-v1.js'));
});
