import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,applySculptStroke,sculptHeightAt,
  appendSculptSphere,serializeSculptTerrain,importSculptTerrain,SCULPT_TERRAIN_MAX_LEVEL}
  from '../src/world/sculpt-height-model.js';
import {sculptObjectCanOccupyCell,appendSculptPreviewObject,
  updateSculptPreviewObject,serializeSculptPreviewScene,importSculptPreviewScene}
  from '../src/world/sculpt-scene-preview.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {applySculptWaterStroke} from '../src/world/sculpt-height-model.js';

const W=18,H=18;
const waterfallIds=['front_wide','side_narrow','three_quarter','tiered']
  .map(x=>'objectdef.waterfall.'+x+'.01');
const pond=()=>applySculptWaterStroke(createSculptTerrain({width:W,height:H}),
 {mode:'water-fill',target:6,radius:3,points:[{x:9.5,y:9.5}]});
test('all four waterfall definitions can be authored ON water, ordinary buildings cannot',()=>{
 const t=pond();
 assert.equal(sculptObjectCanOccupyCell(t,waterfallIds[0],9,9),true);
 for(const id of waterfallIds){
   const def=objectDefinitionCatalogV1.require(id);
   assert.equal(def.kind,'decor');
   assert.equal(def.placement?.waterAllowed,true,
     'water placement permission must belong to original ObjectDefinition');
   assert.equal(sculptObjectCanOccupyCell(t,id,9,9),true);
   assert.equal(sculptObjectCanOccupyCell(t,id,1,1),true);
   assert.equal(sculptObjectCanOccupyCell(t,id,-1,9),false);
 }
 assert.equal(sculptObjectCanOccupyCell(t,'objectdef.bridge.wood_rustic_2p5d.01',9,9),true);
 const dryBuilding=objectDefinitionCatalogV1.list().find(x=>x.kind==='building');
 assert.ok(dryBuilding);
 assert.equal(sculptObjectCanOccupyCell(t,dryBuilding.id,9,9),false);
});
test('waterfall on the pond stays movable, persists in scene, preserving authored water',()=>{
 const t=pond(),x=9.5*28,y=9.5*21;
 const placed=appendSculptPreviewObject([],{definitionId:waterfallIds[0],x,y,
  scale:.48,variantId:'clear_blue'});
 assert.equal(placed.length,1);
 assert.equal(sculptObjectCanOccupyCell(t,placed[0].objectDefinitionId,9,9),true);
 const moved=updateSculptPreviewObject(placed,placed[0].id,{x:x+28,y:y+21});
 assert.equal(moved[0].transform.x,x+28);
 const before=JSON.stringify(t);
 const scene=importSculptPreviewScene(serializeSculptPreviewScene(t,moved));
 assert.equal(scene.objects[0].objectDefinitionId,waterfallIds[0]);
 assert.equal(scene.objects[0].transform.x,x+28);
 assert.equal(JSON.stringify(t),before);
});
test('terrain can rise to 16 levels with one shared model limit and save/import exact heights',()=>{
 assert.equal(SCULPT_TERRAIN_MAX_LEVEL,16);
 let terrain=createSculptTerrain({width:W,height:H});
 for(let i=0;i<20;i++)terrain=applySculptStroke(terrain,
  {mode:'raise',strength:3,radius:1,points:[{x:9.5,y:9.5}]});
 assert.equal(sculptHeightAt(terrain,9,9),16);
 const flat=applySculptStroke(terrain,{mode:'plateau',target:12,radius:1,
   points:[{x:9.5,y:9.5}]});
 assert.equal(sculptHeightAt(flat,9,9),12);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(terrain)),terrain);
 const level16=createSculptTerrain({width:W,height:H,levels:Array(W*H).fill(16)});
 assert.equal(sculptHeightAt(level16,0,0),16);
 const illegal=JSON.parse(serializeSculptTerrain(level16));illegal.levels[0]=17;
 assert.throws(()=>importSculptTerrain(illegal),/invalide/);
 // Old 7-level saves remain a supported subset of schemaVersion 1.
 const old=createSculptTerrain({width:W,height:H,levels:Array(W*H).fill(7)});
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(old)),old);
});
test('the same height control allows taller hills without a parallel height authority',()=>{
 const terrain=createSculptTerrain({width:32,height:28});
 const raised=appendSculptSphere(terrain,{kind:'hill',x:14*28,y:13*21,
  radius:80,height:12});
 assert.equal(raised.spheres[0]?.height,12);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(raised)),raised);
});
test('mobile terrain slider, camera and raster use shared height cap; water unchanged',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(html,/id="target"[^>]*max="16"/);
 assert.match(html,/id="water-target"[^>]*max="10"/);
 assert.match(ui,/SCULPT_TERRAIN_MAX_LEVEL/);
 assert.doesNotMatch(ui,/7\*SCULPT_TILE\.rise/);
 assert.doesNotMatch(ui,/editorKind==='water'\?10:7/);
 const presets=readFileSync(new URL('../src/builder/sculpt-builtin-map-presets.js',import.meta.url),'utf8');
 assert.match(presets,/sculptObjectCanOccupyCell/);
 assert.doesNotMatch(presets,/id\.startsWith\('objectdef\.waterfall\.'/);
});
