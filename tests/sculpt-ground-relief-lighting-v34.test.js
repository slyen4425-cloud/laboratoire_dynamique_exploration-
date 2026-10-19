import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,sculptHeightAt} from '../src/world/sculpt-height-model.js';
import {sculptGroundReliefLighting} from '../src/render/sculpt-height-renderer.js';

const world=(changes=[],water=[] )=>{
  const width=9,height=9,levels=Array(width*height).fill(2),
    waterLevels=Array(width*height).fill(-1);
  for(const [x,y,z] of changes)levels[y*width+x]=z;
  for(const [x,y,z] of water)waterLevels[y*width+x]=z;
  return createSculptTerrain({width,height,levels,waterLevels});
};
test('V34 flat land never gets fake patchwork seams or elevation tint',()=>{
  const terrain=world();
  for(let y=0;y<terrain.height;y++)for(let x=0;x<terrain.width;x++){
    const info=sculptGroundReliefLighting(terrain,x,y);
    assert.equal(info.tone,0);
    assert.deepEqual(info.contactShadows,[]);
    assert.deepEqual(info.exposedEdges,[]);
  }
});
test('V34 genuine elevation ledge makes a soft ground contact, not a physical obstacle',()=>{
  const terrain=world([[4,4,4]]);
  const south=sculptGroundReliefLighting(terrain,4,5);
  assert.deepEqual(south.contactShadows.map(x=>x.side),['north']);
  assert.ok(south.contactShadows[0].opacity>0&&south.contactShadows[0].opacity<.4);
  assert.deepEqual(sculptGroundReliefLighting(terrain,3,4).contactShadows.map(x=>x.side),['east']);
  assert.deepEqual(sculptGroundReliefLighting(terrain,4,4).exposedEdges,['north','east','south','west']);
  assert.ok(sculptGroundReliefLighting(terrain,4,4).tone>0);
  assert.equal(sculptHeightAt(terrain,4,4),4,'rendering must not mutate physical elevations');
});
test('V34 no fake shadow at water contacts, no trace on submerged cell',()=>{
  const terrain=world([[4,4,4]],[[4,5,5]]);
  assert.deepEqual(sculptGroundReliefLighting(terrain,4,5).contactShadows,[]);
  assert.ok(!sculptGroundReliefLighting(terrain,4,4).exposedEdges.includes('south'));
});
test('V34 wide terraces are consistently tinted, clipped and remain immutable',()=>{
  const terrain=world([[3,3,7],[4,3,7],[5,3,0]]);
  const high=sculptGroundReliefLighting(terrain,3,3);
  assert.ok(high.tone>0&&high.tone<=.105);
  assert.ok(!high.exposedEdges.includes('east'));
  assert.equal(sculptGroundReliefLighting(terrain,5,3).tone,-.058);
  assert.ok(Object.isFrozen(high)&&Object.isFrozen(high.contactShadows));
});
