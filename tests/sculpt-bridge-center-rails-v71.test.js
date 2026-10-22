import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listNativeObjectDefinitions} from '../src/objects/object-definition-catalog.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect,bridgeVisualRect} from '../src/world/world-object-model.js';
import {orientedWorldPoint,circleFitsOrientedRect,orientedLocalPoint}
  from '../src/core/geometry.js';
import {sculptNavigationRoute,sculptNavigationBlockDetail}
  from '../src/core/sculpt-navigation-collision.js';
import {isBlocked} from '../src/core/collision.js';
import {stepMovement} from '../src/core/movement.js';
import {sculptCameraGameView,sculptCameraProjectBridgeCorridor}
  from '../src/render/sculpt-camera-projection.js';

const defs=listNativeObjectDefinitions().filter(d=>d.kind==='bridge'&&
  d.visual?.assetId?.includes('_2p5d.'));
const variants=['horizontal','vertical','diagonal_left','diagonal_right'];
const full=createSculptTerrain({width:40,height:40,levels:Array(1600).fill(6)});
const ctxFor=(bridge,terrain=full)=>({
  terrain,bridges:[bridge],cellWidth:28,cellHeight:21,maxStepUp:2,maxStepDown:2
});
const fixture=(id,variantId,scale,rotationDeg=0)=>{
 const scene=appendSculptPreviewObject([],{definitionId:id,variantId,
   scale,rotationDeg,x:560,y:420});
 const bridge=resolveWorldObjectPlacements(scene)[0];
 return {bridge,scene,world:{width:1120,height:840,objects:scene,obstacles:[]}};
};
const actor=(point,bridgeId)=>({...point,radius:5,
  locomotion:{modes:['ground']},facingX:1,moving:false,sculptBridgeId:bridgeId});
const near=(a,b)=>Math.abs(a-b)<1e-6;

test('V71 each of 7 decks has one symmetric 35% passage, blocking BOTH authored rail margins',()=>{
 assert.equal(defs.length,7);
 for(const def of defs)for(const variantId of variants)
 for(const scale of [.5,1,1.8,3])for(const rotationDeg of [-20,0,25]){
   const {bridge}=fixture(def.id,variantId,scale,rotationDeg);
   const traversal=bridgeTraversalRect(bridge),visual=bridgeVisualRect(bridge);
   assert.ok(near(traversal.x,visual.x)&&near(traversal.y,visual.y),
     'no rail offset may move bridge center');
   assert.ok(near(traversal.width,visual.width*.35),
     'only 35% of short dimension walkable');
   assert.ok(near(traversal.length,visual.length*.92),
     'longitudinal deck still spans authentic bridge length');
   const margin=traversal.width/2-5;
   assert.ok(margin>0,'full actor must fit even at scale 50%');
   const middle=orientedWorldPoint(0,0,traversal);
   assert.ok(circleFitsOrientedRect(middle.x,middle.y,5,traversal));
   const nav=ctxFor(bridge);
   for(const side of [-1,1]){
     const safe=orientedWorldPoint(0,side*(margin-.2),traversal);
     const rail=orientedWorldPoint(0,side*(margin+.2),traversal);
     assert.ok(circleFitsOrientedRect(safe.x,safe.y,5,traversal),
       'near-side midpoint must be safe');
     assert.equal(circleFitsOrientedRect(rail.x,rail.y,5,traversal),false,
       'full circle must not overlap '+(side<0?'far':'near')+' railing');
     const on=actor(safe,bridge.id);
     assert.equal(sculptNavigationBlockDetail(nav,on,rail.x,rail.y)?.kind,
       'bridge-edge','physical rail must block before actor walks off deck');
     assert.equal(sculptNavigationRoute(nav,on,rail.x,rail.y).bridgeId,
       bridge.id,'rejected step retains deck layer');
     assert.equal(sculptNavigationBlockDetail(nav,actor(middle,bridge.id),
       safe.x,safe.y),null,'the central corridor is still walkable');
     for(const pitch of [35,55,80,90]){
       const projected=sculptCameraProjectBridgeCorridor(sculptCameraGameView(pitch),
         traversal,{level:6,rise:18});
       assert.equal(projected.length,4);
       assert.equal(sculptNavigationBlockDetail(nav,on,rail.x,rail.y)?.kind,'bridge-edge',
         'camera never changes physics');
     }
   }
 }
});

test('V71 genuine movement: both rail edges stop hero without falling or sliding onto masonry',()=>{
 for(const variantId of variants)for(const scale of [.5,1,1.4,2.5])
 for(const side of [-1,1]){
   const {bridge,world}=fixture(defs[0].id,variantId,scale);
   const deck=bridgeTraversalRect(bridge),nav={sculptNavigation:ctxFor(bridge)};
   const start=orientedWorldPoint(0,0,deck);
   const direction={x:-Math.sin(deck.rotation)*side,y:Math.cos(deck.rotation)*side};
   const hero=actor(start,bridge.id);
   const safe=deck.width/2-5-1;
   stepMovement(world,hero,direction,safe/75,{maxSpeed:75},undefined,nav);
   const local=orientedLocalPoint(hero.x,hero.y,deck);
   assert.ok(Math.abs(local.y-side*safe)<.001,'actual actor reaches allowed inner deck');
   const settled={x:hero.x,y:hero.y,id:hero.sculptBridgeId};
   stepMovement(world,hero,direction,5/75,{maxSpeed:75},undefined,nav);
   assert.ok(near(hero.x,settled.x)&&near(hero.y,settled.y),
     'real Collision World must reject pushing through BOTH rails');
   assert.equal(hero.sculptBridgeId,settled.id);
   assert.equal(isBlocked(world,hero,hero.x+direction.x*5,hero.y+direction.y*5,
     undefined,nav),true);
 }
});

test('V71 unobstructed longitudinal center path and both-layer underpass are unchanged',()=>{
 for(const variantId of variants)for(const scale of [.8,1.4,2.5]){
   const {bridge}=fixture(defs[0].id,variantId,scale);
   const deck=bridgeTraversalRect(bridge),nav=ctxFor(bridge);
   const left=orientedWorldPoint(-deck.length*.3,0,deck);
   const right=orientedWorldPoint(deck.length*.3,0,deck);
   for(const [source,target] of [[left,right],[right,left]]){
     const crossing=sculptNavigationRoute(nav,actor(source,bridge.id),target.x,target.y);
     assert.equal(crossing.reason,null,'centerline must remain passable both directions');
     assert.equal(crossing.bridgeId,bridge.id);
   }
   // A low floor beneath a true elevated deck is not the deck itself.
   const levels=Array.from({length:1600},(_,i)=>{
     const x=(i%40+.5)*28,y=(Math.floor(i/40)+.5)*21;
     return Math.abs(orientedLocalPoint(x,y,deck).x)<30?0:6;
   });
   const below=ctxFor(bridge,createSculptTerrain({width:40,height:40,levels}));
   const x1=orientedWorldPoint(0,-deck.width,deck);
   const x2=orientedWorldPoint(0,deck.width,deck);
   const walking=sculptNavigationRoute(below,actor(x1,null),x2.x,x2.y);
   assert.equal(walking.reason,null,'underpass on dry valley floor must remain open');
   assert.equal(walking.bridgeId,null,'walking under must never mount narrow deck');
 }
});

test('V71 physical sides reuse one WorldObject traversability, not a parallel obstacle or sprite alpha',()=>{
 const source=readFileSync(new URL('../src/objects/object-definition-catalog.js',import.meta.url),'utf8');
 const navigation=readFileSync(new URL('../src/core/sculpt-navigation-collision.js',import.meta.url),'utf8');
 const model=readFileSync(new URL('../src/world/world-object-model.js',import.meta.url),'utf8');
 assert.match(source,/centered 35%/);
 assert.match(model,/visual\.width\s*\*\s*bridge\.traversal\.widthRatio/);
 assert.match(navigation,/return reject\(Object\.freeze\(\{kind:'bridge-edge'\}\)\)/);
 assert.doesNotMatch(navigation,/getImageData\(|naturalWidth|sprite\.alpha|image\.src/);
 for(const def of defs)assert.equal(def.collision,undefined,
   'rail blockage lives in the same existing deck corridor, not a new obstacle');
});
