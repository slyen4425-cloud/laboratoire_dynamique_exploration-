import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {sculptNavigationBlockDetail,sculptBridgeDeckAt,sculptBridgeDeckHeight} from '../src/core/sculpt-navigation-collision.js';
import {isBlocked} from '../src/core/collision.js';
import {stepMovement} from '../src/core/movement.js';

const W=12,H=9,CW=28,CH=21;
const point=(c,r)=>({x:(c+.5)*CW,y:(r+.5)*CH});
const actor=(c,r)=>({...point(c,r),radius:5,locomotion:{modes:['ground']},facingX:1});
const river=(axis='horizontal')=>{
  const levels=Array(W*H).fill(2),waterLevels=Array(W*H).fill(-1);
  if(axis==='horizontal')for(const c of [4,5,6]){levels[4*W+c]=1;waterLevels[4*W+c]=4;}
  else for(const row of [3,4,5]){levels[row*W+5]=1;waterLevels[row*W+5]=4;}
  return createSculptTerrain({width:W,height:H,levels,waterLevels});
};
const bridge=(variant,scale=.9,rotationDeg=0)=>{
  const placements=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
    ...point(5,4),scale,rotationDeg,variantId:variant});
  return {placements,objects:resolveWorldObjectPlacements(placements,objectDefinitionCatalogV1)};
};
const world=objects=>({width:W*CW,height:H*CH,objects,obstacles:[]});
const context=(terrain,bridges)=>({sculptNavigation:{terrain,cellWidth:CW,cellHeight:CH,
  maxStepUp:1,maxStepDown:1,bridges},objectCatalog:objectDefinitionCatalogV1});

test('V55 horizontal deck really crosses deep water and stops without bridge / off deck',()=>{
  const t=river(),before=serializeSculptTerrain(t),p=actor(3,4),destination=point(7,4);
  const {placements,objects}=bridge('horizontal');
  assert.equal(isBlocked(world([]),p,destination.x,destination.y,undefined,context(t,[])),true);
  assert.equal(isBlocked(world(placements),p,destination.x,destination.y,undefined,context(t,objects)),false);
  const off=actor(3,2),other=point(5,2);
  assert.equal(sculptBridgeDeckAt(objects,other.x,other.y,off.radius),null);
  stepMovement(world(placements),p,{x:1,y:0},2.4,{maxSpeed:60},undefined,context(t,objects));
  assert.ok(p.x>7*CW,'real movement must cross wet cells on the bridge');
  assert.equal(serializeSculptTerrain(t),before,'bridge passage cannot rewrite water');
  assert.deepEqual(importSculptPreviewScene(serializeSculptPreviewScene(t,placements)).objects,placements);
  assert.equal(sculptBridgeDeckHeight(t,objects,point(5,4).x,point(5,4).y,{cellWidth:CW,cellHeight:CH}),2);
});
test('V55 vertical and diagonal artwork have declared traversal axes, not inferred image pixels',()=>{
  const t=river('vertical');
  const {objects,placements}=bridge('vertical');
  assert.equal(Math.round(bridgeTraversalRect(objects[0]).rotation*180/Math.PI),90);
  const north=actor(5,2),south=point(5,6);
  assert.equal(sculptNavigationBlockDetail(context(t,objects).sculptNavigation,north,south.x,south.y),null);
  assert.equal(isBlocked(world(placements),north,south.x,south.y,undefined,context(t,objects)),false);
  const oblique=bridge('diagonal_left',.9,15).objects[0];
  assert.equal(Math.round(bridgeTraversalRect(oblique).rotation*180/Math.PI),-30);
  const other=bridge('diagonal_right',.9,-15).objects[0];
  assert.equal(Math.round((bridgeTraversalRect(other).rotation*180/Math.PI+360)%360),30);
  assert.equal(objectDefinitionCatalogV1.get('objectdef.bridge.wood.rustic_bank.01').traversal.viewAxesDeg,undefined,
    'historical native bridge unchanged');
});
test('V55 rejects off-corridor water and steep cliffs; bridge radius respects scale',()=>{
  const t=river(),{objects}=bridge('horizontal',.9);
  const wetOffAxis=point(5,2);
  assert.equal(sculptBridgeDeckAt(objects,wetOffAxis.x,wetOffAxis.y,5),null);
  assert.ok(sculptNavigationBlockDetail(context(t,[]).sculptNavigation,actor(3,4),point(5,4).x,point(5,4).y));
  const narrow=bridge('horizontal',.25).objects;
  assert.equal(sculptBridgeDeckAt(narrow,point(7,4).x,point(7,4).y,5),null);
  const levels=Array(W*H).fill(2);
  levels[4*W+5]=7;
  const steep=createSculptTerrain({width:W,height:H,levels});
  const blocked=sculptNavigationBlockDetail(context(steep,objects).sculptNavigation,
    actor(4,4),point(6,4).x,point(6,4).y);
  assert.equal(blocked?.kind,'height-up');
});
test('V55 UI supplies resolved bridge collision geometry and visual deck height',()=>{
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const nav=readFileSync(new URL('../src/core/sculpt-navigation-collision.js',import.meta.url),'utf8');
  assert.match(main,/bridges:resolvedSculptBridges\(\)/);
  assert.match(main,/sculptBridgeDeckHeight\(terrain,resolvedSculptBridges\(\)/);
  assert.match(nav,/bridgeTraversalRect\(bridge\)/);
  assert.doesNotMatch(nav,/visual\.assetId|image\.src|\.naturalWidth/);
});
