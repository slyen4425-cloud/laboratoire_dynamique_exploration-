import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,applySculptStroke,serializeSculptTerrain,importSculptTerrain,sculptFaces}
 from '../src/world/sculpt-height-model.js';
import {SCULPT_TILE,sculptHillTopProfile,sculptHillGrassShoulderWidth}
 from '../src/render/sculpt-height-renderer.js';
const hill=()=>{
 const n=10,levels=Array(n*n).fill(2);
 for(let y=3;y<=5;y++)for(let x=3;x<=5;x++)levels[y*n+x]=5;
 return createSculptTerrain({width:n,height:n,levels});
};
test('V59 150% rounds the grass plateau more strongly and adds visual grass over dry cliffs',()=>{
 const original=hill(),soft=applySculptStroke(original,{
   mode:'cliff-round',points:[{x:3.5,y:3.5},{x:3.5,y:5.5}],radius:.5,rockRoundness:150});
 const profile=sculptHillTopProfile(soft,3,3);
 assert.ok(profile.radius>SCULPT_TILE.height*.70,
   'real grass top rounding should be substantially wider than V54 0.48 x tile');
 assert.deepEqual(profile.corners,[true,false,false,false]);
 assert.ok(sculptHillGrassShoulderWidth(soft,3,5,SCULPT_TILE)>9);
 assert.ok(sculptHillGrassShoulderWidth(soft,3,5,SCULPT_TILE,'east')===0,
   'east cliff must be real (not only selected pixel)');
 assert.equal(sculptHillGrassShoulderWidth(original,3,5),0);
 assert.equal(soft.levels,original.levels);
 assert.equal(soft.waterLevels,original.waterLevels);
 assert.deepEqual(sculptFaces(soft),sculptFaces(original));
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(soft)),soft);
});
test('V59 only painted dry cliffs have grass shoulders, not lake walls',()=>{
 const first=hill(),waterLevels=[...first.waterLevels];
 waterLevels[6*10+3]=5;
 const roundness=[...first.roundness];roundness[5*10+3]=150;
 const t=createSculptTerrain({width:10,height:10,levels:first.levels,roundness,waterLevels});
 assert.equal(sculptHillGrassShoulderWidth(t,3,5),0,
   'sensitive water masks remain unchanged');
 assert.equal(sculptHillGrassShoulderWidth(t,3,5,SCULPT_TILE,'east'),0);
 assert.equal(sculptHillGrassShoulderWidth(t,4,4),0);
});
test('V59 stays wholly in renderer visual authority, with original grass materials',()=>{
 const render=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(render,/drawSculptGrassShoulder\(ctx,\{x,y,band,width,pattern,baseColor/);
 assert.match(render,/ctx\.strokeStyle=pattern\?\?baseColor/);
 assert.match(render,/sculptHillGrassShoulderWidth\(terrain,c,row,tile\)/);
 assert.match(render,/sculptHillTopPath\(ctx,x,y,w,h,hill\)/);
 assert.match(main,/sculpt-(?:hill-shoulder-v59|whole-hill-v61)/);
 assert.match(html,/sculpt-(?:hill-shoulder-v59|bridge-crossing-v60|whole-hill-v61|bridge-bank-v62|high-platform-bridge-v63|bridge-tactile-v64|bridge-camera-v65)/);
 assert.doesNotMatch(render,/isBlocked\(/);
});
