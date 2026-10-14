import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  createBlankWorldBuilderDraft,
  updateAreaProperties,
  serializeWorldBuilderDraft,
  importWorldBuilderDocument,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import {
  normalizeAreaCamera,
  clampAreaCameraZoom,
  gameCameraViewport,
  followGameCamera
} from '../src/world/world-area-camera.js';

test('camera defaults preserve legacy runtime at 1:1 and provide editable constraints', () => {
  assert.deepEqual(normalizeAreaCamera(null), {
    initialZoom: 1, minZoom: 0.6, maxZoom: 1.8, allowPlayerZoom: false
  });
  assert.equal(demoWorldDocument.areas[0].camera.initialZoom, 1);
  assert.equal(normalizeAreaCamera({minZoom:0.7,maxZoom:1.4,initialZoom:9}).initialZoom,1.4);
  assert.equal(clampAreaCameraZoom({minZoom:0.7,maxZoom:1.4},0.1),0.7);
  assert.equal(clampAreaCameraZoom({minZoom:0.7,maxZoom:1.4},5),1.4);
});

test('camera follows player using visible world units at near and far zoom, without gameplay changes', () => {
  const area = { width: 2400, height: 1600 };
  assert.deepEqual(gameCameraViewport(800, 400, 1), {width:800,height:400});
  assert.deepEqual(gameCameraViewport(800, 400, 0.5), {width:1600,height:800});
  assert.deepEqual(gameCameraViewport(800, 400, 2), {width:400,height:200});
  assert.deepEqual(followGameCamera(area,{x:1200,y:800},gameCameraViewport(800,400,0.5)),{x:400,y:400});
  assert.deepEqual(followGameCamera(area,{x:1200,y:800},gameCameraViewport(800,400,2)),{x:1000,y:700});
  assert.deepEqual(followGameCamera(area,{x:20,y:20},gameCameraViewport(800,400,2)),{x:0,y:0});
});

test('camera settings belong to each WorldArea and survive export/import, including blank worlds', () => {
  const blank = createBlankWorldBuilderDraft();
  const source=updateAreaProperties(blank,blank.initialAreaId,{
    camera:{initialZoom:0.75,minZoom:0.5,maxZoom:1.25,allowPlayerZoom:true}
  });
  assert.equal(validateWorldBuilderDraft(source).valid,true);
  assert.equal(source.areas[0].camera.initialZoom,0.75);
  const imported=importWorldBuilderDocument(serializeWorldBuilderDraft(source));
  assert.deepEqual(imported.areas[0].camera,source.areas[0].camera);
  assert.equal(imported.areas[0].spawns.length,1);
  assert.equal(demoWorldDocument.areas[0].camera.initialZoom,1);
});

test('Builder camera editor and runtime keep independent zoom with player pinch input', async () => {
  const html=await readFile(new URL('../builder.html',import.meta.url),'utf8');
  const main=await readFile(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
  const runtime=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  for(const id of ['area-camera-initial','area-camera-min','area-camera-max','area-camera-player-zoom']){
    assert.match(html,new RegExp('id="'+id+'"'));
    assert.match(main,new RegExp(id));
  }
  assert.match(runtime,/gameCameraViewport/);
  assert.match(runtime,/followGameCamera/);
  assert.match(runtime,/ctx\.scale\(gameZoom, gameZoom\)/);
  assert.match(runtime,/canvas\.addEventListener\('pointermove'/);
  assert.match(runtime,/canvas\.addEventListener\('wheel'/);
  assert.match(main,/updateAreaProperties/);
  assert.match(main,/let zoom = 0\.35/); // editor zoom stays independent
});
