import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampSculptNavigationCameraToTerrainV1,
  sculptExteriorFringeCameraBoundsV1
} from '../src/render/sculpt-navigation-camera-clamp-v1.js';
import {sculptCameraBounds,sculptCameraGameView} from '../src/render/sculpt-camera-projection.js';

test('north decorative extension leaves playable left, right and south camera bounds unchanged',()=>{
  const view=sculptCameraGameView(55);
  const core=sculptCameraBounds(view,80*28,64*21,16*18);
  const fringe=sculptExteriorFringeCameraBoundsV1({
    coreBounds:core,view,coreWidth:80*28,coreHeight:64*21,
    fringeRows:8,tileWidth:28,tileHeight:21,
    viewportHeight:700,zoom:1.5,skyFraction:.12
  });
  assert.equal(fringe.minX,core.minX);
  assert.equal(fringe.maxX,core.maxX);
  assert.equal(fringe.maxY,core.maxY);
  assert.ok(fringe.minY<core.minY);
  const pan=clampSculptNavigationCameraToTerrainV1({
    pan:{x:-99999,y:-99999},bounds:fringe,zoom:1.5,width:800,height:700
  });
  assert.equal(pan.y,700-core.maxY*1.5,'south map edge remains at viewport bottom');
  assert.equal(pan.x,800-core.maxX*1.5,'right map edge remains at viewport right');
});

test('northern-only bounds also work with a shear-free camera and zero decorative rows',()=>{
  const view={pitch:1,shear:0};
  const core=sculptCameraBounds(view,1000,600,0);
  const fringe=sculptExteriorFringeCameraBoundsV1({
    coreBounds:core,view,coreWidth:1000,coreHeight:600,
    fringeRows:0,viewportHeight:600,zoom:1,skyFraction:0
  });
  assert.deepEqual(fringe,core);
});
