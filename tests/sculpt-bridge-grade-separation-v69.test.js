import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptNavigationBlockDetail,sculptNavigationRoute} from '../src/core/sculpt-navigation-collision.js';
import {isBlocked} from '../src/core/collision.js';
import {stepMovement} from '../src/core/movement.js';
import {sculptCameraGameView,sculptCameraProject} from '../src/render/sculpt-camera-projection.js';

const CW=28,CH=21,W=20,H=12;
const at=(col,row)=>({x:(col+.5)*CW,y:(row+.5)*CH});
const actor=(col=5,row=5,modes=['ground'])=>({...at(col,row),radius:5,
  locomotion:{modes},facingX:1,moving:false});
function terrain(wet=false){
  const levels=Array.from({length:W*H},(_,i)=>{
    const x=i%W;return x<7||x>11?6:0;
  });
  const waterLevels=Array.from({length:W*H},(_,i)=>
    wet&&i%W>=7&&i%W<=11?9:-1);
  return createSculptTerrain({width:W,height:H,levels,waterLevels});
}
function setup(scale=1.4,wet=false,variantId='horizontal'){
  const placed=appendSculptPreviewObject([],{
    definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
    ...at(9,5),scale,variantId
  });
  const bridges=resolveWorldObjectPlacements(placed);
  const t=terrain(wet);
  const world={width:W*CW,height:H*CH,objects:placed,obstacles:[]};
  const c={terrain:t,bridges,cellWidth:CW,cellHeight:CH,
    maxStepUp:2,maxStepDown:2,shoreEntryFraction:.14};
  return {t,world,c,bridge:bridges[0],context:{sculptNavigation:c}};
}
const walk=(s,p,input,dt)=>stepMovement(s.world,p,input,dt,{maxSpeed:80},
  undefined,s.context);

test('V69 dry and wet canyon: longitudinal bridge crossing in both directions uses deck only',()=>{
  for(const wet of [false,true])for(const scale of [1.1,1.4,2,2.5]){
    const s=setup(scale,wet),before=serializeSculptTerrain(s.t);
    const p=actor(5,5);
    walk(s,p,{x:1,y:0},1.3);
    assert.equal(p.sculptBridgeId,s.bridge.id,
      'actual bank approach must board the deck at scale '+scale);
    assert.equal(isBlocked(s.world,p,p.x,p.y+120,undefined,s.context),true,
      'cannot fall down side of bridge');
    assert.equal(sculptNavigationBlockDetail(s.c,p,p.x,p.y+120)?.kind,'bridge-edge');
    walk(s,p,{x:1,y:0},3);
    assert.ok(p.x>at(13,5).x,'must reach the far high plateau');
    assert.equal(p.sculptBridgeId,null,'must dismount at far dry end');
    const reverse=actor(14,5);
    walk(s,reverse,{x:-1,y:0},1.7);
    assert.equal(reverse.sculptBridgeId,s.bridge.id,'reverse approach boards deck');
    walk(s,reverse,{x:-1,y:0},2.6);
    assert.ok(reverse.x<at(6,5).x,'reverse traversal exits at home bank');
    assert.equal(reverse.sculptBridgeId,null,'reverse end dismounts');
    assert.equal(serializeSculptTerrain(s.t),before,'navigation never edits terrain');
  }
});
test('V69 crossing remains on the bridge when pushing toward side rail',()=>{
  const s=setup(1.4),p=actor();
  walk(s,p,{x:1,y:0},1.3);
  const start={x:p.x,y:p.y,bridgeId:p.sculptBridgeId};
  walk(s,p,{x:0,y:1},1.25);
  assert.equal(p.x,start.x);assert.equal(p.y,start.y);
  assert.equal(p.sculptBridgeId,start.bridgeId,'rejected movement preserves deck state');
  walk(s,p,{x:1,y:0},.3);
  assert.ok(p.x>start.x,'movement along deck still works after rail collision');
});
test('V69 ground movement across underside never teleports to the deck',()=>{
  const s=setup(1.4),p=actor(9,3);
  assert.equal(p.sculptBridgeId,undefined,'ground-level spawn not on deck');
  const proposed=sculptNavigationRoute(s.c,p,p.x,p.y+105);
  assert.equal(proposed.reason,null);
  assert.equal(proposed.bridgeId,null);
  walk(s,p,{x:0,y:1},1.25);
  assert.ok(p.y>at(7,5).y,'underpass remains passable at canyon floor');
  assert.equal(p.sculptBridgeId,null,'underpass does not board a bridge');
  const blocked=sculptNavigationBlockDetail(s.c,p,at(6,5).x,p.y);
  assert.equal(blocked?.kind,'height-up','underside cannot climb a vertical bank');
});
test('V69 wet underpass requires swimming, never grants free deck to a submerged actor',()=>{
  const s=setup(1.4,true),p=actor(9,5,['ground','swim']);
  walk(s,p,{x:0,y:1},.8);
  assert.ok(p.y>at(9,5).y);
  assert.equal(p.sculptBridgeId,null);
  const walking=actor(9,5,['ground']);
  assert.equal(sculptNavigationBlockDetail(s.c,walking,walking.x,walking.y+20)?.kind,'water');
});
test('V69 no bridge lateral mounting, no phantom deck and no ordinary-2D mutation',()=>{
  const s=setup(1.4),low=actor(9,5);
  assert.equal(sculptNavigationRoute(s.c,low,low.x,low.y+20).bridgeId,null);
  assert.equal(sculptNavigationRoute({...s.c,bridges:[]},low,low.x,low.y+20).bridgeId,null);
  assert.equal(isBlocked(s.world,low,low.x,low.y+20),false,
    'legacy 2D runtime without sculpt opt-in is unchanged');
  stepMovement(s.world,low,{x:0,y:1},.25,{maxSpeed:80});
  assert.equal(low.sculptBridgeId,undefined,'legacy movement never writes sculpt layer');
});
test('V69 camera 35 to 90 degrees cannot change the authoritative bridge collision',()=>{
  const s=setup(1.4),p=actor();
  walk(s,p,{x:1,y:0},1.3);
  for(const angle of [35,55,80,90]){
    const view=sculptCameraGameView(angle);
    assert.ok(Number.isFinite(sculptCameraProject(view,p.x,p.y).y));
    assert.equal(sculptNavigationBlockDetail(s.c,p,p.x,p.y+90)?.kind,'bridge-edge');
  }
});
test('V69 render layers and navigation altitude follow persisted engine bridge state',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const engine=readFileSync(new URL('../src/core/movement.js',import.meta.url),'utf8');
 assert.match(engine,/entity\.sculptBridgeId=next\.bridgeId/);
 assert.match(engine,/sculptNavigationNextLayers\(collisionContext\.sculptNavigation,entity,x,y\)/);
 assert.match(main,/const activeBridge=navActor\?\.sculptBridgeId\?resolvedSculptBridges/);
 assert.match(main,/if\(underBridge\)drawPreviewObject\(underBridge\)/);
 assert.match(main,/physicalBridgeLayer:navActor\?\.sculptBridgeId\?'deck':'ground'/);
});
