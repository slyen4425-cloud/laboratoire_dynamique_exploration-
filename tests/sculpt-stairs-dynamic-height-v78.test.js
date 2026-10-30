import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,updateSculptPreviewObject,serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptStairCorridor,sculptStairHeightAt} from '../src/core/sculpt-stair-traversal.js';
import {sculptNavigationBlockDetail} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';

const W=18,H=22,CW=28,CH=21;
const stairId='objectdef.stairs.stone_rustic_2p5d.01';
function setup(){
  const levels=Array.from({length:W*H},(_,i)=>Math.floor(i/W)<8?5:2);
  const terrain=createSculptTerrain({width:W,height:H,levels});
  return {terrain,world:{width:W*CW,height:H*CH,objects:[],obstacles:[]}};
}
function stairs(world,{x=8.5*CW,y=12.5*CH,scaleY=1,scaleX=.4,rotationDeg=0}={}){
  world.objects=appendSculptPreviewObject(world.objects,{definitionId:stairId,
    x,y,scaleX,scaleY,rotationDeg,variantId:'front'});
  return resolveWorldObjectPlacements(world.objects);
}
const context=(terrain,objects)=>({sculptNavigation:{terrain,stairs:objects,
  cellWidth:CW,cellHeight:CH,projectionRise:18,maxStepUp:0,maxStepDown:0,bridges:[]}});
const actor=(x,y)=>({x,y,radius:5,locomotion:{modes:['ground']}});
function drive(world,p,c,y,count=100){
  for(let i=0;i<count;i++)
    stepMovement(world,p,{x:0,y},.04,{maxSpeed:95},undefined,c);
}
test('V78 source bottom and real top terrain, multilevel visual height',()=>{
  const {terrain,world}=setup(),objects=stairs(world);
  const pass=sculptStairCorridor(terrain,objects[0]);
  assert.ok(pass);
  assert.equal(pass.bottomLevel,2);
  assert.equal(pass.topLevel,5);
  assert.equal(pass.length,190);
  assert.equal(sculptStairHeightAt(terrain,objects,objects[0].id,
    pass.foot.x,pass.foot.y-pass.length/2),3.5);
});
test('V78 short stairs blocked; lengthened stairs climb three levels and descend',()=>{
  const {terrain,world}=setup();
  const short=stairs(world,{scaleY:.4});
  assert.equal(sculptStairCorridor(terrain,short[0]),null);
  let p=actor(8.5*CW,13.1*CH);
  drive(world,p,context(terrain,short),-1,95);
  assert.ok(p.y>=8*CH-1e-6);
  world.objects=updateSculptPreviewObject(world.objects,world.objects[0].id,{scaleY:1.05});
  const objects=resolveWorldObjectPlacements(world.objects);
  assert.equal(sculptStairCorridor(terrain,objects[0]).topLevel,5);
  p=actor(8.5*CW,13.1*CH);
  const ctx=context(terrain,objects);
  drive(world,p,ctx,-1,82);
  assert.ok(p.y<7.7*CH,'climb: '+p.y);
  assert.equal(p.sculptStairId,null);
  drive(world,p,ctx,1,82);
  assert.ok(p.y>12.5*CH,'descend: '+p.y);
  assert.equal(p.sculptStairId,null);
});
test('V78 side entry refused; dry endpoints required; rotation and scale are real',()=>{
  const {terrain,world}=setup(),objects=stairs(world);
  const side=actor(8.5*CW+50,11*CH),c=context(terrain,objects);
  assert.ok(sculptNavigationBlockDetail(c.sculptNavigation,side,8.5*CW,11*CH));
  const prior=serializeSculptTerrain(terrain);
  const wet=Array(W*H).fill(-1);wet[3*W+8]=8;
  const wetTerrain=createSculptTerrain({width:W,height:H,
    levels:terrain.levels,waterLevels:wet});
  assert.equal(sculptStairCorridor(wetTerrain,objects[0]),null);
  const wider=resolveWorldObjectPlacements(updateSculptPreviewObject(world.objects,
    world.objects[0].id,{scaleX:.8}));
  assert.ok(sculptStairCorridor(terrain,wider[0]).width>sculptStairCorridor(terrain,objects[0]).width);
  const sideway=resolveWorldObjectPlacements(updateSculptPreviewObject(world.objects,
    world.objects[0].id,{rotationDeg:90}));
  assert.equal(sculptStairCorridor(terrain,sideway[0]),null);
  assert.equal(importSculptPreviewScene(serializeSculptPreviewScene(terrain,world.objects)).objects.length,1);
  assert.equal(serializeSculptTerrain(terrain),prior);
});
test('V78: two connected stairs each read their own foot and head levels',()=>{
  const levels=Array.from({length:W*H},(_,i)=>{
    const row=Math.floor(i/W);return row<8?6:row<14?4:2;
  });
  const terrain=createSculptTerrain({width:W,height:H,levels});
  const world={width:W*CW,height:H*CH,objects:[],obstacles:[]};
  stairs(world,{y:17.5*CH,scaleY:.7});
  stairs(world,{y:11.5*CH,scaleY:.75});
  const objects=resolveWorldObjectPlacements(world.objects);
  assert.equal(objects.length,2);
  assert.deepEqual(objects.map(s=>sculptStairCorridor(terrain,s)?.bottomLevel),[2,4]);
  assert.deepEqual(objects.map(s=>sculptStairCorridor(terrain,s)?.topLevel),[4,6]);
  const p=actor(8.5*CW,18*CH),ctx=context(terrain,objects);
  drive(world,p,ctx,-1,150);
  assert.ok(p.y<7.9*CH,'two stairs should reach the upper level: '+p.y);
  drive(world,p,ctx,1,150);
  assert.ok(p.y>17*CH,'both stairs descend to the base: '+p.y);
  assert.equal(p.sculptStairId,null);
});

test('V78 navigation and length/width UI consume the single staircase corridor',()=>{
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(main,/sculptStairHeightAt\(terrain,/);
  assert.match(main,/stairs:\[\.\.\.resolvedSculptStairs\(\),\.\.\.sculptTerrainRampProjections\(terrain\)\]/,
    'les escaliers validés restent dans le même moteur que les pentes de terrain');
  assert.match(main,/stairMode\?Number\(\$\('object-bridge-length'\)/);
  const movement=readFileSync(new URL('../src/core/movement.js',import.meta.url),'utf8');
  assert.match(movement,/entity\.sculptStairId=next\.stairId/);
});
