import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {listSculptPlaceableDefinitions,appendSculptPreviewObject,removeSculptPreviewObject,
  findSculptPreviewObjectNear,serializeSculptPreviewScene,importSculptPreviewScene
} from '../src/world/sculpt-scene-preview.js';
import {isBlocked} from '../src/core/collision.js';
import {readFileSync} from 'node:fs';

test('V20 native buildings, trees and rocks appear without copying any asset registry',()=>{
  const defs=listSculptPlaceableDefinitions();
  for(const kind of ['building','tree','rock'])assert.ok(defs.some(d=>d.kind===kind));
  assert.ok(!defs.some(d=>d.id.includes('.relief.')),'cliff sprites must not replace sculpted geometry');
  const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  for(const id of ['mode-objects','object-palette','object-category','object-definition',
    'object-action','object-scale','object-rotation','object-undo','object-redo','scene-export'])
    assert.equal((page.match(new RegExp('id="'+id+'"','g'))??[]).length,1);
});
test('V20 canonical WorldObject placement round-trips together with old sculpt heights',()=>{
  const terrain=createSculptTerrain({width:20,height:16});
  const source=serializeSculptTerrain(terrain);
  let objects=appendSculptPreviewObject([],{definitionId:'objectdef.building.house.blue_cottage.01',
    x:180,y:140,scale:.4,rotationDeg:90});
  objects=appendSculptPreviewObject(objects,{definitionId:'objectdef.tree.forest.oak.01',
    x:215,y:126,scale:.35});
  assert.equal(objects.length,2);
  assert.ok(Object.isFrozen(objects));
  assert.equal(objects[0].objectDefinitionId,'objectdef.building.house.blue_cottage.01');
  const target=serializeSculptPreviewScene(terrain,objects);
  const loaded=importSculptPreviewScene(target);
  assert.equal(loaded.isScene,true);
  assert.deepEqual(loaded.objects,objects);
  assert.equal(serializeSculptTerrain(loaded.terrain),source);
  assert.equal(importSculptPreviewScene(source).objects.length,0,'legacy v1 terrain remains supported');
  assert.equal(JSON.parse(source).objects,undefined,'old height export must not be changed');
  const found=findSculptPreviewObjectNear(objects,180,140);
  assert.equal(found?.id,objects[0].id);
  assert.equal(removeSculptPreviewObject(objects,found.id).length,1);
});
test('V20 native building collisions are resolved by existing Collision World',()=>{
  const terrain=createSculptTerrain({width:20,height:16});
  const objects=appendSculptPreviewObject([],{definitionId:'objectdef.building.house.blue_cottage.01',
    x:180,y:140,scale:.4});
  const world={width:terrain.width*28,height:terrain.height*21,objects,obstacles:[]};
  const actor={x:60,y:140,radius:5,locomotion:{modes:['ground']}};
  assert.equal(isBlocked(world,actor,180,140),true);
  assert.equal(isBlocked(world,actor,60,140),false);
});
test('V20 malformed/unknown scene objects fail safely, no arbitrary URLs or phantom gameplay',()=>{
  const terrain=createSculptTerrain({width:12,height:8});
  const scene=JSON.parse(serializeSculptPreviewScene(terrain,[]));
  scene.objects=[{objectDefinitionId:'rogue.asset.path',transform:{x:10,y:10}}];
  assert.throws(()=>importSculptPreviewScene(scene),/invalid|invalide/);
  scene.objects=[{objectDefinitionId:'objectdef.building.house.blue_cottage.01',
    transform:{x:9000,y:9000}}];
  assert.throws(()=>importSculptPreviewScene(scene),/hors terrain/);
  const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(source,/resolveWorldObjectAsset/);
  assert.match(source,/objects:placedObjects/);
  assert.match(source,/serializeSculptPreviewScene/);
  assert.doesNotMatch(source,/new WorldDocument|location\.reload\(/);
});
