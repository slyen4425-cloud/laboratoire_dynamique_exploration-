import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,sculptPreviewVariants,updateSculptPreviewObject,
  importSculptPreviewScene,serializeSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {resolveWorldObjectAsset} from '../src/assets/world-object-asset-adapter.js';

test('V23 native catalog houses have selectable front/side/back visuals with existing actual assets',()=>{
  for(const id of ['objectdef.building.house.blue_cottage.01',
    'objectdef.building.house.red_tile.01','objectdef.building.inn.golden_thatch.01']){
    const perspectives=sculptPreviewVariants(id);
    assert.deepEqual(perspectives.map(v=>v.id),['front','side','back']);
    for(const perspective of perspectives)assert.ok(resolveWorldObjectAsset(perspective.assetId));
  }
  assert.deepEqual(sculptPreviewVariants('objectdef.tree.forest.oak.01'),[]);
});
test('V23 scene placements preserve view override on export/import; existing V20 import still valid',()=>{
  const terrain=createSculptTerrain({width:18,height:16}),source=serializeSculptTerrain(terrain);
  let objects=appendSculptPreviewObject([],{definitionId:'objectdef.building.house.blue_cottage.01',
    x:180,y:150,scale:.45,rotationDeg:91,variantId:'side'});
  assert.equal(objects[0].overrides.visualVariantId,'side');
  assert.equal(resolveWorldObjectPlacements(objects)[0].visual.assetId,
    'object.building.house.blue_cottage.side.01');
  const firstId=objects[0].id;
  objects=updateSculptPreviewObject(objects,firstId,{rotationDeg:137,scale:.55,variantId:'back'});
  assert.equal(objects[0].id,firstId);
  assert.equal(objects[0].transform.rotationDeg,137);
  assert.equal(objects[0].transform.scaleX,.55);
  assert.equal(resolveWorldObjectPlacements(objects,objectDefinitionCatalogV1)[0].visual.assetId,
    'object.building.house.blue_cottage.back.01');
  const data=serializeSculptPreviewScene(terrain,objects);
  const loaded=importSculptPreviewScene(data);
  assert.deepEqual(loaded.objects,objects);
  assert.equal(serializeSculptTerrain(loaded.terrain),source);
  assert.equal(importSculptPreviewScene(source).objects.length,0);
  objects=updateSculptPreviewObject(objects,firstId,{variantId:'fake'});
  assert.equal(objects[0].overrides.visualVariantId,null,'unknown asset override cannot leak');
});
test('V23 editor exposes variants and selected editing without injecting views in world geometry',()=>{
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(main,/sculptPreviewVariants/);
  assert.match(main,/updateSculptPreviewObject/);
  assert.match(main,/objectSelectedId/);
  for(const id of ['object-variant','object-variant-wrap','object-selected','object-turn-left','object-turn-right']){
    assert.equal((page.match(new RegExp('id="'+id+'"','g'))??[]).length,1);
  }
  assert.match(page,/step="1" value="0"/);
});
