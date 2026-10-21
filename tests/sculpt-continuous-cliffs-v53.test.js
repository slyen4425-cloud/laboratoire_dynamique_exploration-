import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,applySculptStroke,sculptFaces,
  serializeSculptTerrain,importSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptRoundedSouthColumns,sculptSouthCliffJointSpan,sculptOuterSouthCliffRuns}
  from '../src/render/sculpt-height-renderer.js';

test('V53 untouched V50/V52 95% contours stay on exactly the original painter path',()=>{
  const n=9,levels=Array(n*n).fill(2);
  for(const [col,level] of [[2,5],[3,4],[4,6],[5,5]])levels[4*n+col]=level;
  const terrain=createSculptTerrain({width:n,height:n,levels});
  assert.deepEqual(sculptRoundedSouthColumns(terrain,4),[]);
  assert.deepEqual(sculptRoundedSouthColumns(terrain,3),[]);
  assert.equal(terrain.roundness.every(value=>value===95),true);
});

test('V53 roundness brush joins the edited cliff and its one-cell neighbours only',()=>{
  const n=9,levels=Array(n*n).fill(2);
  for(const [col,level] of [[1,5],[2,5],[3,4],[4,6],[5,5],[6,5]])levels[4*n+col]=level;
  const original=createSculptTerrain({width:n,height:n,levels});
  const painted=applySculptStroke(original,{
    points:[{x:3.5,y:4.5}],radius:.5,mode:'cliff-round',rockRoundness:150});
  assert.deepEqual(sculptRoundedSouthColumns(painted,4),[2,3,4]);
  assert.deepEqual(sculptRoundedSouthColumns(painted,3),[]);
  assert.equal(painted.levels,original.levels);
  assert.equal(painted.waterLevels,original.waterLevels);
  assert.deepEqual(sculptFaces(painted),sculptFaces(original));
  assert.deepEqual(importSculptTerrain(serializeSculptTerrain(painted)),painted);
  assert.equal(original.roundness[4*n+3],95);
  assert.deepEqual(sculptRoundedSouthColumns(original,4),[]);
  assert.equal(sculptOuterSouthCliffRuns(original).length,
    sculptOuterSouthCliffRuns(painted).length);
});

test('V53 joint spans grow with authored roundness and remain contained in face widths',()=>{
  const sharp=sculptSouthCliffJointSpan({width:28,delta:18,left:0,right:0});
  const median=sculptSouthCliffJointSpan({width:28,delta:18,left:95,right:95});
  const rounded=sculptSouthCliffJointSpan({width:28,delta:18,left:150,right:150});
  assert.equal(sharp,0);
  assert.ok(median>0 && rounded>median);
  assert.ok(rounded<=28*.46);
  assert.equal(sculptSouthCliffJointSpan({width:28,delta:0,left:150,right:150}),0);
});

test('V53 never blends through water or alters a contour outside the selected area',()=>{
  const n=9,levels=Array(n*n).fill(2),waterLevels=Array(n*n).fill(-1);
  for(let c=2;c<=6;c++)levels[4*n+c]=5;
  waterLevels[5*n+2]=4;waterLevels[4*n+5]=7;
  const original=createSculptTerrain({width:n,height:n,levels,waterLevels});
  const modified=applySculptStroke(original,{points:[{x:4.5,y:4.5}],
    radius:.5,mode:'cliff-round',rockRoundness:150});
  assert.deepEqual(sculptRoundedSouthColumns(modified,4),[3,4]);
  assert.equal(JSON.stringify(original.levels),JSON.stringify(modified.levels));
  assert.equal(JSON.stringify(original.waterLevels),JSON.stringify(modified.waterLevels));
  assert.equal(sculptRoundedSouthColumns(modified,0).length,0);
});

test('V53 gesture preview reports the same roundness modification as the real brush',()=>{
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const render=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(html,/src\/sculpt-lab-main\.js\?rev=sculpt-(?:rounded-hills-v54|bridge-crossing-v55|bridge-polish-v56|bridge-deck-v57|bridge-foot-clean-v58|hill-shoulder-v59|bridge-crossing-v60|whole-hill-v61|bridge-bank-v62|high-platform-bridge-v63|bridge-tactile-v64|bridge-camera-v65)/);
  assert.match(main,/sculpt-height-renderer\.js\?rev=sculpt-(?:rounded-hills-v54|hill-shoulder-v59|bridge-crossing-v60|whole-hill-v61|bridge-bank-v62|high-platform-bridge-v63|bridge-tactile-v64|bridge-camera-v65)/);
  assert.match(main,/rockRoundness:selectedMode==='cliff-round'/);
  assert.match(render,/mode==='cliff-round'\?'Arrondi '\+after\+' %'/);
  assert.match(render,/sculptSouthCliffContinuousPath\(ctx,faces,profiles,tile/);
  assert.match(render,/ctx\.clip\(\);[\s\S]*?rockFace\(ctx,\{x:col\*w,y:minTop/);
});
