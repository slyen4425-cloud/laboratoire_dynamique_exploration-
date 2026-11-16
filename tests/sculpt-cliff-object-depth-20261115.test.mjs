import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,sculptFaces} from '../src/world/sculpt-height-model.js';
import {sculptObjectInFrontOfCliffV1} from '../src/render/sculpt-cliff-object-depth-v1.js';

function fixture(){
 const levels=Array(64).fill(2);
 levels[2*8+3]=6;
 return createSculptTerrain({width:8,height:8,levels});
}
const tree=(x,y,h=130)=>({x,y:y-36,width:72,height:h});
test('sapin planted IN FRONT of a hill stays over the rock wall even if crown overlaps',()=>{
 const terrain=fixture(),faces=sculptFaces(terrain);
 const foot={x:98,y:94.5};
 const rect=tree(98,foot.y);
 assert.equal(sculptObjectInFrontOfCliffV1(terrain,rect,foot,{faces}),true);
 assert.deepEqual(faces,sculptFaces(terrain));
});
test('sapin planted BEHIND a hill remains hidden by the cliff face',()=>{
 const terrain=fixture(),faces=sculptFaces(terrain);
 const foot={x:98,y:36.75};
 const rect=tree(98,foot.y);
 assert.equal(sculptObjectInFrontOfCliffV1(terrain,rect,foot,{faces}),false);
});
test('object far from the wall is not redrawn; size alone cannot force foreground',()=>{
 const terrain=fixture(),faces=sculptFaces(terrain);
 assert.equal(sculptObjectInFrontOfCliffV1(terrain,
  {x:210,y:55,width:40,height:170},{x:210,y:95},{faces}),false);
 assert.equal(sculptObjectInFrontOfCliffV1(null,tree(98,90),{x:98,y:90}),false);
});
test('both live paths share the canonical wall raster and use foot priority',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(main,/sculptObjectInFrontOfCliffV1\(terrain,/);
 assert.match(main,/depthFaces:sculptFaces\(terrain\)/);
 assert.match(main,/includeOuterSouthRim:false/);
 assert.match(main,/sculptObjectInFrontOfCliffV1\(terrain,/);
 assert.match(main,/if\(!navigationTesting\)\{/);
 assert.match(main,/object\.transform\.y<=heroY/);
 assert.doesNotMatch(main,/drawOuterSouthRim:true/);
});
