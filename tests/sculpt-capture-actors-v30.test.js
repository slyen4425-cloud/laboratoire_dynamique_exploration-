import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {createBlankSculptPreviewScene,serializeSculptPreviewScene,importSculptPreviewScene,
  appendSculptPreviewActor,removeSculptPreviewActorAt,normalizeSculptPreviewActors} from '../src/world/sculpt-scene-preview.js';
import {normalizeWorldActorPlacement} from '../src/actors/world-actor-placement-model.js';

const DEF='capture:creature:crea-loup';
test('V30 scene places Capture Actor Definition using native placement v1',()=>{
  const old=createBlankSculptPreviewScene({width:12,height:12});
  let actors=appendSculptPreviewActor(old.actors,{definitionId:DEF,x:100,y:90,facingX:-1});
  assert.equal(actors.length,1);
  assert.deepEqual(actors[0],normalizeWorldActorPlacement({
    id:'sculpt-actor-1',actorDefinitionId:DEF,x:100,y:90,facingX:-1}));
  const scene=JSON.parse(serializeSculptPreviewScene(old.terrain,[],old.surface,actors));
  assert.equal(scene.actors.length,1);
  const read=importSculptPreviewScene(scene);
  assert.deepEqual(read.actors,actors);
  const removed=removeSculptPreviewActorAt(read.actors,100,90);
  assert.equal(removed.length,0);
  assert.equal(actors.length,1);
});
test('V30 old V27 scenes still import without actors, and a blank map resets actors',()=>{
  const terrain=createSculptTerrain({width:12,height:12});
  const before=JSON.parse(serializeSculptPreviewScene(terrain));
  assert.equal(before.actors,undefined);
  assert.deepEqual(importSculptPreviewScene(before).actors,[]);
  assert.deepEqual(createBlankSculptPreviewScene().actors,[]);
});
test('V30 rejects invalid, duplicated or off-map actor placements',()=>{
  const terrain=createSculptTerrain({width:12,height:12});
  const invalid={id:'actor-1',actorDefinitionId:DEF,x:4,y:5,facingX:1};
  assert.throws(()=>normalizeSculptPreviewActors([invalid,invalid]));
  const scene=JSON.parse(serializeSculptPreviewScene(terrain));
  scene.actors=[{...invalid,x:2000}];
  assert.throws(()=>importSculptPreviewScene(scene),/hors terrain/);
  assert.equal(appendSculptPreviewActor([], {definitionId:'',x:9,y:9}).length,0);
  assert.equal(appendSculptPreviewActor([],{definitionId:DEF,x:Infinity,y:9}).length,0);
});
