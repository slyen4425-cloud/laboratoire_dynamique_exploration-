import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,sculptWaterAt} from '../src/world/sculpt-height-model.js';
import {sculptWetShoreEdges,sculptRockToeSegments} from '../src/render/sculpt-height-renderer.js';

function terrainWithWater(wet=[]){
  const width=8,height=8;
  const waterLevels=Array(width*height).fill(-1);
  for(const [x,y] of wet)waterLevels[y*width+x]=4;
  return createSculptTerrain({width,height,waterLevels});
}
test('V28 foam boundaries derive only from actual wet/dry heightfield contacts',()=>{
  const ground=terrainWithWater([]);
  assert.deepEqual(sculptWetShoreEdges(ground,3,3),[]);
  const pond=terrainWithWater([[3,3],[4,3],[3,4],[4,4]]);
  assert.equal(sculptWaterAt(pond,3,3),2);
  assert.deepEqual(sculptWetShoreEdges(pond,3,3),['north','west']);
  assert.deepEqual(sculptWetShoreEdges(pond,4,3),['north','east']);
  assert.deepEqual(sculptWetShoreEdges(pond,3,4),['south','west']);
  assert.deepEqual(sculptWetShoreEdges(pond,4,4),['east','south']);
  const pondBelowSurface=createSculptTerrain({width:8,height:8,
    waterLevels:Array(64).fill(2)});
  assert.deepEqual(sculptWetShoreEdges(pondBelowSurface,2,2),[]);
});
test('V28 rock toes cannot float above submerged cells south of a wall',()=>{
  const pond=terrainWithWater([[2,4],[3,4],[6,4]]);
  assert.deepEqual(sculptRockToeSegments(pond,3,1,7),[
    {from:1,to:2},{from:4,to:6}
  ]);
  assert.deepEqual(sculptRockToeSegments(pond,3,2,4),[]);
  assert.deepEqual(sculptRockToeSegments(pond,6,1,7),[{from:1,to:7}]);
  assert.deepEqual(sculptRockToeSegments(pond,7,1,7),[{from:1,to:7}]);
});
test('V28 above water but dry land surface does not lose curved rock toes',()=>{
  const dry=createSculptTerrain({width:8,height:8,waterLevels:Array(64).fill(2)});
  assert.deepEqual(sculptRockToeSegments(dry,2,1,5),[{from:1,to:5}]);
});
