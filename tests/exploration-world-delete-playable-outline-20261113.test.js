import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createExplorationWorldDocumentLibraryV1,EXPLORATION_WORLD_LIBRARY_SLOT_V1} from '../src/builder/exploration-world-document-library-v1.js';
import {saveWorldAssemblerDraft,readWorldAssemblerDraft,WORLD_ASSEMBLER_DRAFT_KEY} from '../src/builder/world-assembler-handoff.js';
import {sculptPlayableBoundaryOutlineV1} from '../src/render/sculpt-playable-boundary-outline-v1.js';
function storage(){
 const map=new Map();return {map,
  getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key),key:n=>[...map.keys()][n]??null,
  get length(){return map.size}
 };
}
const world=id=>createBlankWorldBuilderDraft({id,width:36*28,height:24*21});
test('per-world deletion is opt-in and keeps all other archived worlds and saved game data',()=>{
 const store=storage(),lib=createExplorationWorldDocumentLibraryV1({storage:store});
 lib.save(world('test-ancien'));lib.save(world('monde-a-conserver'));
 store.setItem('gensrpg.capture.adventure.save.fixture','DO-NOT-TOUCH');
 saveWorldAssemblerDraft(store,world('monde-a-conserver'));
 const active=store.getItem(WORLD_ASSEMBLER_DRAFT_KEY);
 assert.throws(()=>lib.remove('test-ancien'),/confirmation/);
 assert.deepEqual(lib.list().map(w=>w.id),['test-ancien','monde-a-conserver']);
 const removed=lib.remove('test-ancien',{confirmed:true});
 assert.equal(removed.id,'test-ancien');assert.equal(removed.activeReplacement,null);
 assert.deepEqual(lib.list().map(w=>w.id),['monde-a-conserver']);
 assert.equal(store.getItem(WORLD_ASSEMBLER_DRAFT_KEY),active);
 assert.equal(store.getItem('gensrpg.capture.adventure.save.fixture'),'DO-NOT-TOUCH');
 assert.equal(store.getItem(EXPLORATION_WORLD_LIBRARY_SLOT_V1+'test-ancien'),null);
 assert.ok(lib.load('monde-a-conserver'));
 assert.throws(()=>lib.load('test-ancien'),/absent/);
});
test('deleting active world requires a fresh draft with different ID; never erases other archives',()=>{
 const store=storage(),lib=createExplorationWorldDocumentLibraryV1({storage:store});
 lib.save(world('world-test'));lib.save(world('world-permanent'));
 saveWorldAssemblerDraft(store,world('world-test'));
 assert.throws(()=>lib.remove('world-test',{confirmed:true}),/remplacé/);
 assert.throws(()=>lib.remove('world-test',{confirmed:true,replacement:world('world-test')}),/différent/);
 const blank=world('nouveau-monde-auto');
 const result=lib.remove('world-test',{confirmed:true,replacement:blank});
 assert.equal(result.activeReplacement.id,blank.id);
 assert.equal(readWorldAssemblerDraft(store).id,blank.id);
 assert.deepEqual(lib.list().map(w=>w.id),['world-permanent']);
 assert.ok(lib.load('world-permanent'));
});
test('corrupted active world cannot be discarded by removing an archived world',()=>{
 const store=storage(),lib=createExplorationWorldDocumentLibraryV1({storage:store});
 lib.save(world('world-test'));
 store.setItem(WORLD_ASSEMBLER_DRAFT_KEY,'{corrompu');
 assert.throws(()=>lib.remove('world-test',{confirmed:true}),/illisible/);
 assert.equal(store.getItem(WORLD_ASSEMBLER_DRAFT_KEY),'{corrompu');
 assert.ok(lib.load('world-test'));
});
test('drawing a playable outline only requires existing real terrain bounds',()=>{
 const terrain={width:3,height:2};
 const samples=[];
 const pts=sculptPlayableBoundaryOutlineV1(terrain,{
   tileWidth:28,tileHeight:21,rise:8,
   heightAt:(_terrain,c,r)=>{samples.push([c,r]);return c===0&&r===0?2:0;}
 });
 assert.equal(pts.length,2*(terrain.width+terrain.height));
 assert.deepEqual(pts[0],{x:0,y:-16});
 assert.deepEqual(pts[3],{x:84,y:0});
 assert.deepEqual(pts[5],{x:84,y:42});
 assert.ok(samples.every(([c,r])=>c>=0&&c<3&&r>=0&&r<2));
 assert.throws(()=>sculptPlayableBoundaryOutlineV1(terrain),/sampler/);
});
test('editor overlay and world deletion are actually mounted in the native UI, never in gameplay',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const builder=readFileSync(new URL('../src/builder/world-assembler-main.js',import.meta.url),'utf8');
 const builderHtml=readFileSync(new URL('../world-assembler.html',import.meta.url),'utf8');
 assert.match(main,/function drawEditorPlayableLimit\(/);
 assert.match(main,/if\(navigationTesting\|\|!decorativeFringe/);
 assert.match(main,/drawEditorPlayableLimit\(\)/);
 assert.match(html,/trait jaune : limite jouable/);
 assert.match(builder,/library\.remove\(chosen,\{confirmed:true,replacement:blank\}\)/);
 assert.match(builderHtml,/id="world-library-delete"/);
 assert.match(builder,/window\.confirm\(warning\)/);
});
