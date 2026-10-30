import test from 'node:test';
import assert from 'node:assert/strict';
import {SCULPT_TILE,sculptEastSeamBounds} from '../src/render/sculpt-height-renderer.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {isSculptNavigationBlocked} from '../src/core/sculpt-navigation-collision.js';

test('V32 east-facing cliff seam remains inside source column at all elevations',()=>{
 for(const level of [1,2,3,7]){
   const p=sculptEastSeamBounds(SCULPT_TILE,6,5,level,level-1);
   assert.ok(p.width>0&&p.width<=3);
   assert.ok(p.x>=6*SCULPT_TILE.width);
   assert.ok(p.x+p.width<=(6+1)*SCULPT_TILE.width+1e-8);
   assert.equal(p.height,SCULPT_TILE.rise);
   assert.equal(p.y,5*SCULPT_TILE.height-level*SCULPT_TILE.rise+SCULPT_TILE.height);
 }
});
test('V32 aesthetic joins never weaken true Collision World steps',()=>{
 const levels=Array(12*12).fill(2);
 levels[6*12+7]=3;levels[6*12+8]=5;
 const terrain=createSculptTerrain({width:12,height:12,levels});
 const entity={x:6.5*28,y:6.5*21,radius:5,locomotion:{modes:['ground']}};
 const context={terrain,cellWidth:28,cellHeight:21,maxStepUp:1,maxStepDown:1};
 assert.equal(isSculptNavigationBlocked(context,entity,7.5*28,6.5*21),false);
 assert.equal(isSculptNavigationBlocked(context,entity,8.5*28,6.5*21),true);
 // The clip only changes the artist's raster, not canonical world heights.
 assert.equal(terrain.levels[6*12+8],5);
});
