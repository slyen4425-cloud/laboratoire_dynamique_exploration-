import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,sculptWaterAt} from '../src/world/sculpt-height-model.js';
import {SCULPT_TILE,sculptWaterFaceDrop,sculptRockVisibleHeight,
  sculptWetShoreEdges} from '../src/render/sculpt-height-renderer.js';

const terrain=({width=12,height=10,water=[],heights=[]}={})=>{
  const levels=Array(width*height).fill(2);
  const waterLevels=Array(width*height).fill(-1);
  for(const [x,y,level] of heights)levels[y*width+x]=level;
  for(const [x,y,level] of water)waterLevels[y*width+x]=level;
  return createSculptTerrain({width,height,levels,waterLevels});
};

test('V33 no fake waterfall rectangle against DRY lower ground south or east',()=>{
  const map=terrain({water:[[4,4,5]],heights:[[4,4,1],[4,5,0],[5,4,0]]});
  assert.ok(sculptWaterAt(map,4,4)>0);
  assert.equal(sculptWaterFaceDrop(map,4,4,'south'),0);
  assert.equal(sculptWaterFaceDrop(map,4,4,'east'),0);
  assert.deepEqual(sculptWetShoreEdges(map,4,4),['north','east','south','west']);
});
test('V33 preserve genuine water-to-water fall but never a phantom equal-plane seam',()=>{
  const map=terrain({water:[[4,4,5],[4,5,3],[5,4,5]],heights:[[4,4,1],[4,5,1],[5,4,1]]});
  assert.equal(sculptWaterFaceDrop(map,4,4,'south'),2);
  assert.equal(sculptWaterFaceDrop(map,4,4,'east'),0);
  assert.equal(sculptWaterFaceDrop(map,4,4,'west'),0);
  assert.equal(sculptWaterFaceDrop(map,4,5,'north'),0);
});
test('V33 clip rock south and east when water covers the bottom of real wall',()=>{
  const map=terrain({water:[[4,5,4],[5,4,4]],heights:[[4,4,5],[4,5,1],[5,4,1]]});
  assert.equal(sculptRockVisibleHeight(map,4,4,'south',5,1),SCULPT_TILE.rise);
  assert.equal(sculptRockVisibleHeight(map,4,4,'east',5,1),SCULPT_TILE.rise-3);
  assert.equal(sculptRockVisibleHeight(map,3,3,'south',5,1),4*SCULPT_TILE.rise);
  assert.equal(sculptRockVisibleHeight(map,3,3,'east',5,1),
    4*SCULPT_TILE.rise+SCULPT_TILE.height-3);
  const drowned=terrain({water:[[4,5,6],[5,4,6]],heights:[[4,4,5],[4,5,1],[5,4,1]]});
  assert.equal(sculptRockVisibleHeight(drowned,4,4,'south',5,1),0);
  assert.equal(sculptRockVisibleHeight(drowned,4,4,'east',5,1),0);
});
test('V33 water data, collision elevations and terrain are never changed by visual queries',()=>{
  const map=terrain({water:[[4,4,5],[4,5,4]],heights:[[4,4,1],[4,5,2]]});
  const snapshot=JSON.stringify(map);
  sculptWaterFaceDrop(map,4,4,'south');
  sculptRockVisibleHeight(map,4,4,'south',5,2);
  assert.equal(JSON.stringify(map),snapshot);
  assert.equal(map.levels[4*map.width+4],1);
});
