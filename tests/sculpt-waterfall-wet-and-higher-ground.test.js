import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,applySculptStroke,appendSculptSphere,
 importSculptTerrain,serializeSculptTerrain,sculptFaces}
 from '../src/world/sculpt-height-model.js';
import {sculptObjectCanOccupyCell,appendSculptPreviewObject,
 updateSculptPreviewObject,importSculptPreviewScene,serializeSculptPreviewScene}
 from '../src/world/sculpt-scene-preview.js';
const W=16,H=14;
const wet=()=>{
 const levels=Array(W*H).fill(2),waterLevels=Array(W*H).fill(-1);
 for(let y=3;y<=10;y++)for(let x=8;x<=13;x++){
   levels[y*W+x]=0;waterLevels[y*W+x]=4;
 }
 return createSculptTerrain({width:W,height:H,levels,waterLevels});
};
test('one native authoring policy accepts four nonblocking animated waterfall types over real water, including drag',()=>{
 const terrain=wet();
 const ids=['front_wide','side_narrow','three_quarter','tiered'];
 for(const type of ids){
   const id='objectdef.waterfall.'+type+'.01';
   assert.equal(sculptObjectCanOccupyCell(terrain,id,9,6),true,'waterfall '+type);
   assert.equal(sculptObjectCanOccupyCell(terrain,id,7,6),true,'dry');
   assert.equal(sculptObjectCanOccupyCell(terrain,id,-1,6),false);
   assert.equal(sculptObjectCanOccupyCell(terrain,id,16,6),false);
   const initial=appendSculptPreviewObject([],{definitionId:id,x:7*28,y:6*21,scale:.6});
   assert.equal(initial.length,1);
   const moved=updateSculptPreviewObject(initial,initial[0].id,{x:9*28,y:6*21});
   assert.equal(moved[0].transform.x,9*28);
   assert.deepEqual(importSculptPreviewScene(serializeSculptPreviewScene(terrain,moved)).objects,moved);
 }
 for(const kind of ['objectdef.relief.waterfall.blue.01','objectdef.rock.granite.01']){
   assert.equal(sculptObjectCanOccupyCell(terrain,kind,9,6),false,
     'do not allow arbitrary objects/legacy waterfall imagery to float on water');
 }
});
test('terrain can rise up to level 16 using SAME canonical brush and saved map, never overflow',()=>{
 const original=createSculptTerrain({width:W,height:H});
 let terrain=original;
 for(let i=0;i<6;i++)terrain=applySculptStroke(terrain,{
   mode:'raise',radius:2,points:[{x:5.5,y:5.5}],strength:3});
 assert.equal(terrain.levels[5*W+5],16);
 assert.equal(original.levels[5*W+5],2);
 assert.ok(terrain.levels.every(h=>h>=0&&h<=16));
 assert.equal(sculptFaces(terrain).some(face=>face.upper===16),true);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(terrain)),terrain);
 const plateau=applySculptStroke(original,{mode:'plateau',target:14,radius:2,
   points:[{x:5.5,y:5.5}]});
 assert.equal(plateau.levels[5*W+5],14);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(plateau)),plateau);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(original)),original);
 const invalid=JSON.parse(serializeSculptTerrain(plateau));
 invalid.levels[0]=17;
 assert.throws(()=>importSculptTerrain(invalid),/invalide/);
});
test('sphere geometry can be authored on already-raised level 12 without a hidden height 7 import cap',()=>{
 const terrain=createSculptTerrain({width:W,height:H,levels:Array(W*H).fill(12)});
 const sphere=appendSculptSphere(terrain,{x:8*28,y:7*21,radius:42,
  kind:'hill',height:3});
 assert.equal(sphere.spheres.length,1);
 assert.equal(sphere.spheres[0].baseLevel,12);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(sphere)),sphere);
});
test('editor retains quick level, detailed slider, water permission on placing AND dragging',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(html,/id="target"[^>]*max="16"/);
 assert.match(html,/Niveau exact 0 à 16/);
 assert.match(main,/const limit=editorKind==='water'\?10:SCULPT_MAX_GROUND_LEVEL/);
 assert.match(main,/Math\.min\(SCULPT_MAX_GROUND_LEVEL,Number\(level\)\)/);
 assert.match(main,/sculptObjectCanOccupyCell\(terrain,definitionId,cell\.x,cell\.y\)/);
 assert.match(main,/sculptObjectCanOccupyCell\(terrain,current\.objectDefinitionId,/);
});
