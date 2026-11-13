import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AUTHOR_SNOW_MAP_SNAPSHOT}
 from '../src/builder/sculpt-author-snow-map-snapshot.js';

test('Neige 1 reuses its official snow WorldSurface on the visual base below raised cliffs',()=>{
  const scene=AUTHOR_SNOW_MAP_SNAPSHOT.scene;
  assert.equal(scene.terrain.width,80);
  assert.equal(scene.terrain.height,64);
  assert.equal(scene.surface.baseTerrainFamilyId,'plain',
    'reproduce the green forest-base bleed despite snow coverage');
  assert.ok(scene.surface.zones.some(z=>z.materialId==='ground.snow'));
  assert.ok(scene.terrain.levels.slice(-80).some(level=>level>0),
    'south edge is raised, leaving a backing gap in the projected raster');
  const renderer=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
  const start=renderer.indexOf('export function drawSculptTerrain');
  const base=renderer.indexOf('ctx.fillStyle=baseColor;ctx.fillRect(0,0,totalWidth,totalHeight)',start);
  const underpaint=renderer.indexOf('const paintBacking=sculptPaintByCell',base);
  const tops=renderer.indexOf('for(let row=0;row<terrain.height;row++){',underpaint);
  assert.ok(start>=0&&base>start&&underpaint>base&&tops>underpaint,
    'native snow-zone backing must paint before the existing raised terrain tops');
  assert.match(renderer.slice(underpaint,tops),/routes:\[\]/,
    'backing must not project dirt roads under cliffs');
  assert.match(renderer.slice(underpaint,tops),/paintBacking\(col,row,0,col\*w,row\*h\)/);
  assert.doesNotMatch(renderer.slice(underpaint,tops),/applySculptStroke|saveSculptWorldArea|collision/);
});
