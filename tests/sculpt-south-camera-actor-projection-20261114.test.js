import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sculptCameraBounds,sculptCameraGameView} from '../src/render/sculpt-camera-projection.js';
import {clampSculptNavigationCameraToTerrainV1,sculptExteriorSouthEdgeAtActorV1}
 from '../src/render/sculpt-navigation-camera-clamp-v1.js';

test('at oblique angles south camera stops at the map edge below the actor, not its far-left corner',()=>{
 const coreWidth=80*28,coreHeight=64*21;
 const viewport={width:950,height:540,zoom:2};
 for(const angle of [35,55,75,90]){
  const view=sculptCameraGameView(angle);
  const bounds=sculptCameraBounds(view,coreWidth,coreHeight,16*18);
  const heroX=coreWidth*.78;
  const local=sculptExteriorSouthEdgeAtActorV1({
   bounds,view,coreWidth,coreHeight,actorX:heroX
  });
  assert.equal(local.minY,bounds.minY);
  assert.equal(local.minX,bounds.minX);
  assert.equal(local.maxX,bounds.maxX);
  assert.equal(local.maxY,view.pitch*coreHeight+view.shear*heroX);
  const pan=clampSculptNavigationCameraToTerrainV1({
   ...viewport,pan:{x:-100000,y:-100000},bounds:local
  });
  assert.ok(Math.abs(pan.y+local.maxY*viewport.zoom-viewport.height)<1e-6,
   'bottom edge must align with bottom of screen at actor X');
  assert.ok(local.maxY<=bounds.maxY);
 }
});
test('south follow clamps out-of-map actor X without changing WorldArea',()=>{
 const view=sculptCameraGameView(55);
 const bounds=sculptCameraBounds(view,1000,800,288);
 const left=sculptExteriorSouthEdgeAtActorV1({
   bounds,view,coreWidth:1000,coreHeight:800,actorX:-200
 });
 const right=sculptExteriorSouthEdgeAtActorV1({
   bounds,view,coreWidth:1000,coreHeight:800,actorX:1200
 });
 assert.equal(left.maxY,view.pitch*800);
 assert.equal(right.maxY,view.pitch*800+view.shear*1000);
 assert.equal(bounds.maxY,view.pitch*800);
});
test('same camera owner clamps both navigation follower and editor zoom/wheel without touching physics',()=>{
 const src=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(src,/function clampSculptEditorCamera\(\)/);
 assert.match(src,/sculptExteriorSouthEdgeAtActorV1\(/);
 assert.ok((src.match(/else clampSculptEditorCamera\(\)/g)||[]).length>=2);
 assert.match(src,/bounds:cameraBounds\(\)/);
 assert.doesNotMatch(src.slice(src.indexOf('function clampSculptEditorCamera()'),
  src.indexOf('function fit()')),/sculptWorldDraft\s*=|terrain\s*=|navActor\s*=/);
});
