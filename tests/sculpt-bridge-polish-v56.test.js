import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,updateSculptPreviewObject,
  serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {cleanSculptBridgePixels,prepareSculptBridgeImage} from '../src/assets/sculpt-bridge-alpha.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';

test('V56 bridge scale reaches 300 %, keeps geometry, and other objects stay <=120 %',()=>{
  const w=createSculptTerrain({width:20,height:16});
  const id='objectdef.bridge.wood_rustic_2p5d.01';
  let bridges=appendSculptPreviewObject([],{definitionId:id,x:180,y:144,scale:.4,variantId:'horizontal'});
  const before=bridgeTraversalRect(resolveWorldObjectPlacements(bridges)[0]);
  bridges=updateSculptPreviewObject(bridges,bridges[0].id,{scale:3});
  assert.equal(bridges[0].transform.scaleX,3);
  assert.equal(bridges[0].transform.scaleY,3);
  const after=bridgeTraversalRect(resolveWorldObjectPlacements(bridges)[0]);
  assert.ok(after.length>before.length*7);
  assert.ok(Math.abs(after.width/before.width-7.5)<1e-10);
  assert.equal(importSculptPreviewScene(serializeSculptPreviewScene(w,bridges)).objects[0].transform.scaleX,3);
  const house=appendSculptPreviewObject([],{definitionId:'objectdef.building.house.blue_cottage.01',x:180,y:140,scale:.4});
  const prevented=updateSculptPreviewObject(house,house[0].id,{scale:3});
  assert.equal(prevented[0].transform.scaleX,.4);
});
test('V56 remove detached white diamonds but preserve actual connected pale detail',()=>{
  const width=16,height=16,data=new Uint8ClampedArray(width*height*4);
  const put=(x,y,color,alpha)=>{const j=(y*width+x)*4;data.set([...color,alpha],j);};
  for(let y=4;y<10;y++)for(let x=4;x<10;x++)put(x,y,[96,72,56],255);
  put(6,6,[250,250,248],255); // real connected reflection, must survive
  put(10,6,[242,240,242],100); // pale translucent edge halo connected to body
  for(const [x,y] of [[13,13],[14,13],[13,14],[14,14]])put(x,y,[255,254,254],255);
  const result=cleanSculptBridgePixels({width,height,data});
  assert.equal(result.removed,4);
  assert.equal(result.softened,1);
  assert.equal(data[(13*width+13)*4+3],0);
  assert.equal(data[(6*width+6)*4+3],255);
  assert.equal(data[(6*width+10)*4+3],65);
  assert.equal(prepareSculptBridgeImage(null),null,'invalid image falls back unchanged');
});
test('V56 clean data is pure alpha repair and not an object collision authority',()=>{
  const w=4,h=4,data=new Uint8ClampedArray(w*h*4),before=data.slice();
  assert.equal(cleanSculptBridgePixels({width:w,height:h,data}).changed,false);
  assert.deepEqual(data,before);
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const src=readFileSync(new URL('../src/assets/sculpt-bridge-alpha.js',import.meta.url),'utf8');
  const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(main,/object-scale'\)\.max=\$\('object-category'/);
  assert.match(main,/prepareSculptBridgeImage\(picture\)/);
  assert.match(src,/ctx\.getImageData/);
  assert.doesNotMatch(src,/isBlocked|CollisionWorld|WorldDocument/);
  assert.match(page,/rev=sculpt-(?:bridge-polish-v56|bridge-deck-v57|bridge-foot-clean-v58|hill-shoulder-v59|bridge-crossing-v60|whole-hill-v61)/);
});
