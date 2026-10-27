import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptObjectCanOccupyCell,appendSculptPreviewObject,updateSculptPreviewObject,
 serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';

function wetMap(){
 const W=20,H=12,levels=Array(W*H).fill(6),waterLevels=Array(W*H).fill(-1);
 for(let row=1;row<H-1;row++)for(let col=7;col<=11;col++){
  levels[row*W+col]=0;waterLevels[row*W+col]=7;
 }
 return createSculptTerrain({width:W,height:H,levels,waterLevels});
}
test('V64 same native permission governs bridge placement AND dragging into wet gorge',()=>{
 const terrain=wetMap(),bridge='objectdef.bridge.wood_rustic_2p5d.01';
 const from={x:5.5*28,y:5.5*21},to={x:9.5*28,y:5.5*21};
 assert.equal(sculptObjectCanOccupyCell(terrain,bridge,9,5),true);
 assert.equal(sculptObjectCanOccupyCell(terrain,bridge,5,5),true);
 let objects=appendSculptPreviewObject([],{definitionId:bridge,...from,scale:2.5,variantId:'horizontal'});
 assert.equal(objects.length,1);
 objects=updateSculptPreviewObject(objects,objects[0].id,to);
 assert.equal(objects[0].transform.x,to.x);
 assert.equal(objects[0].transform.y,to.y);
 assert.equal(objects[0].transform.scaleX,2.5);
 const scene=importSculptPreviewScene(serializeSculptPreviewScene(terrain,objects));
 assert.deepEqual(scene.objects,objects,'round-trip after dragging over water');
});
test('V64 buildings/trees/rocks still cannot be dragged onto water; bounds stay strict',()=>{
 const t=wetMap();
 for(const id of ['objectdef.building.house.blue_cottage.01',
  'objectdef.bridge.wood_rustic_2p5d.01']){
  assert.equal(sculptObjectCanOccupyCell(t,id,-1,5),false);
  assert.equal(sculptObjectCanOccupyCell(t,id,20,5),false);
 }
 for(const id of ['objectdef.building.house.blue_cottage.01',
   'objectdef.rock.granite.01','objectdef.tree.oak.01']){
  // Unavailable old example definition IDs must fail closed too.
  assert.equal(sculptObjectCanOccupyCell(t,id,9,5),false);
 }
});
test('V64 real pointer path shares same scene policy, not unconditional wetness reject',()=>{
 const src=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(src,/sculptObjectCanOccupyCell\(terrain,current\.objectDefinitionId,/);
 assert.match(src,/sculptObjectCanOccupyCell\(terrain,definitionId,cell\.x,cell\.y\)/);
 assert.doesNotMatch(src,/if\(sculptWaterAt\(terrain,Math\.floor\(x\/SCULPT_TILE\.width\)/);
});
