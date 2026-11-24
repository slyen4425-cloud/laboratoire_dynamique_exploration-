import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,appendSculptNavigationAllowedCorridor,
  removeSculptNavigationAllowedCorridorAt,sculptNavigationWaterSupports,
  importSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {stepMovement} from '../src/core/movement.js';

const width=18,height=16;
const point=(col,row)=>({x:(col+.5)*28,y:(row+.5)*21});
const terrain=createSculptTerrain({width,height,levels:Array(width*height).fill(2),
  waterLevels:Array.from({length:width*height},(_,i)=>i%width>=6&&i%width<=10?4:-1)});
const start=point(4,8),end=point(12,8);
const trace={...start,endX:end.x,endY:end.y,width:54,support:'footbridge'};
const walk=(t,actor,dir,frames=65)=>{
  const world={width:width*28,height:height*21,objects:[],obstacles:[]};
  const ctx={sculptNavigation:{terrain:t,bridges:sculptNavigationWaterSupports(t),stairs:[]}};
  for(let i=0;i<frames;i++)stepMovement(world,actor,dir,.04,{maxSpeed:95},undefined,ctx);
};
test('an explicit bank-to-bank crossing uses the native bridge carrier and survives saving',()=>{
  const t=appendSculptNavigationAllowedCorridor(terrain,trace);
  assert.notEqual(t,terrain);
  const saved=importSculptTerrain(serializeSculptTerrain(t));
  const actor={...point(3,8),radius:5,locomotion:{modes:['ground']}};
  walk(saved,actor,{x:1,y:0},36);
  assert.equal(actor.sculptBridgeId,saved.ramps[0].id);
  const mid=actor.x;walk(saved,actor,{x:0,y:1},24);
  assert.ok(Math.abs(actor.y-start.y)<27);
  walk(saved,actor,{x:1,y:0},60);assert.ok(actor.x>end.x && actor.x>mid);
  walk(saved,actor,{x:-1,y:0},100);assert.ok(actor.x<start.x);
  const restored=removeSculptNavigationAllowedCorridorAt(saved,(start.x+end.x)/2,start.y);
  const blocked={...point(3,8),radius:5,locomotion:{modes:['ground']}};
  walk(restored,blocked,{x:1,y:0});assert.ok(blocked.x<7*28);
  assert.deepEqual(restored.waterLevels,terrain.waterLevels);
});
test('water needs two safe dry ends and an explicit support; edited banks invalidate the deck',()=>{
  for(const options of [{...trace,support:undefined},{...trace,...point(8,8)},
    {...trace,endX:point(3,8).x},{...trace,endX:-20}])
    assert.equal(appendSculptNavigationAllowedCorridor(terrain,options),terrain);
  const t=appendSculptNavigationAllowedCorridor(terrain,trace);
  const flood=[...t.waterLevels];flood[8*width+12]=4;
  assert.deepEqual(sculptNavigationWaterSupports(createSculptTerrain({...t,waterLevels:flood})),[]);
});
