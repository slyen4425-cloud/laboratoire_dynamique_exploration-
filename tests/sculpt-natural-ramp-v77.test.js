import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,updateSculptPreviewObject,
  listSculptPlaceableDefinitions,sculptObjectCanOccupyCell,
  serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptStairCorridor,sculptStairHeightAt} from '../src/core/sculpt-stair-traversal.js';
import {sculptRampVisualMesh} from '../src/render/sculpt-ramp-renderer.js';
import {sculptCameraGameView} from '../src/render/sculpt-camera-projection.js';
import {sculptNavigationBlockDetail} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';
import {isBlocked} from '../src/core/collision.js';

const W=18,H=22,CW=28,CH=21;
const pt=(c,row)=>({x:(c+.5)*CW,y:(row+.5)*CH});
const terrainFrom=make=>createSculptTerrain({width:W,height:H,
  levels:Array.from({length:W*H},(_,i)=>make(Math.floor(i/W),i%W))});
const terrain=()=>terrainFrom(row=>row<8?5:2);
const world=()=>({width:W*CW,height:H*CH,objects:[],obstacles:[]});
function add(w,{style='grass',x=pt(8,12).x,y=pt(8,12).y,scaleX=.45,
  scaleY=1,rotationDeg=0}={}){
  w.objects=appendSculptPreviewObject(w.objects,{
    definitionId:'objectdef.ramp.'+style+'.01',x,y,scaleX,scaleY,rotationDeg});
  return resolveWorldObjectPlacements(w.objects);
}
const context=(t,objects)=>({sculptNavigation:{terrain:t,cellWidth:CW,cellHeight:CH,
  projectionRise:18,stairs:objects,bridges:[],maxStepUp:0,maxStepDown:0}});
const actor=(x=pt(8,13).x,y=pt(8,13).y)=>({x,y,radius:5,locomotion:{modes:['ground']}});
function drive(w,p,ctx,y,count=84){
  for(let i=0;i<count;i++)
    stepMovement(w,p,{x:0,y},.04,{maxSpeed:95},undefined,ctx);
}
test('V77: the native palette exposes grass, earth and stone ramps without sprite assets',()=>{
  const list=listSculptPlaceableDefinitions();
  for(const kind of ['grass','earth','stone']){
    const id='objectdef.ramp.'+kind+'.01';
    const def=list.find(d=>d.id===id);
    assert.equal(def?.kind,'ramp');
    assert.ok(def?.baseSize.height>0);
    assert.equal(def?.visual,undefined);
  }
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/value="ramp">⛰️ Pentes/);
  assert.match(html,/natural-ramp-v77/);
  assert.match(main,/drawSculptRamp\(ctx,object,terrain,/);
  assert.match(main,/stairMode=kind==='stairs'\|\|kind==='ramp'/);
  assert.match(main,/o\.kind==='stairs'\|\|o\.kind==='ramp'/);
});
test('V77: the bottom and head are REAL terrain levels; ramp stays independent of serialized heights',()=>{
  const t=terrain(),w=world(),objects=add(w);
  const ramp=sculptStairCorridor(t,objects[0]);
  assert.equal(ramp.kind,'ramp');
  assert.equal(ramp.bottomLevel,2);
  assert.equal(ramp.topLevel,5);
  assert.equal(ramp.length,190);
  assert.ok(ramp.width>24);
  const before=serializeSculptTerrain(t);
  const halfway=sculptStairHeightAt(t,objects,objects[0].id,
    ramp.foot.x,ramp.foot.y-ramp.length/2);
  assert.equal(halfway,3.5);
  assert.equal(serializeSculptTerrain(t),before);
});
test('V77: walking across a ramp climbs 3 levels and descends through Collision World',()=>{
  const t=terrain(),w=world(),objects=add(w),ctx=context(t,objects);
  let p=actor();
  drive(w,p,ctx,-1,84);
  assert.ok(p.y<8*CH,'climbed to upper plateau '+p.y);
  assert.equal(p.sculptStairId,null,'exit upper bank');
  drive(w,p,ctx,1,84);
  assert.ok(p.y>12.5*CH,'descended to low ground '+p.y);
  assert.equal(p.sculptStairId,null,'exit lower bank');
  const bare=world(),unassisted=actor();
  drive(bare,unassisted,context(t,[]),-1,84);
  assert.ok(unassisted.y>=8*CH,'bare cliff remains solid');
});
test('V77: narrow/short/side/rain-soaked and wrong-facing ramps do not grant access',()=>{
  const t=terrain(),w=world(),valid=add(w);
  const side=actor(valid[0].transform.x+48,11*CH);
  assert.ok(sculptNavigationBlockDetail(context(t,valid).sculptNavigation,
    side,valid[0].transform.x,11*CH),'side entry blocked');
  const short=resolveWorldObjectPlacements(updateSculptPreviewObject(w.objects,
    w.objects[0].id,{scaleY:.35}));
  assert.equal(sculptStairCorridor(t,short[0]),null,'top is not a real upper landing');
  const sideways=resolveWorldObjectPlacements(updateSculptPreviewObject(w.objects,
    w.objects[0].id,{rotationDeg:90}));
  assert.equal(sculptStairCorridor(t,sideways[0]),null,'head stays low on wrong axis');
  const wet=Array(W*H).fill(-1);
  wet[3*W+8]=6;
  const rain=createSculptTerrain({width:W,height:H,levels:t.levels,waterLevels:wet});
  assert.equal(sculptStairCorridor(rain,valid[0]),null);
  assert.equal(sculptObjectCanOccupyCell(rain,'objectdef.ramp.grass.01',8,3),false);
  assert.equal(isBlocked(w,actor(),8.5*CW,3.5*CH,undefined,context(t,short)),true);
});
test('V77: several ramps can chain over two terraces and save/import without migration',()=>{
  const t=terrainFrom(row=>row<8?6:row<14?4:2),w=world();
  add(w,{style:'grass',y:17.5*CH,scaleY:.7});
  add(w,{style:'stone',y:11.5*CH,scaleY:.75});
  const objects=resolveWorldObjectPlacements(w.objects);
  assert.deepEqual(objects.map(o=>sculptStairCorridor(t,o)?.bottomLevel),[2,4]);
  assert.deepEqual(objects.map(o=>sculptStairCorridor(t,o)?.topLevel),[4,6]);
  const p=actor(8.5*CW,18*CH),ctx=context(t,objects);
  drive(w,p,ctx,-1,155);
  assert.ok(p.y<8*CH,'two ramps climbed '+p.y);
  drive(w,p,ctx,1,155);
  assert.ok(p.y>17*CH,'two ramps descended '+p.y);
  const saved=serializeSculptPreviewScene(t,w.objects);
  const loaded=importSculptPreviewScene(saved);
  assert.deepEqual(loaded.objects.map(o=>o.objectDefinitionId),
    ['objectdef.ramp.grass.01','objectdef.ramp.stone.01']);
  assert.equal(loaded.objects[1].transform.scaleY,.75);
});
test('V77: procedural slope projects with terrain at all camera angles, no physical mutation',()=>{
  const t=terrain(),w=world(),ramp=add(w)[0];
  const before=serializeSculptTerrain(t);
  const heights=[];
  for(const degrees of [90,55,35]){
    const mesh=sculptRampVisualMesh(t,ramp,{view:sculptCameraGameView(degrees)});
    assert.equal(mesh.valid,true);
    assert.equal(mesh.footLevel,2);
    assert.equal(mesh.headLevel,5);
    const foot=mesh.samples[0],head=mesh.samples.at(-1);
    heights.push(foot.left.y-head.left.y);
    assert.ok(mesh.samples.every(q=>Number.isFinite(q.left.x)&&Number.isFinite(q.right.y)));
  }
  assert.ok(heights[0]>heights[1]&&heights[1]>heights[2]);
  assert.equal(serializeSculptTerrain(t),before);
  const invalid=sculptRampVisualMesh(t,
    resolveWorldObjectPlacements(updateSculptPreviewObject(w.objects,w.objects[0].id,{scaleY:.35}))[0]);
  assert.equal(invalid.valid,false,'unconnected slope must only paint a guide');
});
