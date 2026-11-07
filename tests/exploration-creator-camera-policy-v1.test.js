import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 cameraAngleFromAdventurePlayUrlV1
} from '../src/play/exploration-creator-camera-v1.js';
const page=()=>readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
test('RED: only a scoped native AdventureSession can lock the official game camera angle',()=>{
 for(const angle of [35,40,55,70,90])
  assert.equal(cameraAngleFromAdventurePlayUrlV1(
   '?play=1&adventureSession=saved-1&cameraAngle='+angle),angle);
 for(const query of ['?cameraAngle=75','?play=1&cameraAngle=75',
  '?worldAssembler=1&cameraAngle=70','?play=1&adventureSession='])
  assert.equal(cameraAngleFromAdventurePlayUrlV1(query),null);
 for(const angle of ['0','34','95','55.5','x','-5','Infinity']){
  assert.throws(()=>cameraAngleFromAdventurePlayUrlV1(
   '?play=1&adventureSession=session-1&cameraAngle='+angle),
   /angle|35|90|caméra/i);
 }
});
test('RED: official Exploration applies and locks creator angle, player zoom remains interactive',()=>{
 const s=page();
 assert.match(s,/cameraAngleFromAdventurePlayUrlV1\(window\.location\.search\)/);
 assert.match(s,/\$\('navigation-camera-angle'\)\.disabled=true/);
 assert.match(s,/sculptCreatorCameraAngle===null/);
 assert.match(s,/\$\('navigation-camera-zoom'\)\.addEventListener\('input'/);
 assert.doesNotMatch(s,/\$\('navigation-camera-zoom'\)\.disabled=true/);
 assert.match(s,/sculptCameraGameView\(Number\(\$\('navigation-camera-angle'\)\.value\)\)/);
});
