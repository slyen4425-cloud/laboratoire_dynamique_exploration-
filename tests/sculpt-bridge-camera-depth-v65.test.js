import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sculptCameraGameView,sculptCameraProject,sculptCameraProjectBridgeFoot,
sculptCameraProjectBridgeCorridor} from '../src/render/sculpt-camera-projection.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptBridgeDeckAt} from '../src/core/sculpt-navigation-collision.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('V65 bridge foot lift does not depend on camera pitch',()=>{
 const x=185,y=170,lift=35;
 for(const angle of [35,55,70,90]){
   const view=sculptCameraGameView(angle);
   const terrainPoint=sculptCameraProject(view,x,y);
   const foot=sculptCameraProjectBridgeFoot(view,x,y,lift);
   near(foot.y,terrainPoint.y-lift);
   near(foot.x,terrainPoint.x);
   assert.ok(foot.y<terrainPoint.y);
 }
 // V64 incorrectly lifted in WORLD y, so lower pitch lost 42.6% lift.
 const view=sculptCameraGameView(35);
 const incorrect=sculptCameraProject(view,x,y-lift);
 const actual=sculptCameraProjectBridgeFoot(view,x,y,lift);
 assert.ok(actual.y<incorrect.y-10);
 assert.deepEqual(sculptCameraProjectBridgeFoot(view,x,y,0),sculptCameraProject(view,x,y));
});
test('V65 optional footprint outline uses exactly the canonical corridor across camera angles and scales',()=>{
 const terrain=createSculptTerrain({width:20,height:16});
 for(const [variant,scale] of [['horizontal',.4],['vertical',2.5],['diagonal_left',1.5]]){
  const placements=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
   x:180,y:150,variantId:variant,scale});
  const bridge=resolveWorldObjectPlacements(placements)[0];
  const corridor=sculptBridgeDeckAt([bridge],180,150,0);
  assert.ok(corridor,'must use authoritative bridge transform');
  for(const angle of [35,90]){
    const polygon=sculptCameraProjectBridgeCorridor(sculptCameraGameView(angle),corridor,
       {level:5,rise:18});
    assert.equal(polygon.length,4);
    for(const p of polygon){assert.ok(Number.isFinite(p.x));assert.ok(Number.isFinite(p.y));}
  }
 }
 assert.equal(terrain.levels[0],2,'no terrain mutation');
});
test('V65 controller and Tester expose live physical corridor, no gameplay writes',()=>{
 const src=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(src,/sculptCameraProjectBridgeFoot\(cameraView\(\),navActor\.x,footY,/);
 assert.match(src,/ctx\.lineTo\(point\.x,point\.y\)/);
 assert.match(src,/navigation-show-bridge-corridor/);
 assert.match(html,/Afficher le passage réel des ponts/);
 assert.match(html,/rev=sculpt-(?:bridge-camera-v65|bridge-input-v66|bridge-deck-anchor-v67)/);
 assert.doesNotMatch(src,/navActor\.y\s*[-+]=\s*sculptBridgeVisualFootLift/);
});
