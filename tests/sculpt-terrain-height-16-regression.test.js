import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCULPT_MAX_TERRAIN_LEVEL,createSculptTerrain,applySculptBrush,
  serializeSculptTerrain,importSculptTerrain,sculptHeightAt,appendSculptSphere,
  appendSculptTerrainRamp,sculptTerrainRampProjections}
  from '../src/world/sculpt-height-model.js';

test('RED: sculpt terrain has a single 16-level cap for creation and brush authoring',()=>{
 assert.equal(SCULPT_MAX_TERRAIN_LEVEL,16);
 const t=createSculptTerrain({width:12,height:12,levels:Array(144).fill(12)});
 assert.equal(sculptHeightAt(t,4,4),12);
 const plateau=applySculptBrush(t,{mode:'plateau',target:16,radius:.5,x:4.5,y:4.5});
 assert.equal(sculptHeightAt(plateau,4,4),16);
 assert.equal(sculptHeightAt(applySculptBrush(plateau,{mode:'raise',strength:3,radius:.5,x:4.5,y:4.5}),4,4),16);
 assert.equal(sculptHeightAt(applySculptBrush(plateau,{mode:'dig',strength:2,radius:.5,x:4.5,y:4.5}),4,4),14);
});
test('16-level terrain is lossless through version-one export/import, old seven-level maps still work',()=>{
 const t=createSculptTerrain({width:12,height:12,levels:Array(144).fill(13),
   waterLevels:Array(144).fill(-1)});
 const restored=importSculptTerrain(serializeSculptTerrain(t));
 assert.deepEqual(restored.levels,t.levels);
 assert.equal(restored.schemaVersion,1);
 const old=importSculptTerrain(serializeSculptTerrain(createSculptTerrain({levels:Array(36*24).fill(7)})));
 assert.equal(Math.max(...old.levels),7);
 assert.throws(()=>importSculptTerrain({...JSON.parse(serializeSculptTerrain(t)),
   levels:Array(144).fill(17)}));
});
test('round hills can be authored on a 12-level plateau and native slopes still connect 2 to 12',()=>{
 const t=createSculptTerrain({width:18,height:22,
   levels:Array.from({length:18*22},(_,i)=>Math.floor(i/18)<=8?12:2)});
 const hill=appendSculptSphere(t,{kind:'hill',x:8*28,y:4*21,radius:28,height:2});
 assert.equal(hill.spheres.length,1,'baseLevel up to 16 must not reject existing sphere geometry');
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(hill)).spheres,hill.spheres);
 const ramp=appendSculptTerrainRamp(t,{x:8*28,y:16*21,endX:8*28,endY:6*21,width:56});
 assert.equal(sculptTerrainRampProjections(ramp).length,1);
});
test('UI slider and both quickbar handlers use the model cap, with independent 7-level spherical limit',()=>{
 const ui=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(ui,/id="target"[^>]*max="16"/);
 assert.match(js,/SCULPT_MAX_TERRAIN_LEVEL/);
 assert.match(js,/const limit=editorKind==='water'\?10:isSphere\?7:SCULPT_MAX_TERRAIN_LEVEL/);
 assert.match(js,/\$\('target'\)\.max=isSphere\?'7':String\(SCULPT_MAX_TERRAIN_LEVEL\)/);
});
