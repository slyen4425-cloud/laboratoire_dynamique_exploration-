import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listNativeObjectDefinitions} from '../src/objects/object-definition-catalog.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {sculptBridgeForegroundClip,sculptBridgeForegroundRegions,
  sculptBridgeDeckArtShift} from '../src/render/sculpt-bridge-deck-layers.js';
import {sculptObjectVisualRect} from '../src/render/sculpt-object-picking.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptCameraGameView,sculptCameraProjectBridgeCorridor}
  from '../src/render/sculpt-camera-projection.js';

const defs=listNativeObjectDefinitions().filter(x=>x.kind==='bridge'&&x.id.includes('_2p5d.'));
const terrain=createSculptTerrain({width:40,height:40,levels:Array(1600).fill(6)});
const bridgeAt=(id,view,length,width)=>{
 const placed=appendSculptPreviewObject([],{definitionId:id,variantId:view,
   x:560,y:420,scaleX:length,scaleY:width});
 return resolveWorldObjectPlacements(placed)[0];
};
const contains=(r,x,y)=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height;

test('V73 all seven vertical bridge assets have side rails, not a full-width front repaint',()=>{
 assert.equal(defs.length,7);
 for(const def of defs)for(const [length,width] of [[.5,.5],[1,1],[2.4,.7],[.8,2.5],[3,3]]){
   const bridge=bridgeAt(def.id,'vertical',length,width);
   const rect=sculptObjectVisualRect(bridge,terrain);
   const shift=sculptBridgeDeckArtShift(rect,bridge);
   const rail=sculptBridgeForegroundRegions(rect,shift,bridge);
   assert.equal(rail.length,2,def.id);
   for(const r of rail){
     assert.ok(r.width>0&&r.height>0);
     assert.equal(r.height,rect.height);
     assert.ok(Math.abs(r.width-rect.width*.19)<1e-7);
     assert.ok(Math.abs(r.y-(-rect.height+shift))<1e-7);
   }
   assert.ok(Math.abs(rail[0].x+rect.width*.5)<1e-7);
   assert.ok(Math.abs(rail[1].x-(rect.width*.5-rect.width*.19))<1e-7);
   // Reproduce V72 Pixel 55-deg bug: the previous V68 foreground band
   // covered centre boards across the southern half of a VERTICAL bridge.
   const previous=sculptBridgeForegroundClip(rect,shift);
   for(const localY of [rect.height*.13,rect.height*.25,rect.height*.4]){
     assert.ok(contains(previous,0,localY),'old painter hid hero over centre boards');
     assert.ok(!rail.some(r=>contains(r,0,localY)),
       'new side masks cannot cover central hero on near half of decking');
   }
   const deck=bridgeTraversalRect(bridge);
   assert.equal(deck.rotation,Math.PI/2);
   assert.ok(Math.abs(deck.width-rect.width*.35)<1e-7);
   assert.ok(Math.abs(deck.length-rect.height*.92)<1e-7);
   for(const angle of [35,55,80,90]){
     const corners=sculptCameraProjectBridgeCorridor(sculptCameraGameView(angle),
       deck,{level:6,rise:18});
     assert.equal(corners.length,4);
     assert.ok(!rail.some(r=>contains(r,0,rect.height*.2)),
       'camera cannot introduce centre re-occlusion');
   }
 }
});

test('V73 horizontal, diagonal and historic foreground shapes stay byte-for-byte V68 equivalent',()=>{
 for(const def of defs)for(const variant of ['horizontal','diagonal_left','diagonal_right'])
 for(const [length,width] of [[.5,.5],[1.8,.75],[2.4,2.5]]){
   const bridge=bridgeAt(def.id,variant,length,width);
   const rect=sculptObjectVisualRect(bridge,terrain);
   const shift=sculptBridgeDeckArtShift(rect,bridge);
   assert.deepEqual(sculptBridgeForegroundRegions(rect,shift,bridge),
     [sculptBridgeForegroundClip(rect,shift)]);
 }
 const historic=bridgeAt('objectdef.bridge.wood.rustic_bank.01','horizontal',1,1);
 const rect=sculptObjectVisualRect(historic,terrain);
 assert.deepEqual(sculptBridgeForegroundRegions(rect,0,historic),
   [sculptBridgeForegroundClip(rect,0)]);
});

test('V73 draw order remains backdrop -> player -> RAILS, while underpass draws whole bridge last',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const geometry=readFileSync(new URL('../src/render/sculpt-bridge-deck-layers.js',import.meta.url),'utf8');
 assert.match(main,/if\(deckBridge\)drawPreviewObject\(deckBridge\);\s*drawNavigationActor\(\);\s*if\(deckBridge\)drawPreviewObject\(deckBridge,\{foregroundRailOnly:true\}\)/);
 assert.match(main,/if\(underBridge\)drawPreviewObject\(underBridge\)/);
 assert.match(main,/sculptBridgeForegroundRegions\(rect,artShift,object\)/);
 assert.match(main,/for\(const rail of regions\)ctx\.rect\(rail\.x,rail\.y,rail\.width,rail\.height\)/);
 assert.match(page,/vertical-v73/);
 assert.doesNotMatch(geometry,/CollisionWorld|navActor|WorldDocument|terrain\.levels/);
});
