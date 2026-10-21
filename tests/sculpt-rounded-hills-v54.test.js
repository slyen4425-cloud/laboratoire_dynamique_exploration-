import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,applySculptStroke,serializeSculptTerrain,importSculptTerrain,sculptFaces} from '../src/world/sculpt-height-model.js';
import {SCULPT_TILE,sculptHillTopProfile} from '../src/render/sculpt-height-renderer.js';

const hill=()=>{
  const n=10,levels=Array(n*n).fill(2);
  for(let y=3;y<=5;y++)for(let x=3;x<=5;x++)levels[y*n+x]=5;
  return createSculptTerrain({width:n,height:n,levels});
};
test('V54 untouched hill grass and cliff remain on original pixel path',()=>{
  const terrain=hill();
  for(let y=0;y<10;y++)for(let x=0;x<10;x++)
    assert.equal(sculptHillTopProfile(terrain,x,y).radius,0);
});
test('V54 painted summit rounds convex grass top only, not all horizontal tiles',()=>{
  const original=hill(),levelsBefore=[...original.levels];
  const rounded=applySculptStroke(original,{
    mode:'cliff-round',rockRoundness:150,points:[{x:3.5,y:3.5}],
    radius:.5});
  const profile=sculptHillTopProfile(rounded,3,3);
  assert.ok(profile.radius>=SCULPT_TILE.height*.4);
  assert.deepEqual(profile.corners,[true,false,false,false]);
  assert.equal(sculptHillTopProfile(rounded,4,4).radius,0);
  assert.equal(sculptHillTopProfile(original,3,3).radius,0);
  assert.deepEqual(rounded.levels,original.levels);
  assert.deepEqual([...rounded.levels],levelsBefore);
  assert.equal(rounded.waterLevels,original.waterLevels);
  assert.deepEqual(sculptFaces(rounded),sculptFaces(original));
  assert.deepEqual(importSculptTerrain(serializeSculptTerrain(rounded)),rounded);
});
test('V54 roundness 0/95 is original; water-contact cliffs are not reshaped',()=>{
  const ground=hill();
  const zero=applySculptStroke(ground,{mode:'cliff-round',rockRoundness:0,
    radius:.5,points:[{x:3.5,y:3.5}]});
  assert.equal(sculptHillTopProfile(zero,3,3).radius,0);
  const restore=applySculptStroke(zero,{mode:'cliff-round',rockRoundness:95,
    radius:.5,points:[{x:3.5,y:3.5}]});
  assert.equal(sculptHillTopProfile(restore,3,3).radius,0);
  const water=[...ground.waterLevels];water[3*10+2]=6;
  const wet=createSculptTerrain({width:10,height:10,levels:ground.levels,waterLevels:water,
    roundness:ground.roundness.map((v,i)=>i===3*10+3?150:v)});
  const visual=sculptHillTopProfile(wet,3,3);
  assert.equal(visual.corners[0],false);
});
test('V54 UI explains a real paint gesture and keeps canonical rendering',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const render=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
  assert.match(html,/Arrondir les collines \(herbe \+ roche\)/);
  assert.match(main,/\$\('hill-radius-wrap'\)\.hidden=mode!=='cliff-round'/);
  assert.match(render,/sculptHillTopPath\(ctx,x,y,w,h,hill\);ctx\.clip\(\)/);
  assert.doesNotMatch(render,/isBlocked\(/);
});
