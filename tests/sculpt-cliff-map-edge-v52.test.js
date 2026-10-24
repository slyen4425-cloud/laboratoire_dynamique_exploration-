import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,applySculptStroke,serializeSculptTerrain,
  importSculptTerrain,sculptFaces} from '../src/world/sculpt-height-model.js';
import {sculptOuterSouthCliffRuns,sculptFaceContour,drawSculptTerrain}
  from '../src/render/sculpt-height-renderer.js';

test('V52 south outer map boundary is painted using existing dry land elevations only',()=>{
  const original=createSculptTerrain({width:8,height:8});
  const before=JSON.stringify(original),faces=sculptFaces(original);
  assert.deepEqual(sculptOuterSouthCliffRuns(original),[
    {start:0,end:8,level:2,smoothness:0}]);
  assert.equal(JSON.stringify(original),before,'visual edge never writes sculpt geometry');
  assert.deepEqual(sculptFaces(original),faces,'no canonical cliff face invented');
  const levels=[...original.levels],waterLevels=[...original.waterLevels],roundness=[...original.roundness];
  const last=7*8;
  levels[last]=0;levels[last+1]=2;levels[last+2]=2;levels[last+3]=3;
  levels[last+4]=3;levels[last+5]=3;levels[last+6]=2;levels[last+7]=2;
  waterLevels[last+2]=5;roundness[last+6]=0;roundness[last+7]=150;
  const terrain=createSculptTerrain({width:8,height:8,levels,waterLevels,roundness});
  assert.deepEqual(sculptOuterSouthCliffRuns(terrain),[
    {start:1,end:2,level:2,smoothness:0},
    {start:3,end:6,level:3,smoothness:0},
    {start:6,end:8,level:2,smoothness:0}
  ]);
  assert.equal(JSON.stringify(terrain),JSON.stringify(createSculptTerrain({width:8,height:8,levels,waterLevels,roundness})));
});

test('V52 opt-in cliff-round stroke edits only canonical cosmetic roundness, undo and export retain exact heights',()=>{
  const terrain=createSculptTerrain({width:16,height:12});
  const footprint={mode:'cliff-round',points:[{x:8.5,y:6.5}],radius:2,edgeSoftness:0,rockRoundness:0};
  const hard=applySculptStroke(terrain,footprint);
  assert.notEqual(hard,terrain);
  assert.equal(hard.roundness[6*16+8],0);
  assert.equal(hard.levels,terrain.levels,'reference to height array is identical');
  assert.equal(hard.waterLevels,terrain.waterLevels,'water is immutable');
  assert.equal(JSON.stringify(sculptFaces(hard)),JSON.stringify(sculptFaces(terrain)));
  const soft=applySculptStroke(hard,{...footprint,rockRoundness:150});
  assert.equal(soft.roundness[6*16+8],150);
  assert.deepEqual(importSculptTerrain(serializeSculptTerrain(soft)),soft);
  assert.equal(sculptFaceContour({width:100,height:54,smoothness:0}).corner,0);
  assert.ok(sculptFaceContour({width:100,height:54,smoothness:1.5}).corner>0);
  assert.equal(serializeSculptTerrain(terrain),serializeSculptTerrain(createSculptTerrain({width:16,height:12})),
    'original remains identical for native Undo');
});

test('V52 cliff visual uses the published renderer, no extra runtime physics and is authorable in UI',()=>{
  assert.equal(sculptOuterSouthCliffRuns(null).length,0);
  assert.equal(drawSculptTerrain(null,{terrain:createSculptTerrain({width:8,height:8})}).faceCount,0);
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const renderer=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
  assert.doesNotMatch(html,/data-mode="cliff-round"/);
  assert.doesNotMatch(html,/id="visual-smooth"/);
  assert.doesNotMatch(main,/'cliff-round':/);
  assert.match(renderer,/rockFace\(ctx,\{x:run\.start\*w,y:totalHeight-run\.level\*rise/);
  assert.match(renderer,/sculptOuterSouthCliffRuns\(terrain\)/);
  assert.doesNotMatch(renderer,/isBlocked\(|CollisionWorld|location\.reload\(/);
});
