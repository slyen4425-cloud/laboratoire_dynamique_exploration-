import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,applySculptStroke,applySculptWaterStroke,sculptWaterAt} from '../src/world/sculpt-height-model.js';
import {sculptWaterSouthDrop,sculptRockToeSegments,sculptWetShoreEdges} from '../src/render/sculpt-height-renderer.js';
import {isSculptNavigationBlocked} from '../src/core/sculpt-navigation-collision.js';

const make=()=>createSculptTerrain({width:12,height:10,levels:Array(120).fill(2)});
test('V33 dry south shore never creates a dangling water-wall rectangle',()=>{
 const ground=make();
 const shore=applySculptWaterStroke(ground,{points:[{x:6.5,y:3.5}],
   radius:3,mode:'water-fill',target:6,shape:'square'});
 for(let x=4;x<=8;x++)assert.equal(sculptWaterSouthDrop(shore,x,6),0);
 assert.ok(sculptWaterAt(shore,6,6)>0);
 assert.equal(sculptWaterSouthDrop(shore,6,6),0);
 assert.ok(sculptWetShoreEdges(shore,6,6).includes('south'));
});
test('V33 only physically adjacent WET cells with a decreasing water surface make a waterfall',()=>{
 const before=make();
 const i=(x,y)=>y*before.width+x;
 const water=Array(120).fill(-1);
 water[i(5,5)]=6;water[i(5,6)]=3;
 water[i(6,5)]=6;water[i(6,6)]=6;
 water[i(7,5)]=3;water[i(7,6)]=6;
 const scene=createSculptTerrain({width:12,height:10,levels:before.levels,waterLevels:water});
 assert.equal(sculptWaterSouthDrop(scene,5,5),3);
 assert.equal(sculptWaterSouthDrop(scene,6,5),0);
 assert.equal(sculptWaterSouthDrop(scene,7,5),0);
 assert.equal(sculptWaterSouthDrop(scene,8,5),0);
 assert.equal(sculptWaterSouthDrop(scene,5,9),0);
});
test('V33 immersed cliff feet do not paint isolated rocks on or just behind water',()=>{
 const base=make(), water=Array(120).fill(-1);
 water[4*12+5]=6; // the wall itself is submerged
 water[5*12+7]=6; // cell immediately in front of a dry wall
 const scene=createSculptTerrain({width:12,height:10,levels:base.levels,waterLevels:water});
 assert.deepEqual(sculptRockToeSegments(scene,4,4,9),
   [{from:4,to:5},{from:6,to:7},{from:8,to:9}]);
});
test('V33 square ground sculpt, then square water move cannot change physical dry land collision',()=>{
 const base=make();
 const land=applySculptStroke(base,{points:[{x:3.5,y:3.5}],radius:2,
   mode:'plateau',target:3,shape:'square'});
 const wet=applySculptWaterStroke(land,{points:[{x:8.5,y:5.5}],radius:2,
   mode:'water-fill',target:6,shape:'square'});
 const lower=applySculptWaterStroke(wet,{points:[{x:8.5,y:5.5}],radius:2,
   mode:'water-lower',strength:1,shape:'square'});
 assert.deepEqual(lower.levels,land.levels);
 const entity={x:1.5*28,y:8.5*21,radius:5,locomotion:{modes:['ground']}};
 assert.equal(isSculptNavigationBlocked({terrain:lower,cellWidth:28,cellHeight:21,
    maxStepUp:1,maxStepDown:1},entity,2.5*28,8.5*21),false);
});
