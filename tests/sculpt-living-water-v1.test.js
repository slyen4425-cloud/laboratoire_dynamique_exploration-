import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,applySculptWaterStroke,serializeSculptTerrain,importSculptTerrain,setSculptWaterAnimation,sculptWaterAt} from '../src/world/sculpt-height-model.js';
import {sculptWaterMaterialCells,DEFAULT_SCULPT_WATER_MATERIAL} from '../src/world/sculpt-water-materials-v1.js';
import {animatedSurfaceFrame,animatedSurfaceSprite,SURFACE_FRAME_COUNT} from '../src/render/animated-surface-sprites-v1.js';
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
test('sprite loop uses twelve distinct frames, stable cache and bounded timing',()=>{
 assert.equal(animatedSurfaceFrame(0),0);assert.equal(animatedSurfaceFrame(SURFACE_FRAME_COUNT/8),0);
 assert.equal(animatedSurfaceFrame(-1/8),11);
 let allocations=0;const canvas=()=>{allocations++;const calls=[];
  const ctx={beginPath(){},moveTo(...v){calls.push(v)},quadraticCurveTo(...v){calls.push(v)},stroke(){}};
  return {calls,getContext(){return ctx}};
 };
 const a=animatedSurfaceSprite('water.turquoise',0,canvas);
 const b=animatedSurfaceSprite('water.turquoise',1,canvas);
 assert.notDeepEqual(a.calls,b.calls);
 assert.equal(animatedSurfaceSprite('water.turquoise',12,canvas),a);
 assert.equal(allocations,2);
 assert.equal(animatedSurfaceSprite('unknown',0,canvas),null);
});
test('world area normalizer and scene export preserve visual choices',async()=>{
 const {normalizeWorldArea}=await import('../src/world/world-area-model.js');
 const {serializeSculptPreviewScene,importSculptPreviewScene}=await import('../src/world/sculpt-scene-preview.js');
 const t=setSculptWaterAnimation(stroke(base(),3,3,'water-fill','water.turquoise'),{fps:12,foamPct:40});
 const area=normalizeWorldArea({id:'area-test',label:'Test',kind:'exterior',width:224,height:168,sculptTerrain:JSON.parse(serializeSculptTerrain(t))});
 assert.deepEqual(area.sculptTerrain,t);
 assert.deepEqual(importSculptPreviewScene(serializeSculptPreviewScene(t)).terrain,t);
});
