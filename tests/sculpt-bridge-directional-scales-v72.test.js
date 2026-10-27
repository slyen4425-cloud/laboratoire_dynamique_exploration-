import test from 'node:test';
import assert from 'node:assert/strict';
import {listNativeObjectDefinitions} from '../src/objects/object-definition-catalog.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,updateSculptPreviewObject,
  serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {sculptObjectVisualRect} from '../src/render/sculpt-object-picking.js';
import {orientedWorldPoint,orientedLocalPoint} from '../src/core/geometry.js';
import {sculptNavigationBlockDetail,sculptNavigationRoute} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';

const defs=listNativeObjectDefinitions().filter(d=>d.kind==='bridge'&&
  d.visual?.assetId?.includes('_2p5d.'));
const terrain=createSculptTerrain({width:40,height:40,levels:Array(1600).fill(6)});
const at=(id,variant,scaleX=1.4,scaleY=.8,rotationDeg=0)=>{
  const objects=appendSculptPreviewObject([],{definitionId:id,x:560,y:420,
    variantId:variant,scaleX,scaleY,rotationDeg});
  return {objects,bridge:resolveWorldObjectPlacements(objects)[0]};
};
const actor=(point,id)=>({...point,radius:5,locomotion:{modes:['ground']},
  sculptBridgeId:id,facingX:1,moving:false});
const close=(a,b)=>Math.abs(a-b)<1e-7;
test('V72 longitudinal width/length controls are distinct and survive scene export/import',()=>{
  assert.equal(defs.length,7);
  for(const def of defs)for(const variant of ['horizontal','vertical','diagonal_left','diagonal_right']){
    const {objects,bridge}=at(def.id,variant,2.5,.65);
    assert.equal(objects[0].transform.scaleX,2.5);
    assert.equal(objects[0].transform.scaleY,.65);
    assert.equal(bridge.transform.scaleX,2.5);
    assert.equal(bridge.transform.scaleY,.65);
    const deck=bridgeTraversalRect(bridge);
    assert.ok(close(deck.length,170*2.5*.92),'length axis');
    assert.ok(close(deck.width,96*.65*.35),'width axis');
    const changed=updateSculptPreviewObject(objects,objects[0].id,{scaleX:2.8});
    assert.equal(changed[0].transform.scaleX,2.8);
    assert.equal(changed[0].transform.scaleY,.65,'editing length cannot expand the rails');
    const narrowed=updateSculptPreviewObject(changed,objects[0].id,{scaleY:.5});
    assert.equal(narrowed[0].transform.scaleX,2.8,'editing width cannot shorten crossing');
    assert.equal(narrowed[0].transform.scaleY,.5);
    const exported=serializeSculptPreviewScene(terrain,narrowed);
    const imported=importSculptPreviewScene(exported);
    assert.deepEqual(imported.objects,narrowed,'canonical scales must round trip unchanged');
    assert.equal(bridgeTraversalRect(resolveWorldObjectPlacements(imported.objects)[0]).width,
      96*.5*.35);
    const legacy=appendSculptPreviewObject([],{definitionId:def.id,x:560,y:420,scale:1.25,
      variantId:variant});
    assert.equal(legacy[0].transform.scaleX,1.25);
    assert.equal(legacy[0].transform.scaleY,1.25,'old scenes and authoring remain compatible');
  }
});
test('V72 vertical bridge bitmap is longitudinal along Y exactly as physical deck is',()=>{
  for(const def of defs)for(const length of [.5,1.1,2.5,3])
  for(const width of [.5,.75,1.8,3]){
    const {bridge}=at(def.id,'vertical',length,width);
    const drawn=sculptObjectVisualRect(bridge,terrain);
    const deck=bridgeTraversalRect(bridge);
    assert.ok(close(drawn.width,96*width),'vertical visible transverse width');
    assert.ok(close(drawn.height,170*length),'vertical visible longitudinal height');
    assert.ok(close(deck.length,drawn.height*.92),'vertical deck matches visible length');
    assert.ok(close(deck.width,drawn.width*.35),'vertical passage centered');
    assert.ok(close(deck.rotation,Math.PI/2),'no extra rotation applied to bitmap');
    assert.ok(close(drawn.x,bridge.transform.x));
    assert.ok(close(drawn.y,bridge.transform.y-6*18));
    const horiz=at(def.id,'horizontal',length,width).bridge;
    const old=sculptObjectVisualRect(horiz,terrain);
    assert.ok(close(old.width,170*length),'horizontal visuals must not regress');
    assert.ok(close(old.height,96*width));
  }
});
test('V72 after resizing, true Collision World still blocks vertical edges on both sides',()=>{
  for(const def of defs)for(const variant of ['horizontal','vertical'])
  for(const [sx,sy] of [[.75,.5],[2.5,.6],[1.2,2.7]])for(const side of [-1,1]){
    const {bridge,objects}=at(def.id,variant,sx,sy);
    const deck=bridgeTraversalRect(bridge);
    const middle=orientedWorldPoint(0,0,deck);
    const start=actor(middle,bridge.id);
    const lateral={x:-Math.sin(deck.rotation)*side,y:Math.cos(deck.rotation)*side};
    const nav={terrain,bridges:[bridge],cellWidth:28,cellHeight:21,maxStepUp:2,maxStepDown:2};
    const ctx={sculptNavigation:nav},world={width:1120,height:840,objects,obstacles:[]};
    const limit=deck.width/2-start.radius-1;
    assert.ok(limit>0,'minimum bridge still wider than actor');
    stepMovement(world,start,lateral,limit/75,{maxSpeed:75},undefined,ctx);
    const reached=orientedLocalPoint(start.x,start.y,deck);
    assert.ok(close(reached.y,side*limit),'actor reaches inner passage');
    const anchored={x:start.x,y:start.y,id:start.sculptBridgeId};
    stepMovement(world,start,lateral,5/75,{maxSpeed:75},undefined,ctx);
    assert.deepEqual({x:start.x,y:start.y,id:start.sculptBridgeId},anchored,
      'must not leave bridge layer or overlap the rail');
    const centerLine=orientedWorldPoint(deck.length*.22,0,deck);
    const pass=sculptNavigationRoute(nav,actor(middle,bridge.id),centerLine.x,centerLine.y);
    assert.equal(pass.reason,null);
    assert.equal(pass.bridgeId,bridge.id);
    assert.equal(sculptNavigationBlockDetail(nav,start,
      start.x+lateral.x*5,start.y+lateral.y*5)?.kind,'bridge-edge');
  }
});
test('V72 uniform resizing remains compatible with historic and non-bridge objects',()=>{
  const obj=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood.rustic_bank.01',
    x:560,y:420,scale:1.2});
  const old=updateSculptPreviewObject(obj,obj[0].id,{scale:1.7});
  assert.equal(old[0].transform.scaleX,1.7);
  assert.equal(old[0].transform.scaleY,1.7);
  const same=updateSculptPreviewObject(old,old[0].id,{scaleY:1.7});
  assert.deepEqual(same,old,'same physical dimensions must not change when re-normalized');
});
