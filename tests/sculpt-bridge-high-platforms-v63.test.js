import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {sculptBridgeBankHeights,sculptNavigationBlockDetail,sculptBridgeDeckAt,
  sculptBridgeDeckHeight} from '../src/core/sculpt-navigation-collision.js';
import {sculptObjectVisualRect} from '../src/render/sculpt-object-picking.js';
import {stepMovement} from '../src/core/movement.js';
import {isBlocked} from '../src/core/collision.js';

const CW=28,CH=21,W=20,H=12,point=(col,row)=>({x:(col+.5)*CW,y:(row+.5)*CH});
function terrain({wet=false,left=6,right=6}={}){
 const levels=Array(W*H),waterLevels=Array(W*H).fill(-1);
 for(let row=0;row<H;row++)for(let col=0;col<W;col++){
  const i=row*W+col;
  levels[i]=col<7?left:col>11?right:0;
  if(wet&&col>=7&&col<=11)waterLevels[i]=8;
 }
 return createSculptTerrain({width:W,height:H,levels,waterLevels});
}
function bridge({scale=1.1,variantId='horizontal',rotationDeg=0}={}){
 const placements=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
   ...point(9,5),scale,variantId,rotationDeg});
 const objects=resolveWorldObjectPlacements(placements);
 return {placements,objects};
}
const actor=(c=5,r=5)=>({...point(c,r),radius:5,locomotion:{modes:['ground']},
 facingX:1,moving:false});
const world=(placements=[])=>({width:W*CW,height:H*CH,objects:placements,obstacles:[]});
const nav=(t,objects)=>({sculptNavigation:{terrain:t,bridges:objects,cellWidth:CW,
 cellHeight:CH,maxStepUp:2,maxStepDown:2,shoreEntryFraction:.14}});

test('V63 two ENTIRE high plateaus: actual bidirectional walk across deep dry/wet chasm with bridge scales',()=>{
 for(const wet of [false,true])for(const scale of [1.1,1.4,2,2.5,3]){
  const t=terrain({wet}),original=serializeSculptTerrain(t);
  const {placements,objects}=bridge({scale});
  const c=nav(t,objects),w=world(placements),p=actor(5,5),end=point(13,5);
  const banks=sculptBridgeBankHeights(t,bridgeTraversalRect(objects[0]),{cellWidth:CW,cellHeight:CH});
  assert.deepEqual(banks,[6,6],`bridge banks ${scale} wet=${wet}`);
  assert.equal(sculptBridgeDeckHeight(t,objects,point(9,5).x,point(9,5).y),6);
  assert.equal(sculptObjectVisualRect(objects[0],t).y,point(9,5).y-6*18);
  const collision=isBlocked(w,p,end.x,end.y,undefined,c);
  assert.equal(collision,false,`collision blocked whole-plateau bridge wet=${wet} scale=${scale} reason=${JSON.stringify(sculptNavigationBlockDetail(c.sculptNavigation,p,end.x,end.y))}`);
  stepMovement(w,p,{x:1,y:0},3.4,{maxSpeed:75},undefined,c);
  assert.ok(p.x>point(12,5).x,`actor did not REACH other high plateau wet=${wet} scale=${scale} got=${p.x}`);
  stepMovement(w,p,{x:-1,y:0},3.4,{maxSpeed:75},undefined,c);
  assert.ok(p.x<point(7,5).x,`actor could not return across bridge wet=${wet} scale=${scale} got=${p.x}`);
  assert.equal(serializeSculptTerrain(t),original,'no heightfield or water mutation');
 }
});
test('V63 bridges too short cannot magically span two real elevated platforms',()=>{
 for(const wet of [false,true]){
  const t=terrain({wet}),{placements,objects}=bridge({scale:.5}),p=actor();
  stepMovement(world(placements),p,{x:1,y:0},4,{maxSpeed:75},undefined,nav(t,objects));
  assert.ok(p.x<point(12,5).x,`short bridge must not cross gap wet=${wet}`);
 }
});
test('V63 two different high bank levels and no-bridge/off-axis retain strict collision',()=>{
 const t=terrain({left:5,right:7}),{placements,objects}=bridge({scale:1.25});
 const p=actor(),dest=point(13,5),c=nav(t,objects);
 assert.deepEqual(sculptBridgeBankHeights(t,bridgeTraversalRect(objects[0]),{cellWidth:CW,cellHeight:CH}),[5,7]);
 assert.equal(isBlocked(world(placements),p,dest.x,dest.y,undefined,c),false);
 assert.equal(isBlocked(world([]),actor(),dest.x,dest.y,undefined,nav(t,[])),true);
 const other=actor(5,2),bad=point(13,2);
 const offNav=nav(t,objects);
 assert.equal(sculptBridgeDeckAt(objects,point(9,2).x,point(9,2).y,5),null);
 assert.equal(isBlocked(world(placements),other,bad.x,bad.y,undefined,offNav),true);
});
test('V63 surface is high on both sides for MULTIPLE rows, not a 1-row fake gorge',()=>{
 const t=terrain({wet:true});
 for(let row=0;row<H;row++){
  assert.equal(t.levels[row*W+6],6);
  assert.equal(t.levels[row*W+12],6);
  assert.equal(t.levels[row*W+9],0);
  assert.equal(t.waterLevels[row*W+9],8);
 }
});

test('V63 two tall platform shores separated by MULTI-ROW canyon, vertical bridge forwards and reverse',()=>{
 const H2=18,W2=20,center={x:9.5*CW,y:8.5*CH};
 for(const wet of [false,true])for(const scale of [1.1,1.4]){
  const levels=Array(W2*H2),waterLevels=Array(W2*H2).fill(-1);
  for(let row=0;row<H2;row++)for(let col=0;col<W2;col++){
    const index=row*W2+col;
    levels[index]=row<6||row>11?6:0;
    if(wet&&row>=6&&row<=11)waterLevels[index]=9;
  }
  const t=createSculptTerrain({width:W2,height:H2,levels,waterLevels});
  const placed=appendSculptPreviewObject([],{
    definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
    ...center,variantId:'vertical',scale
  });
  const objects=resolveWorldObjectPlacements(placed);
  const context={sculptNavigation:{terrain:t,bridges:objects,cellWidth:CW,cellHeight:CH,maxStepUp:2,maxStepDown:2}};
  const w={width:W2*CW,height:H2*CH,objects:placed,obstacles:[]};
  const a={x:center.x,y:4.5*CH,radius:5,locomotion:{modes:['ground']}};
  const destY=14.5*CH;
  assert.deepEqual(sculptBridgeBankHeights(t,bridgeTraversalRect(objects[0]),{cellWidth:CW,cellHeight:CH}),[6,6]);
  assert.equal(isBlocked(w,a,a.x,destY,undefined,context),false,`vertical wet=${wet} scale=${scale}`);
  stepMovement(w,a,{x:0,y:1},3.1,{maxSpeed:80},undefined,context);
  assert.ok(a.y>12.5*CH,`vertical did not arrive wet=${wet} scale=${scale} y=${a.y}`);
  stepMovement(w,a,{x:0,y:-1},3.1,{maxSpeed:80},undefined,context);
  assert.ok(a.y<6.5*CH,`vertical failed reverse wet=${wet} scale=${scale} y=${a.y}`);
 }
});
