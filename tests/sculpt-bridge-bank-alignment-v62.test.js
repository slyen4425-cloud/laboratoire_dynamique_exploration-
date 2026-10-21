import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptBridgeDeckHeight} from '../src/core/sculpt-navigation-collision.js';
import {sculptObjectVisualRect} from '../src/render/sculpt-object-picking.js';

const W=12,H=9;
const terrain=(wet=false)=>{
 const levels=Array(W*H).fill(6),waterLevels=Array(W*H).fill(-1);
 for(const col of [4,5,6]){levels[4*W+col]=0;if(wet)waterLevels[4*W+col]=8;}
 return createSculptTerrain({width:W,height:H,levels,waterLevels});
};
const center={x:5.5*28,y:4.5*21};
const bridge=(variant='horizontal',scale=.9)=>resolveWorldObjectPlacements(
 appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
 ...center,scale,variantId:variant}))[0];
test('V62 bridge sprite is anchored on dry-bank deck instead of 6-level canyon floor',()=>{
 for(const wet of [false,true]){
  const t=terrain(wet),s=serializeSculptTerrain(t),o=bridge();
  assert.equal(sculptBridgeDeckHeight(t,[o],center.x,center.y),6);
  const visual=sculptObjectVisualRect(o,t);
  assert.equal(visual.y,center.y-6*18);
  assert.equal(visual.x,center.x);
  assert.equal(serializeSculptTerrain(t),s,'render cannot edit terrain or water');
 }
});
test('V62 bridge without two dry supports falls back to its historical visual anchor',()=>{
 const t=terrain(true);
 const water=[...t.waterLevels];water[4*W+2]=8;water[4*W+8]=8;
 const blocked=createSculptTerrain({width:W,height:H,levels:t.levels,waterLevels:water});
 const o=bridge();
 assert.equal(sculptBridgeDeckHeight(blocked,[o],center.x,center.y),null);
 assert.equal(sculptObjectVisualRect(o,blocked).y,center.y);
});
test('V62 other sprites and historical bridge types preserve original V44 ground anchor',()=>{
 const t=terrain();
 const house=resolveWorldObjectPlacements(appendSculptPreviewObject([],{
  definitionId:'objectdef.building.house.blue_cottage.01',...center,scale:.9}))[0];
 assert.equal(sculptObjectVisualRect(house,t).y,center.y);
 const legacy=resolveWorldObjectPlacements(appendSculptPreviewObject([],{
  definitionId:'objectdef.bridge.wood.rustic_bank.01',...center,scale:.9}))[0];
 assert.equal(sculptObjectVisualRect(legacy,t).y,center.y);
});
test('V62 no duplicate authority, renderer and actual collision read identical supports',()=>{
 const source=readFileSync(new URL('../src/render/sculpt-object-picking.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(source,/sculptBridgeDeckHeight\(terrain,\[object\],t\.x,t\.y/);
 assert.match(source,/const level=bridgeDeck\?\?groundLevel/);
 assert.match(main,/sculpt-object-picking\.js\?rev=sculpt-(?:bridge-bank-v62|bridge-dimensions-v63)/);
 assert.match(page,/src\/sculpt-lab-main\.js\?rev=sculpt-(?:bridge-bank-v62|high-platform-bridge-v63|bridge-tactile-v64|bridge-camera-v65)/);
});
