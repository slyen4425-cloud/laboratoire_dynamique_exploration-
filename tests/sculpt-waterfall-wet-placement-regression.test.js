import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,sculptWaterAt,serializeSculptTerrain,importSculptTerrain}
  from '../src/world/sculpt-height-model.js';
import {sculptObjectCanOccupyCell,appendSculptPreviewObject,updateSculptPreviewObject}
  from '../src/world/sculpt-scene-preview.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {readFileSync} from 'node:fs';

const terrain=createSculptTerrain({width:12,height:12,
  levels:Array(12*12).fill(2),
  waterLevels:Array.from({length:12*12},(_,i)=>i===5*12+5?4:-1)});
const waterfalls=objectDefinitionCatalogV1.list().filter(x=>
  x.kind==='decor'&&x.visual?.assetId?.startsWith('object.waterfall.'));
test('RED: all four canonical animated waterfall definitions are placeable over authored water',()=>{
 assert.equal(waterfalls.length,4,'only the catalog owns waterfalls');
 assert.equal(sculptWaterAt(terrain,5,5),2);
 for(const def of waterfalls){
   assert.equal(sculptObjectCanOccupyCell(terrain,def.id,5,5),true,
     'waterfall '+def.id+' must be allowed at pond base for cliff-to-water drop');
   assert.equal(sculptObjectCanOccupyCell(terrain,def.id,4,5),true);
 }
});
test('wet exception does not authorize buildings, rocks, trees, stairs or any non-waterfall decor',()=>{
 for(const def of objectDefinitionCatalogV1.list().filter(d=>['building','tree','rock','stairs'].includes(d.kind)))
   assert.equal(sculptObjectCanOccupyCell(terrain,def.id,5,5),false,def.id);
 const otherDecor=objectDefinitionCatalogV1.list().filter(d=>d.kind==='decor'&&
   !d.visual?.assetId?.startsWith('object.waterfall.')&&!d.id.startsWith('objectdef.relief.'));
 assert.equal(sculptObjectCanOccupyCell(terrain,'objectdef.relief.waterfall.blue.01',5,5),false,
   'legacy relief decoration is not a placeable animated waterfall');
 for(const def of otherDecor)
   assert.equal(sculptObjectCanOccupyCell(terrain,def.id,5,5),false,def.id);
 assert.equal(sculptObjectCanOccupyCell(terrain,'objectdef.bridge.wood_rustic_2p5d.01',5,5),true);
 assert.equal(sculptObjectCanOccupyCell(terrain,waterfalls[0].id,12,5),false);
});
test('same wet placement permission protects initial placement and object dragging; no terrain mutation',()=>{
 const def=waterfalls[0];
 const raw=serializeSculptTerrain(terrain);
 let objects=appendSculptPreviewObject([],{
   definitionId:def.id,x:5.5*28,y:5.5*21,scale:.6});
 assert.equal(objects.length,1);
 assert.equal(objects[0].objectDefinitionId,def.id);
 assert.equal(sculptObjectCanOccupyCell(terrain,def.id,5,5),true);
 objects=updateSculptPreviewObject(objects,objects[0].id,{x:5.6*28,y:5.6*21});
 assert.equal(objects.length,1);
 assert.equal(objects[0].transform.x,5.6*28);
 assert.deepEqual(importSculptTerrain(raw).waterLevels,terrain.waterLevels);
});
test('editor, pointer dragging and generated map presets rely on the same canonical permission',()=>{
 const editor=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const presets=readFileSync(new URL('../src/builder/sculpt-builtin-map-presets.js',import.meta.url),'utf8');
 assert.match(editor,/if\(!sculptObjectCanOccupyCell\(terrain,definitionId,cell\.x,cell\.y\)\)/);
 assert.match(editor,/if\(!current\|\|!sculptObjectCanOccupyCell\(terrain,current\.objectDefinitionId,/);
 assert.match(presets,/sculptObjectCanOccupyCell\(terrain,id,/);
});
