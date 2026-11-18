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

import {drawSculptTerrain} from '../src/render/sculpt-height-renderer.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';

function southBackingCanvas(pattern){
  const fills=[];
  const context={
    fillStyle:null,
    createPattern(){return pattern;},
    fillRect(x,y,width,height){
      fills.push({x,y,width,height,style:this.fillStyle});
    },
    createLinearGradient(){return {addColorStop(){}};},
    save(){},restore(){},beginPath(){},closePath(){},rect(){},clip(){},
    moveTo(){},lineTo(){},quadraticCurveTo(){},bezierCurveTo(){},
    fill(){},stroke(){},drawImage(){},translate(){},scale(){}
  };
  return {context,fills};
}
test('the SAME authored ground texture reaches the raised south backing (grass, snow, dirt)',()=>{
  const terrain=createSculptTerrain({width:8,height:8});
  const unchanged=JSON.stringify(terrain);
  for(const [materialId,baseColor] of [
    ['grass.forest','#536247'],['ground.snow','#d4e5e9'],
    ['ground.forest_floor','#5c4930']
  ]){
    const nativeTexture={id:materialId};
    const nativePattern={owner:materialId};
    const {context,fills}=southBackingCanvas(nativePattern);
    const result=drawSculptTerrain(context,{
      terrain,material:{render:{baseColor}},texture:nativeTexture,
      drawOuterSouthRim:false
    });
    assert.equal(fills[0]?.style,nativePattern,
      'untextured south backing: '+materialId);
    assert.deepEqual(fills[0]&&[fills[0].x,fills[0].y,
      fills[0].width,fills[0].height],[0,0,8*28,8*21]);
    assert.equal(result.outerCliffRuns,0);
    assert.equal(JSON.stringify(terrain),unchanged,'never alter native heightfield');
  }
});
test('rim-owning renderer and missing-image fallback retain their previous backing color',()=>{
  const baseColor='#536247',pattern={owner:'native'};
  const flat=createSculptTerrain({width:8,height:8,levels:Array(64).fill(0)});
  const old=southBackingCanvas(pattern);
  const oldResult=drawSculptTerrain(old.context,{
    terrain:flat,material:{render:{baseColor}},texture:{id:'grass'},
    drawOuterSouthRim:true
  });
  assert.equal(old.fills[0]?.style,baseColor,'legacy cliff rim background unchanged');
  assert.equal(oldResult.outerCliffRuns,0);
  const missing=southBackingCanvas(null);
  drawSculptTerrain(missing.context,{
    terrain:flat,material:{render:{baseColor}},texture:null,
    drawOuterSouthRim:false
  });
  assert.equal(missing.fills[0]?.style,baseColor,'image not loaded still degrades safely');
});
