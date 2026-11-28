import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,applySculptWaterStroke,serializeSculptTerrain,importSculptTerrain,setSculptWaterAnimation,sculptWaterAt} from '../src/world/sculpt-height-model.js';
import {sculptWaterMaterialCells,DEFAULT_SCULPT_WATER_MATERIAL} from '../src/world/sculpt-water-materials-v1.js';
import {animatedSurfaceFrame,animatedSurfaceSprite,SURFACE_FRAME_COUNT,loadAnimatedSurfaceAtlas,animatedSurfaceAtlasUrl,SURFACE_TILE,surfaceMaterialFrame} from '../src/render/animated-surface-sprites-v1.js';
import {sculptWetShoreEdges} from '../src/render/sculpt-height-renderer.js';
const base=()=>createSculptTerrain({width:8,height:8,levels:Array(64).fill(1)});
const stroke=(t,x,y,mode,waterMaterialId)=>applySculptWaterStroke(t,{points:[{x:x+.5,y:y+.5}],radius:.5,mode,target:4,waterMaterialId});
test('paintable water preserves volume, neighboring materials and canonical JSON',()=>{
 const old=base();
 assert.equal(Object.hasOwn(JSON.parse(serializeSculptTerrain(old)),'waterMaterialRuns'),false);
 const a=stroke(old,3,3,'water-fill','water.turquoise');
 const b=stroke(a,4,3,'water-fill','water.forest_stream');
 const c=stroke(b,3,3,'water-paint','water.swamp');
 assert.equal(c.waterLevels,b.waterLevels);assert.equal(c.levels,b.levels);
 assert.equal(sculptWaterMaterialCells(c)[27],'water.swamp');
 assert.equal(sculptWaterMaterialCells(c)[28],'water.forest_stream');
 assert.equal(sculptWaterAt(c,3,3),3);
 assert.equal(stroke(c,0,0,'water-paint','water.turquoise'),c);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(c)),c);
 assert.equal(sculptWaterMaterialCells(b)[27],'water.turquoise');
 const erased=stroke(c,3,3,'water-erase','water.swamp');
 assert.equal(sculptWaterMaterialCells(erased)[27],DEFAULT_SCULPT_WATER_MATERIAL);
 assert.equal(sculptWaterAt(erased,3,3),0);
});
test('same material compacts to contiguous runs and defaults are omitted',()=>{
 let t=base();
 t=stroke(t,3,3,'water-fill','water.turquoise');
 t=stroke(t,4,3,'water-fill','water.turquoise');
 assert.deepEqual(t.waterMaterialRuns,[[27,2,'water.turquoise']]);
 t=stroke(t,3,3,'water-paint',DEFAULT_SCULPT_WATER_MATERIAL);
 t=stroke(t,4,3,'water-paint',DEFAULT_SCULPT_WATER_MATERIAL);
 assert.equal(Object.hasOwn(t,'waterMaterialRuns'),false);
});
test('water settings optional, undo-friendly and strictly validated',()=>{
 const old=base();const changed=setSculptWaterAnimation(old,{fps:12,foamPct:0});
 assert.equal(changed.waterLevels,old.waterLevels);
 assert.equal(changed.levels,old.levels);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(changed)),changed);
 assert.deepEqual(setSculptWaterAnimation(changed,{fps:8,foamPct:60}),old);
 const raw=JSON.parse(serializeSculptTerrain(old));
 for(const bad of [{waterMaterialRuns:[[63,2,'water.swamp']]},{waterMaterialRuns:[[1,1,'unknown']]},{waterMaterialRuns:[[2,3,'water.swamp'],[4,1,'water.turquoise']]},{waterAnimationFps:99},{waterFoamPct:-1}]){
  assert.throws(()=>importSculptTerrain({...raw,...bad}));
 }
});
test('shore contact does not create foam between two wet material types',()=>{
 let t=stroke(base(),3,3,'water-fill','water.turquoise');
 t=stroke(t,4,3,'water-fill','water.swamp');
 assert.deepEqual(sculptWetShoreEdges(t,3,3),['north','south','west']);
});
test('36 actual image frames share one reusable canvas and a material clock',async()=>{
 assert.equal(animatedSurfaceFrame(0),0);assert.equal(animatedSurfaceFrame(SURFACE_FRAME_COUNT/8),0);
 assert.equal(SURFACE_FRAME_COUNT,36);
 assert.equal(animatedSurfaceFrame(-1/8),35);
 assert.equal(surfaceMaterialFrame('water.clear_blue',2.25,8),0);
 assert.equal(surfaceMaterialFrame('water.clear_blue',.5,4),4);
 assert.equal(surfaceMaterialFrame('water.clear_blue',4.5,4),0);
 assert.notEqual(surfaceMaterialFrame('water.swamp',.5,8),surfaceMaterialFrame('water.forest_stream',.5,8));
 let requests=0;const fakeImage=()=>{requests++;return {naturalWidth:1008,naturalHeight:756,set src(v){this.onload();}};};
 const loaded=await loadAnimatedSurfaceAtlas('water.turquoise',fakeImage);
 assert.equal(await loadAnimatedSurfaceAtlas('water.turquoise',fakeImage),loaded);assert.equal(requests,1);
 assert.match(animatedSurfaceAtlasUrl('water.lava'),/lave\.png\?rev=surface-fluidity-36-v2-seamless$/);
 let allocations=0;const canvas=()=>{allocations++;const calls=[];
  const ctx={clearRect(){},drawImage(...v){calls.push(v)}};
  return {calls,getContext(){return ctx}};
 };
 const a=animatedSurfaceSprite('water.turquoise',0,canvas);
 assert.equal(a.width,SURFACE_TILE.width);
 assert.equal(a.calls[0][1],0);
 const b=animatedSurfaceSprite('water.turquoise',1,canvas);
 assert.equal(a,b);assert.equal(b.calls[1][1],SURFACE_TILE.width);
 assert.equal(animatedSurfaceSprite('water.turquoise',36,canvas),a);
 const before=a.calls.length;
 assert.equal(animatedSurfaceSprite('water.turquoise',35.5,canvas),a);
 assert.equal(a.calls.length,before+2); // fractional seam blends last and first
 assert.equal(a.calls.at(-2)[1],5*SURFACE_TILE.width);
 assert.equal(a.calls.at(-2)[2],5*SURFACE_TILE.height);
 assert.equal(a.calls.at(-1)[1],0);
 assert.equal(a.calls.at(-1)[2],0);
 assert.equal(allocations,1);
 assert.equal(animatedSurfaceSprite('unknown',0,canvas),null);
});
test('lava is a paintable material without changing water geometry',()=>{
 const old=stroke(base(),3,3,'water-fill','water.clear_blue');
 const lava=stroke(old,3,3,'water-paint','water.lava');
 assert.equal(lava.waterLevels,old.waterLevels);
 assert.equal(sculptWaterMaterialCells(lava)[27],'water.lava');
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(lava)),lava);
});
test('world area normalizer and scene export preserve visual choices',async()=>{
 const {normalizeWorldArea}=await import('../src/world/world-area-model.js');
 const {serializeSculptPreviewScene,importSculptPreviewScene}=await import('../src/world/sculpt-scene-preview.js');
 const t=setSculptWaterAnimation(stroke(base(),3,3,'water-fill','water.turquoise'),{fps:12,foamPct:40});
 const area=normalizeWorldArea({id:'area-test',label:'Test',kind:'exterior',width:224,height:168,sculptTerrain:JSON.parse(serializeSculptTerrain(t))});
 assert.deepEqual(area.sculptTerrain,t);
 assert.deepEqual(importSculptPreviewScene(serializeSculptPreviewScene(t)).terrain,t);
});

test('offline interpolation preserves all authored keyframes and creates distinct intermediate frames including the loop seam',async()=>{
 const {interpolateSurfaceLoop,FRAME_COUNT,SOURCE_FRAME_COUNT,SUBFRAMES}=await import('../scripts/build-living-water-atlases.mjs');
 const w=36,h=36,keys=Array.from({length:SOURCE_FRAME_COUNT},(_,k)=>Buffer.from(Array.from({length:w*h*3},(_,i)=>{const x=Math.floor(i/3)%w,y=Math.floor(i/(3*w));return Math.round(128+80*Math.sin((x-k*2)*Math.PI/9)+35*Math.cos(y*Math.PI/9));})));
 const frames=interpolateSurfaceLoop(keys,w,h);
 assert.equal(frames.length,FRAME_COUNT);assert.equal(FRAME_COUNT,36);
 for(let k=0;k<keys.length;k++){
  assert.equal(frames[k*SUBFRAMES],keys[k]);
  for(let n=1;n<SUBFRAMES;n++){
   const frame=frames[k*SUBFRAMES+n];assert.notDeepEqual(frame,keys[k]);assert.notDeepEqual(frame,keys[(k+1)%keys.length]);
   for(let y=0;y<h;y++)assert.deepEqual(frame.subarray(y*w*3,y*w*3+3),frame.subarray((y*w+w-1)*3,(y*w+w)*3));
   assert.deepEqual(frame.subarray(0,w*3),frame.subarray((h-1)*w*3,h*w*3));
  }
 }
});

test('periodic correction removes a ramp mismatch without a mirrored border strip',async()=>{
 const {sealTile}=await import('../scripts/build-living-water-atlases.mjs');
 const w=36,h=36,source=Buffer.alloc(w*h*3);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let c=0;c<3;c++)
  source[(y*w+x)*3+c]=Math.round(80+x*1.4+y*.8+16*Math.sin(2*Math.PI*x/(w-1))+12*Math.cos(2*Math.PI*y/(h-1)));
 const result=sealTile(Buffer.from(source),w,h);
 for(let y=0;y<h;y++)assert.deepEqual(result.subarray(y*w*3,y*w*3+3),result.subarray((y*w+w-1)*3,(y*w+w)*3));
 assert.deepEqual(result.subarray(0,w*3),result.subarray((h-1)*w*3));
 // The analytic periodic detail survives even near the former border strip.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const expected=80+35*1.4/2+35*.8/2+16*Math.sin(2*Math.PI*x/(w-1))+12*Math.cos(2*Math.PI*y/(h-1));
  assert.ok(Math.abs(result[(y*w+x)*3]-expected)<=2);
 }
});
