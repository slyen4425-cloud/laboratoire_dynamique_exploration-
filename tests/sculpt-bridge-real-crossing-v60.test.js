import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {sculptBridgeBankHeights,sculptBridgeDeckAt,sculptNavigationBlockDetail}
 from '../src/core/sculpt-navigation-collision.js';
import {isBlocked} from '../src/core/collision.js';
import {stepMovement} from '../src/core/movement.js';

const W=12,H=9,cellWidth=28,cellHeight=21;
const at=(col,row)=>({x:(col+.5)*cellWidth,y:(row+.5)*cellHeight});
const actor=(col=3,row=4)=>({...at(col,row),radius:5,locomotion:{modes:['ground']},facingX:1});
const makeGorge=({wet=false,spike=false}={})=>{
 const levels=Array(W*H).fill(6),waterLevels=Array(W*H).fill(-1);
 for(const col of [4,5,6]){levels[4*W+col]=0;if(wet)waterLevels[4*W+col]=7;}
 if(spike)levels[4*W+5]=7;
 return createSculptTerrain({width:W,height:H,levels,waterLevels});
};
const bridge=(scale=.9,variantId='horizontal')=>{
 const placements=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
  ...at(5,4),scale,variantId});
 return {placements,objects:resolveWorldObjectPlacements(placements)};
};
const world=placements=>({width:W*cellWidth,height:H*cellHeight,objects:placements,obstacles:[]});
const context=(terrain,objects)=>({sculptNavigation:{terrain,cellWidth,cellHeight,maxStepUp:2,
 maxStepDown:2,bridges:objects},objectCatalog:undefined});
test('V60 real gorge bridge: walk across steep dry and wet gap; no bridge must block',()=>{
 for(const wet of [false,true]){
  const t=makeGorge({wet}),snapshot=serializeSculptTerrain(t);
  const {placements,objects}=bridge();
  const nav=context(t,objects),p=actor(),target=at(7,4);
  assert.equal(sculptNavigationBlockDetail(context(t,[]).sculptNavigation,p,target.x,target.y)?.kind,
   wet?'water':'height-down');
  assert.deepEqual(sculptBridgeBankHeights(t,bridgeTraversalRect(objects[0]),{cellWidth,cellHeight}),[6,6]);
  assert.equal(isBlocked(world(placements),p,target.x,target.y,undefined,nav),false);
  stepMovement(world(placements),p,{x:1,y:0},2.4,{maxSpeed:55},undefined,nav);
  assert.ok(p.x>7*cellWidth,`failed full crossing of ${wet?'wet':'dry'} gorge`);
  assert.equal(serializeSculptTerrain(t),snapshot);
  assert.equal(sculptBridgeDeckAt(objects,at(5,1).x,at(5,1).y,5),null);
 }
});
test('V60 still blocks tall rock spike that protrudes ABOVE supported deck',()=>{
 const t=makeGorge({spike:true});
 const {objects}=bridge();
 const block=sculptNavigationBlockDetail(context(t,objects).sculptNavigation,
  actor(4,4),at(6,4).x,at(6,4).y);
 assert.equal(block?.kind,'height-up');
 assert.equal(block.delta,7);
});
test('V60 no unsupported floating bridgehead or side entrance can bypass cliff',()=>{
 const t=makeGorge();
 const {objects}=bridge(.9);
 const across=bridgeTraversalRect(objects[0]);
 const unsupported=createSculptTerrain({width:W,height:H,
  levels:t.levels,waterLevels:t.waterLevels.map((v,i)=>i===4*W+2||i===4*W+8?10:v)});
 assert.equal(sculptBridgeBankHeights(unsupported,across,{cellWidth,cellHeight}),null);
 assert.equal(sculptNavigationBlockDetail(context(unsupported,objects).sculptNavigation,
  actor(),at(7,4).x,at(7,4).y)?.kind,'height-down');
 // A side approach enters the corridor far from its end; cannot jump a 6-level cliff.
 const sideLevels=Array(W*H).fill(6);
 for(const row of [4,5])sideLevels[row*W+5]=0;
 const side=createSculptTerrain({width:W,height:H,levels:sideLevels});
 const sideActor=actor(5,2); 
 assert.equal(sculptNavigationBlockDetail(context(side,objects).sculptNavigation,
   sideActor,at(5,4).x,at(5,4).y)?.kind,'height-down');
});
test('V60 native movement/terrain permissions remain in Collision World, not UI pixels',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const nav=readFileSync(new URL('../src/core/sculpt-navigation-collision.js',import.meta.url),'utf8');
 assert.match(nav,/sculptBridgeBankHeights\(terrain,crossingDeck,options\)/);
 assert.match(nav,/supportedBridgeStep/);
 assert.match(main,/bridges:resolvedSculptBridges\(\)/);
 assert.doesNotMatch(nav,/drawImage\(|getImageData\(|naturalWidth/);
});
