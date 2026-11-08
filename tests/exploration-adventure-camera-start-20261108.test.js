import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cameraAngleFromAdventurePlayUrlV1,cameraInitialZoomFromAdventurePlayUrlV1}
 from '../src/play/exploration-creator-camera-v1.js';

test('native Adventure initial zoom and pitch remain bounded and independent of editor',()=>{
 for(const zoom of [100,125,175,195,200,210,235,240])
  assert.equal(cameraInitialZoomFromAdventurePlayUrlV1(
   '?play=1&adventureSession=game-1&cameraZoom='+zoom),zoom);
 for(const zoom of ['0','95','241','230.5','Infinity','180abc','105.2'])
  assert.throws(()=>cameraInitialZoomFromAdventurePlayUrlV1(
   '?play=1&adventureSession=game-1&cameraZoom='+zoom),/zoom|caméra|240/i);
 assert.equal(cameraInitialZoomFromAdventurePlayUrlV1(
  '?play=1&adventureSession=game-1'),null,'old saves retain the true native zoom');
 assert.equal(cameraInitialZoomFromAdventurePlayUrlV1('?cameraZoom=200'),null);
 assert.equal(cameraInitialZoomFromAdventurePlayUrlV1('?play=1&cameraZoom=200'),null);
 assert.equal(cameraAngleFromAdventurePlayUrlV1(
   '?play=1&adventureSession=game-1&cameraAngle=45'),45);
});
test('real native 2.5D camera uses the pre-game zoom as a START, never disables player controls',async()=>{
 const source=await readFile(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(source,/const initialZoom=cameraInitialZoomFromAdventurePlayUrlV1\(window\.location\.search\)/);
 assert.match(source,/\$\('navigation-camera-zoom'\)\.value=String\(initialZoom\)/);
 assert.doesNotMatch(source,/\$\('navigation-camera-zoom'\)\.disabled=true/);
 assert.match(source,/function navigationCameraZoom\(\)/,
  'the same Exploration camera projection and native zoom remain the owner');
});
