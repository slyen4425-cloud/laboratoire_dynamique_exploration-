import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clampSculptNavigationCameraToTerrainV1 as clamp} from '../src/render/sculpt-navigation-camera-clamp-v1.js';

const bounds={minX:-30,maxX:1170,minY:-150,maxY:810};
const args={bounds,zoom:1,width:900,height:600};

test('mounted world camera stops at left, right, top and bottom map extents',()=>{
  assert.deepEqual(clamp({...args,pan:{x:1000,y:1000}}),{x:30,y:150});
  assert.deepEqual(clamp({...args,pan:{x:-900,y:-900}}),{x:-270,y:-210});
  assert.deepEqual(clamp({...args,pan:{x:-125,y:-105}}),{x:-125,y:-105});
});

test('when visual terrain is smaller than the full viewport it is centered, not rescaled',()=>{
  assert.deepEqual(clamp({pan:{x:-500,y:400},bounds:{minX:10,maxX:300,minY:-20,maxY:100},
    zoom:1,width:900,height:600}),{x:295,y:260});
  assert.deepEqual(clamp({...args,zoom:2,pan:{x:-5000,y:-5000}}),{x:-1440,y:-1020});
});

test('camera owner applies same terrain clamp to mounted and simple exterior Tester',()=>{
  const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const start=source.indexOf('function centerNavigationCamera(){');
  const end=source.indexOf('function drawNavigationBridgeCorridors(){',start);
  const camera=source.slice(start,end);
  assert.match(camera,/const next=activeInteriorId\|\|sculptWorldCurrentInterior\(\)/);
  assert.equal((camera.match(/clampSculptNavigationCameraToTerrainV1/g)||[]).length,2);
  assert.match(camera,/bounds:cameraBounds\(\)/);
  assert.match(source,/window\.addEventListener\('resize',fit\)/);
  assert.match(source,/document\.addEventListener\('fullscreenchange'/);
});

test('invalid viewport cannot introduce non-finite pan and corrupt actor placement',()=>{
  assert.throws(()=>clamp({...args,width:0,pan:{x:1,y:1}}),/Valid camera/);
  assert.throws(()=>clamp({...args,pan:{x:NaN,y:0}}),/Valid camera/);
});
