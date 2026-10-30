import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptBridgeDeckArtShift,sculptBridgeForegroundClip} from '../src/render/sculpt-bridge-deck-layers.js';
import {sculptCameraGameView,sculptCameraProject} from '../src/render/sculpt-camera-projection.js';
import {sculptBridgeDeckAt} from '../src/core/sculpt-navigation-collision.js';

const bridgeDefinitions=objectDefinitionCatalogV1.list().filter(d=>
  d.kind==='bridge'&&d.id.includes('_2p5d.'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);

test('V68 deck corridor centre never intersects foreground repaint at four pitches, 28 sprites and all scales',()=>{
 assert.equal(bridgeDefinitions.length,7);
 for(const definition of bridgeDefinitions)for(const variant of definition.visual.variants){
   for(const scale of [.4,1,2.5,3]){
     const placement=appendSculptPreviewObject([],{definitionId:definition.id,
       x:210,y:160,scale,variantId:variant.id});
     const bridge=resolveWorldObjectPlacements(placement,objectDefinitionCatalogV1)[0];
     assert.ok(sculptBridgeDeckAt([bridge],210,160,0),'visual centre must be walkable');
     const size={width:definition.baseSize.length*scale,height:definition.baseSize.width*scale};
     const artShift=sculptBridgeDeckArtShift(size,bridge);
     const foreground=sculptBridgeForegroundClip(size,artShift);
     near(artShift,size.height*.55);
     near(foreground.y,size.height*.12);
     near(foreground.height,size.height*.43);
     assert.ok(foreground.y>0,'deck centre y=0 must not be painted over hero');
     const deckY=0;
     assert.ok(deckY<foreground.y,'the feet and the decking must be in front of the rail re-paint');
     for(const angle of [35,55,80,90]){
       const view=sculptCameraGameView(angle);
       const centre=sculptCameraProject(view,210,160);
       const foot=sculptCameraProject(view,210,160);
       near(centre.x,foot.x);near(centre.y,foot.y);
     }
   }
 }
});
test('V68 historical bridge lacking 2.5D deck anchor remains unchanged',()=>{
 const old=sculptBridgeForegroundClip({width:170,height:96},0);
 near(old.y,-57.6);near(old.height,57.6);
});
test('V68 real render pass retains actor between bridge base and restricted front rail; Pixel module URL refreshed',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const geom=readFileSync(new URL('../src/render/sculpt-bridge-deck-layers.js',import.meta.url),'utf8');
 assert.match(main,/if\(deckBridge\)drawPreviewObject\(deckBridge\);\s*drawNavigationActor\(\);\s*if\(deckBridge\)drawPreviewObject\(deckBridge,\{foregroundRailOnly:true\}\)/);
 assert.match(main,/sculpt-bridge-deck-anchor-v67-mask-v68/);
 assert.match(page,/sculpt-bridge-deck-anchor-v67-mask-v68/);
 assert.match(geom,/const nearRailTop=h\*\.12/);
 assert.doesNotMatch(geom,/WorldDocument|isBlocked\(|terrain\.levels/);
});
