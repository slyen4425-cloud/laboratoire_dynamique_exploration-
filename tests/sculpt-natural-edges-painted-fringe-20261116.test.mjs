import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptSurface,appendSculptSurfaceStroke}
  from '../src/world/sculpt-surface-paint.js';
import {sculptFringeVisualSurfaceV1,sculptFringeResolvedPaintSurfaceV1}
  from '../src/render/sculpt-fringe-visual-surface-v1.js';

const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const preview=(surface,col=0,row=24)=>sculptFringeVisualSurfaceV1(surface,{
  col,row,columns:36,rows:24
});
test('south snow follows canonical painted WorldSurface without saving fringe paint',()=>{
  let snow=createSculptSurface();
  snow=appendSculptSurfaceStroke(snow,{materialId:'ground.snow',
    points:[{x:0,y:23.5*21},{x:36*28,y:23.5*21}],width:105});
  const unchanged=JSON.stringify(snow);
  const visual=preview(snow);
  assert.ok(visual?.zones.length);
  assert.deepEqual(new Set(visual.zones.map(z=>z.materialId)),new Set(['ground.snow']));
  assert.equal(JSON.stringify(snow),unchanged);
  assert.ok(visual.zones.every(z=>z.id.startsWith('sculpt-surface-')));
});
test('forest paint, mixed snow/grass and independent north edge use the same owner',()=>{
  let mixed=createSculptSurface();
  mixed=appendSculptSurfaceStroke(mixed,{materialId:'ground.snow',
    points:[{x:12*28,y:23*21},{x:15*28,y:23*21}],width:45});
  const left=preview(mixed,0);
  const middle=preview(mixed,8);
  const north=sculptFringeVisualSurfaceV1(mixed,{
    col:8,row:-8,columns:36,rows:24
  });
  assert.ok(left?.zones.every(z=>z.materialId==='grass.forest'));
  assert.ok(middle?.zones.some(z=>z.materialId==='ground.snow'));
  assert.ok(north?.zones.every(z=>z.materialId==='grass.forest'));
});
test('snow semantic base overrides legacy grass backdrop without editing source',()=>{
  const snow={...createSculptSurface(),baseTerrainFamilyId:'snow',baseMaterialId:'grass.forest'};
  const before=JSON.stringify(snow);
  assert.ok(preview(snow).zones.every(z=>z.materialId==='ground.snow'));
  assert.equal(JSON.stringify(snow),before);
});
test('no artificial front wall; texture owner, cache and clip remain canonical',()=>{
  assert.equal((source.match(/drawOuterSouthRim:false/g)||[]).length,3);
  assert.doesNotMatch(source,/drawOuterSouthRim:true/);
  assert.match(source,/paintSurface:fringePaintSurface,paintImages:surfacePaintImages/);
  assert.match(source,/previous\.sourceSurface===surface/);
  assert.match(source,/const fringePaintSurface=sculptFringeResolvedPaintSurfaceV1\(chunk\.surface,surface/);
  assert.match(source,/ctx\.rect\(0,terrain\.height\*SCULPT_TILE\.height/);
  assert.match(source,/sculptFringeResolvedPaintSurfaceV1/);
  assert.doesNotMatch(source.slice(source.indexOf('function decorativeFringeRaster('),
    source.indexOf('function drawEditorPlayableLimit(')),/localStorage|saveSculptWorldArea/);
});

test('erased decorative fringe inherits the actual snow edge without modifying saves',()=>{
  let snow=createSculptSurface();
  snow=appendSculptSurfaceStroke(snow,{materialId:'ground.snow',
    points:[{x:0,y:23.5*21},{x:36*28,y:23.5*21}],width:105});
  const erased=createSculptSurface();
  const unchanged=JSON.stringify({snow,erased});
  const resolved=sculptFringeResolvedPaintSurfaceV1(erased,snow,{
    col:0,row:24,columns:36,rows:24
  });
  assert.ok(resolved?.zones?.length);
  assert.ok(resolved.zones.every(z=>z.materialId==='ground.snow'));
  assert.equal(JSON.stringify({snow,erased}),unchanged);
  const painted=appendSculptSurfaceStroke(erased,{materialId:'ground.sand',
    points:[{x:0,y:20},{x:160,y:20}],width:30});
  assert.equal(sculptFringeResolvedPaintSurfaceV1(painted,snow,{
    col:0,row:24,columns:36,rows:24
  }),painted,'explicit decorative painting retains sole authority');
});
