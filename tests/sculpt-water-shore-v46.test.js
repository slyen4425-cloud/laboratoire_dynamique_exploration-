import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,sculptWaterAt} from '../src/world/sculpt-height-model.js';
import {sculptWetShoreEdges,sculptWetShoreProfile} from '../src/render/sculpt-height-renderer.js';
const terrainFromWater=(wet)=>{
  const width=8,height=8,waterLevels=Array(width*height).fill(-1);
  for(const [col,row] of wet)waterLevels[row*width+col]=4;
  return createSculptTerrain({width,height,levels:Array(width*height).fill(2),waterLevels});
};
test('V46 isolated water tile has four soft shore sides and unchanged wet grid',()=>{
  const terrain=terrainFromWater([[3,3]]);
  const before=JSON.stringify(terrain);
  const shore=sculptWetShoreProfile(terrain,3,3);
  assert.deepEqual(shore.edges,['north','east','south','west']);
  assert.equal(shore.radius>4,true);
  assert.equal(shore.inset>0,true);
  assert.equal(shore.bend>0,true);
  assert.equal(sculptWaterAt(terrain,3,3),2);
  assert.equal(sculptWaterAt(terrain,3,4),0);
  assert.equal(JSON.stringify(terrain),before);
});
test('V46 joined water cells have no seam on wet-to-wet common boundary',()=>{
  const terrain=terrainFromWater([[3,3],[4,3],[3,4],[4,4]]);
  const a=sculptWetShoreProfile(terrain,3,3),b=sculptWetShoreProfile(terrain,4,3);
  assert.deepEqual(a.edges,['north','west']);
  assert.deepEqual(b.edges,['north','east']);
  assert.equal(a.edges.includes('east'),false);
  assert.equal(b.edges.includes('west'),false);
  assert.deepEqual(sculptWetShoreEdges(terrain,3,3),a.edges);
  assert.deepEqual(sculptWetShoreProfile(terrain,0,0).edges,[]);
});
