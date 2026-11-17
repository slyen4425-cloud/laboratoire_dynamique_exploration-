import test from 'node:test';
import assert from 'node:assert/strict';
import {createExplorationUniverseWorkspaceStorageV1}
 from '../src/storage/exploration-universe-workspace-storage-v1.js';
function memory(){const m=new Map([['gensrpg.world-assembler.document.v1','legacy-protected'],
 ['gensrpg.exploration.world-library.index.v1','legacy-library']]);
 return {get length(){return m.size},key:i=>[...m.keys()][i]??null,
  getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),
  removeItem:k=>m.delete(k),all:()=>Object.fromEntries(m)};}
test('two universe workspaces isolate one official WorldAssembler draft, map presets and play',()=>{
 const storage=memory(),a=createExplorationUniverseWorkspaceStorageV1(storage,'unv_00000001');
 const b=createExplorationUniverseWorkspaceStorageV1(storage,'unv_00000002');
 const draft='gensrpg.world-assembler.document.v1';
 a.setItem(draft,'world-A');b.setItem(draft,'world-B');
 assert.equal(a.getItem(draft),'world-A');assert.equal(b.getItem(draft),'world-B');
 assert.equal(storage.getItem(draft),'legacy-protected');
 a.setItem('gensrpg.exploration.map-presets.v1','presets-A');
 assert.equal(b.getItem('gensrpg.exploration.map-presets.v1'),null);
 assert.equal(storage.getItem('gensrpg.exploration.world-library.index.v1'),'legacy-library');
 assert.equal(a.key(0),'gensrpg.exploration.world-library.index.v1');
 assert.ok([...Array(a.length)].some((_,i)=>a.key(i)===draft));
 assert.equal([...Array(a.length)].some((_,i)=>a.key(i)?.startsWith('gensrpg.exploration.universe.workspace.v1:')),false);
});
