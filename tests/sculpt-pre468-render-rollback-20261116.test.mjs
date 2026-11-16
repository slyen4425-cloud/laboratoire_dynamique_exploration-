import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCULPT_TERRAIN_MAX_LEVEL} from '../src/world/sculpt-height-model.js';
import {SCULPT_OBJECT_LIMIT} from '../src/world/sculpt-scene-preview.js';

// Baseline: main@f90ef6abe7aa, before the first cliff-overlay PR #468.
// Only old native paint ordering is restored, NOT older map/game data.
const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('pre-#468 painter: terrain once, then ordered objects and one hero',()=>{
  const begin=source.indexOf('  if(navigationTesting){\n    // V57:');
  const end=source.indexOf('  drawEditorPlayableLimit();',begin);
  assert.ok(begin>0&&end>begin,'real editor/Tester draw path must exist');
  const painter=source.slice(begin,end);
  assert.match(painter,/drawPreviewObjects\(navActor\?\.y\?\?Infinity/);
  assert.match(painter,/drawPreviewObjects\(Infinity,navActor\?\.y\?\?Infinity/);
  assert.equal((painter.match(/drawNavigationActor\(\)/g)||[]).length,1);
  assert.doesNotMatch(painter,/cliffOcclusionImage|sculptActorCliffDepthPlanV2|nearObjects|cliffPlan/);
});

test('no extra alpha mask or upper-cap clipping in real object/actor renderer',()=>{
  assert.doesNotMatch(source,/cliffOcclusionImage|sculptCliffOcclusionRectsV1|sculptObjectInFrontOfCliffV1/);
  assert.doesNotMatch(source,/sculptObjectRaisedCapOcclusionV1|clipPreviewObjectByUpperCaps/);
  const begin=source.indexOf('function drawPreviewObject(');
  const end=source.indexOf('function drawPreviewObjects(',begin);
  assert.ok(begin>0&&end>begin);
  const painter=source.slice(begin,end);
  assert.match(painter,/ctx\.save\(\);\s*ctx\.translate\(point\.x,point\.y\)/);
  assert.match(painter,/drawWorldObjectContactShadowV1/);
  assert.doesNotMatch(painter,/upperCaps/);
});

test('scope guard: preserve level 16, 2048 objects and natural map edges',()=>{
  assert.equal(SCULPT_TERRAIN_MAX_LEVEL,16);
  assert.equal(SCULPT_OBJECT_LIMIT,2048);
  assert.match(source,/paddingY=SCULPT_TERRAIN_MAX_LEVEL\*SCULPT_TILE\.rise\+18/);
  assert.equal((source.match(/drawOuterSouthRim:false/g)||[]).length,3);
  assert.match(source,/paintSurface:fringePaintSurface/);
  assert.match(source,/function drawDecorativeFringeTerrain\(\)/);
  assert.match(source,/function drawWorldObjectContactShadowV1|drawWorldObjectContactShadowV1/);
});
