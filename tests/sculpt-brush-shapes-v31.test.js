import test from 'node:test';
import assert from 'node:assert/strict';
import {SCULPT_BRUSH_SHAPES,createSculptTerrain,sculptBrushFootprint,
 applySculptStroke,applySculptWaterStroke} from '../src/world/sculpt-height-model.js';

const shapeOptions=(shape)=>({shape,points:[{x:8.5,y:8.5}],radius:3,mode:'raise'});
test('V31 circle retains legacy footprint, square is FULL and cross has no diagonal spurs',()=>{
 const terrain=createSculptTerrain({width:20,height:20});
 assert.deepEqual(SCULPT_BRUSH_SHAPES,['circle','square','cross']);
 const circle=sculptBrushFootprint(terrain,shapeOptions('circle'));
 const legacy=sculptBrushFootprint(terrain,{...shapeOptions('circle'),shape:undefined});
 assert.deepEqual(circle,legacy);
 const square=sculptBrushFootprint(terrain,shapeOptions('square'));
 const cross=sculptBrushFootprint(terrain,shapeOptions('cross'));
 assert.equal(circle.length,29);
 assert.equal(square.length,49);
 assert.equal(cross.length,13);
 for(let y=5;y<=11;y++)for(let x=5;x<=11;x++)
   assert.ok(square.some(cell=>cell.x===x&&cell.y===y));
 assert.ok(cross.every(cell=>cell.x===8||cell.y===8));
 assert.ok(!cross.some(cell=>cell.x===7&&cell.y===7));
});
test('V31 preview footprint exactly matches real edited land and water cells',()=>{
 const terrain=createSculptTerrain({width:20,height:20});
 for(const shape of SCULPT_BRUSH_SHAPES){
   const mark=sculptBrushFootprint(terrain,shapeOptions(shape));
   const after=applySculptStroke(terrain,{...shapeOptions(shape),strength:1});
   const touched=after.levels.map((v,i)=>v!==terrain.levels[i]?i:-1).filter(i=>i>=0);
   const footprint=mark.map(m=>m.y*terrain.width+m.x).sort((a,b)=>a-b);
   assert.deepEqual(touched,footprint);
   const wet=applySculptWaterStroke(terrain,{...shapeOptions(shape),mode:'water-rise'});
   const waterEdited=wet.waterLevels.map((v,i)=>v!==terrain.waterLevels[i]?i:-1).filter(i=>i>=0);
   assert.deepEqual(waterEdited,footprint);
 }
});
test('V31 partial softness respects square boundary and legacy water protection',()=>{
 const water=Array(20*20).fill(-1);water[8*20+8]=4;
 const terrain=createSculptTerrain({width:20,height:20,waterLevels:water});
 const options={...shapeOptions('square'),edgeSoftness:.5};
 const footprint=sculptBrushFootprint(terrain,options);
 assert.ok(!footprint.some(p=>p.x===8&&p.y===8));
 assert.ok(footprint.every(p=>Math.abs(p.x-8)<=3&&Math.abs(p.y-8)<=3));
 const after=applySculptStroke(terrain,{...options,strength:2});
 assert.equal(after.levels[8*20+8],terrain.levels[8*20+8]);
 assert.equal(after.waterLevels[8*20+8],4);
});
