import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCULPT_DECORATIVE_FRINGE_SCHEMA,createSculptDecorativeFringeV1,
  sculptDecorativeFringeCellIsOuterV1,paintSculptDecorativeFringeV1,
  placeSculptDecorativeFringeObjectV1,normalizeSculptDecorativeFringeV1
} from '../src/world/sculpt-decorative-fringe-v1.js';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';

const raw={id:'forest',kind:'exterior',width:36*28,height:24*21,
  spawns:[{id:'home',x:300,y:200}],objects:[],
  encounters:{randomEnabled:true}};
const original=normalizeWorldArea(raw);

test('the editable fringe is outside all FOUR original gameplay borders',()=>{
  for(const [x,y] of [[-1,12],[36,12],[12,-1],[12,24]])
    assert.equal(sculptDecorativeFringeCellIsOuterV1(original,x,y),true);
  for(const [x,y] of [[0,0],[35,23],[-9,0],[44,0],[0,32]])
    assert.equal(sculptDecorativeFringeCellIsOuterV1(original,x,y),false);
});

test('decorative sculpt uses exactly the original terrain brush and cannot touch playable terrain',()=>{
  const fringe=createSculptDecorativeFringeV1(original);
  const after=paintSculptDecorativeFringeV1(fringe,original,
    {col:-2,row:6,mode:'raise',strength:3,radius:.5});
  assert.equal(after.schema,SCULPT_DECORATIVE_FRINGE_SCHEMA);
  assert.equal(after.chunks.length,1);
  const chunk=after.chunks[0];
  assert.equal(chunk.col,-8);
  assert.equal(chunk.row,0);
  assert.equal(chunk.terrain.levels[6*8+6],5);
  assert.throws(()=>paintSculptDecorativeFringeV1(after,original,{col:2,row:6,mode:'raise'}),/outside playable/);
  assert.deepEqual(original,normalizeWorldArea(raw),'gameplay area remains byte-for-byte equal');
  assert.deepEqual(normalizeSculptDecorativeFringeV1(JSON.parse(JSON.stringify(after)),original),after);
});

test('decorative objects remain outside base world and are never copied into collisions',()=>{
  const fringe=createSculptDecorativeFringeV1(original);
  const outdoor={id:'visual-rock',objectDefinitionId:'rock-granite',
    transform:{x:-28,y:12*21,rotationDeg:0,scaleX:1,scaleY:1}};
  const updated=placeSculptDecorativeFringeObjectV1(fringe,original,outdoor);
  const world=normalizeWorldArea({...raw,decorativeFringe:updated});
  assert.equal(world.objects.length,0);
  assert.equal(world.spawns[0].x,300);
  assert.equal(world.width,raw.width);
  assert.equal(world.height,raw.height);
  assert.equal(world.decorativeFringe.objects.length,1);
  assert.equal(sculptWorldAreaScene(world).decorativeFringe.objects.length,1);
  assert.throws(()=>placeSculptDecorativeFringeObjectV1(updated,original,
    {...outdoor,id:'illegal',transform:{x:300,y:200}}),/outside the playable area/);
});
