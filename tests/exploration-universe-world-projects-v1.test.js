import test from 'node:test';
import assert from 'node:assert/strict';
import {createExplorationUniverseWorldProjectsV1}
 from '../src/builder/exploration-universe-world-projects-v1.js';
import {createExplorationWorldDocumentLibraryV1}
 from '../src/builder/exploration-world-document-library-v1.js';
const store=()=>{
 const m=new Map([['gensrpg.world-assembler.document.v1','protected-by-owner']]);
 return {get length(){return m.size},key:i=>[...m.keys()][i]??null,
  getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),
  removeItem:k=>m.delete(k),snapshot:()=>Object.fromEntries(m)};
};
const a='unv_a1234567',b='unv_b1234567';
test('new worlds use canonical WorldDocument serializer and are isolated',()=>{
 const s=store();s.removeItem('gensrpg.world-assembler.document.v1');
 let i=0;const project=createExplorationUniverseWorldProjectsV1({
  storage:s,makeId:()=>String(++i).padStart(8,'0')});
 const A=project.createBlank(a);
 const B=project.createBlank(b);
 assert.notEqual(A.id,B.id);
 assert.equal(project.list(a).length,1);assert.equal(project.list(b).length,1);
 assert.equal(project.load(a,A.id).id,A.id);
 assert.throws(()=>project.load(a,B.id),/étranger/);
 assert.throws(()=>project.activate(a,B.id),/étranger/);
 assert.throws(()=>project.createBlank(a),/déjà initialisé/);
 assert.equal(createExplorationWorldDocumentLibraryV1({storage:s}).load(A.id).id,A.id);
});
test('unsaved original world handoff is protected and no project overwrites it',()=>{
 const s=store();let i=0;
 const p=createExplorationUniverseWorldProjectsV1({
  storage:s,makeId:()=>String(++i).padStart(8,'0')});
 const original=s.getItem('gensrpg.world-assembler.document.v1');
 const A=p.createBlank(a);
 assert.equal(s.getItem('gensrpg.world-assembler.document.v1'),original);
 assert.equal(p.activate(a,A.id).id,A.id,'scoped project activation succeeds');
 assert.equal(s.getItem('gensrpg.world-assembler.document.v1'),original);
 const scopedKey='gensrpg.exploration.universe.workspace.v1:'+a+':gensrpg.world-assembler.document.v1';
 assert.match(s.getItem(scopedKey),/world-00000001/);
});
test('copy is confirmed, uses canonical WorldDocument owner and different IDs',()=>{
 const s=store();s.removeItem('gensrpg.world-assembler.document.v1');
 let i=0;const p=createExplorationUniverseWorldProjectsV1({
  storage:s,makeId:()=>String(++i).padStart(8,'0')});
 const A=p.createBlank(a);
 assert.throws(()=>p.copy({fromWorldId:A.id,toProjectId:b}),/confirmation/);
 const B=p.copy({fromWorldId:A.id,toProjectId:b,confirmed:true});
 assert.notEqual(A.id,B.id);assert.equal(B.areas.length,A.areas.length);
 assert.equal(p.list(a)[0].id,A.id);assert.equal(p.list(b)[0].id,B.id);
});

test('two projects use separate native WorldAssembler drafts and can add maps without crossing worlds',()=>{
 const s=store();s.removeItem('gensrpg.world-assembler.document.v1');
 let i=0;const p=createExplorationUniverseWorldProjectsV1({storage:s,
  makeId:()=>String(++i).padStart(8,'0')});
 const A=p.createBlank(a),B=p.createBlank(b);
 const extra=p.addBlank(a);
 assert.equal(p.list(a).length,2);
 assert.equal(p.list(b).length,1);
 assert.equal(p.list(b)[0].id,B.id);
 assert.notEqual(extra.id,A.id);
 p.activate(a,A.id);
 const scopeA='gensrpg.exploration.universe.workspace.v1:'+a+':gensrpg.world-assembler.document.v1';
 const scopeB='gensrpg.exploration.universe.workspace.v1:'+b+':gensrpg.world-assembler.document.v1';
 assert.equal(JSON.parse(s.getItem(scopeA)).id,A.id);
 assert.equal(JSON.parse(s.getItem(scopeB)).id,B.id);
 assert.equal(s.getItem('gensrpg.world-assembler.document.v1'),null);
});
