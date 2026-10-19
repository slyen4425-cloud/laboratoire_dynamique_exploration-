import test from 'node:test';
import assert from 'node:assert/strict';
import {sculptVisualHeightStep} from '../src/core/sculpt-visual-height-step.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptNavigationSample} from '../src/core/sculpt-navigation-collision.js';
test('V29 display elevation eases one step without jumping or overshooting',()=>{
  let v=2;const samples=[];
  for(let i=0;i<14;i++){v=sculptVisualHeightStep(v,3,16);samples.push(v);}
  assert.ok(samples[0]>2&&samples[0]<2.2);
  assert.ok(samples.every((n,i)=>n<3&&(i===0||n>=samples[i-1])));
  assert.ok(samples.at(-1)>2.89);
  assert.equal(sculptVisualHeightStep(3,3,16),3);
});
test('V29 Android frame drop remains continuous in display only',()=>{
  const next=sculptVisualHeightStep(2,3,190);
  assert.ok(next>2.85&&next<3);
  assert.equal(sculptVisualHeightStep(2,3,0),2);
  assert.equal(sculptVisualHeightStep(null,3,20),3); // initialized display
});
test('V29 canonical collision height is discrete and unchanged by easing',()=>{
  const levels=Array(8*8).fill(2);levels[3*8+4]=3;
  const terrain=createSculptTerrain({width:8,height:8,levels});
  const native=sculptNavigationSample(terrain,4.5*28,3.5*21,{cellWidth:28,cellHeight:21});
  assert.equal(native.level,3);
  const visual=sculptVisualHeightStep(2,native.level,16);
  assert.ok(visual>2&&visual<3);
  assert.equal(terrain.levels[3*8+4],3);
});
