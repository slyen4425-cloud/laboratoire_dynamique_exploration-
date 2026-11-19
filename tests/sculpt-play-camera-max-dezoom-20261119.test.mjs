import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCULPT_PLAY_CAMERA_ZOOM,sculptPlayableCameraZoom}
 from '../src/render/sculpt-camera-projection.js';
const page=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');

test('showcase player cannot zoom out farther than 200% while zoom in remains available',()=>{
 assert.equal(SCULPT_PLAY_CAMERA_ZOOM.min,.5);
 for(const desired of [-999,0,.1,.32,.49,.5])
  assert.equal(sculptPlayableCameraZoom(desired),.5);
 for(const desired of [.51,1,1.75,2,2.4])
  assert.equal(sculptPlayableCameraZoom(desired),desired);
 assert.equal(sculptPlayableCameraZoom(6),2.4);
 assert.equal(sculptPlayableCameraZoom(Number.NaN),SCULPT_PLAY_CAMERA_ZOOM.default);
});

test('both wheel and zoom slider clamp in native Tester and Adventure, not in the map editor',()=>{
 assert.match(page,/const requestedZoom=zoom\*\(event\.deltaY>0\?\.90:1\.1\)/);
 assert.match(page,/zoom=navigationTesting\?sculptPlayableCameraZoom\(requestedZoom\):/);
 assert.match(page,/Math\.max\(\.32,Math\.min\(2\.4,requestedZoom\)\)/);
 assert.match(page,/zoom=navigationTesting\?sculptPlayableCameraZoom\(desiredZoom\):desiredZoom/);
 assert.match(page,/if\(navigationTesting\)\$\('zoom'\)\.value=String\(Math\.round\(zoom\*100\)\)/);
 assert.match(page,/if\(navigationTesting\)centerNavigationCamera\(\)/);
 assert.match(page,/const old=zoom;/);
 assert.match(html,/id="zoom" type="range" min="32" max="240"/,
  'editor can still zoom out for authoring; gameplay clamp belongs only in native input');
});

test('creator-selected camera angle and initial zoom remain separate and existing',()=>{
 assert.match(page,/cameraAngleFromAdventurePlayUrlV1\(window\.location\.search\)/);
 assert.match(page,/cameraInitialZoomFromAdventurePlayUrlV1\(window\.location\.search\)/);
 assert.match(page,/function navigationCameraZoom\(\)/);
 assert.match(page,/navigation-camera-zoom'\)\.addEventListener\('input'/);
});
