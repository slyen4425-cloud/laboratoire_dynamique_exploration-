import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {sculptBridgeDeckAt} from '../src/core/sculpt-navigation-collision.js';
import {sculptBridgeForegroundClip,sculptBridgeVisualFootLift}
 from '../src/render/sculpt-bridge-deck-layers.js';

const point=(col,row)=>({x:(col+.5)*28,y:(row+.5)*21});

test('V57 bridge render uses the same center-passable corridor as V55 Collision World',()=>{
 const at=point(5,4);
 const place=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
   x:at.x,y:at.y,scale:.9,variantId:'horizontal'});
 const bridge=resolveWorldObjectPlacements(place)[0];
 assert.ok(bridgeTraversalRect(bridge));
 assert.ok(sculptBridgeDeckAt([bridge],at.x,at.y,5));
 assert.equal(sculptBridgeDeckAt([bridge],at.x,at.y+90,5),null);
 assert.equal(sculptBridgeDeckAt([],at.x,at.y,5),null);
});
test('V57 deck is base sprite behind hero, narrow near-rail foreground only',()=>{
 const rect=sculptBridgeForegroundClip({width:170,height:96});
 assert.equal(rect.x,-85); assert.ok(Math.abs(rect.y+57.6)<1e-9);
 assert.equal(rect.width,170); assert.ok(Math.abs(rect.height-57.6)<1e-9);
 assert.ok(Math.abs(sculptBridgeVisualFootLift({height:96})-33.6)<1e-9);
 assert.equal(sculptBridgeVisualFootLift(null),0);
 assert.equal(sculptBridgeForegroundClip({width:0,height:96}).width,0);
});
test('V57 actual sculpt draw path draws bridge once behind then partial near rail in front',()=>{
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const script=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(source,/const deckBridge=activeSculptBridge\(\)/);
 assert.match(source,/if\(deckBridge\)drawPreviewObject\(deckBridge\);\s*drawNavigationActor\(\);\s*if\(deckBridge\)drawPreviewObject\(deckBridge,\{foregroundRailOnly:true\}\)/);
 assert.match(source,/sculptBridgeDeckAt\(\s*\[bridge\],navActor\.x,navActor\.y/);
 assert.match(source,/ctx\.drawImage\(art,-width\/2,-height\\+artShift,width,height\)/);
 assert.match(source,/ctx\.rect\(rail\.x,rail\.y,rail\.width,rail\.height\);ctx\.clip\(\)/);
 assert.match(source,/sculptBridgeVisualFootLift\(visualRect\)/);
 assert.match(source,/deckBridgeId:activeSculptBridge\(\)\?\.id\?\?null/);
 assert.match(script,/src\/sculpt-lab-main\.js\?rev=sculpt-(?:bridge-deck-v57|bridge-foot-clean-v58|hill-shoulder-v59|bridge-crossing-v60|whole-hill-v61|bridge-bank-v62|high-platform-bridge-v63|bridge-tactile-v64|bridge-camera-v65|bridge-input-v66|bridge-deck-anchor-v67)/);
});
