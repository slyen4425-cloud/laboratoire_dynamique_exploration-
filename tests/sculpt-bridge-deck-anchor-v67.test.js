import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptBridgeDeckArtShift,sculptBridgeUsesDeckArtAnchor,
 sculptBridgeForegroundClip,sculptBridgeVisualFootLift} from '../src/render/sculpt-bridge-deck-layers.js';
import {sculptObjectVisualRect,findSculptVisualObjectAtPoint} from '../src/render/sculpt-object-picking.js';
import {sculptCameraGameView,sculptCameraProject,sculptCameraProjectBridgeFoot} from '../src/render/sculpt-camera-projection.js';

const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-7,`${x} != ${y}`);
const makeBridge=(variant,scale)=>resolveWorldObjectPlacements(
 appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
 x:7.5*28,y:6.5*21,variantId:variant,scale}))[0];

test('V67 2.5D bridge visual deck contact is identical to canonical XY deck center across camera pitches',()=>{
 const terrain=createSculptTerrain({width:20,height:16});
 const before=serializeSculptTerrain(terrain);
 for(const variant of ['horizontal','vertical','diagonal_left','diagonal_right']){
  for(const scale of [.4,1,2.5,3]){
   const bridge=makeBridge(variant,scale),rect=sculptObjectVisualRect(bridge,terrain);
   const corridor=bridgeTraversalRect(bridge);
   near(corridor.x,bridge.transform.x);near(corridor.y,bridge.transform.y);
   const shift=sculptBridgeDeckArtShift(rect,bridge);
   near(shift,rect.height*.55);
   near(-rect.height+shift+rect.height*.45,0);
   assert.equal(sculptBridgeVisualFootLift(rect,bridge),0);
   const front=sculptBridgeForegroundClip(rect,shift);
   near(front.y,-rect.height*.05);
   near(front.height,rect.height*.60);
   for(const angle of [35,55,90]){
    const view=sculptCameraGameView(angle);
    const foot=sculptCameraProjectBridgeFoot(view,rect.x,rect.y,0);
    const projectedDeck=sculptCameraProject(view,corridor.x,rect.y);
    near(foot.x,projectedDeck.x);near(foot.y,projectedDeck.y);
   }
  }
 }
 assert.equal(serializeSculptTerrain(terrain),before,'no physical terrain is rewritten by visual fitting');
});
test('V67 legacy/nonbridge do not inherit 2.5D art reanchor',()=>{
 const rect={height:120,width:190};
 assert.equal(sculptBridgeDeckArtShift(rect,{kind:'bridge',visual:{assetId:'historic.legacy'}}),0);
 assert.equal(sculptBridgeVisualFootLift(rect,{kind:'bridge',visual:{assetId:'historic.legacy'}}),42);
 assert.equal(sculptBridgeUsesDeckArtAnchor({kind:'building',visual:{assetId:'object.bridge.x_2p5d.x'}}),false);
});
test('V67 visual picking follows displaced bitmap rather than old centered thumbnail',()=>{
 const terrain=createSculptTerrain({width:20,height:16}),bridge=makeBridge('horizontal',1);
 const placements=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
   x:bridge.transform.x,y:bridge.transform.y,variantId:'horizontal',scale:1});
 const object=resolveWorldObjectPlacements(placements)[0],rect=sculptObjectVisualRect(object,terrain);
 const at={x:rect.x,y:rect.y+rect.height*.52}; // on visible lower support after reanchor
 const selected=findSculptVisualObjectAtPoint(placements,terrain,at,{zoom:1,paddingPx:0});
 assert.equal(selected?.id,object.id);
});
test('V67 renderer and editor both use same explicit bridge art shift, no collision from WebP',()=>{
 const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const pick=readFileSync(new URL('../src/render/sculpt-object-picking.js',import.meta.url),'utf8');
 const geom=readFileSync(new URL('../src/render/sculpt-bridge-deck-layers.js',import.meta.url),'utf8');
 assert.match(main,/ctx\.drawImage\(art,-width\/2,-height\+artShift,width,height\)/);
 assert.match(main,/sculptBridgeVisualFootLift\(visualRect,deckBridge\)/);
 assert.match(pick,/const deckShift=sculptBridgeDeckArtShift\(rect,object\)/);
 assert.match(geom,/SCULPT_BRIDGE_DECK_ART_SHIFT_RATIO=\.55/);
 assert.match(page,/rev=sculpt-bridge-deck-anchor-v67/);
 assert.doesNotMatch(geom,/isBlocked\(|terrain\.levels\s*=|WorldDocument/);
});
