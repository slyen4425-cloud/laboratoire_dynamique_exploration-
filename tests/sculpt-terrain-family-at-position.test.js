import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainFamilyAtWorldPosition} from '../src/world/sculpt-terrain-family-at-position.js';
import {normalizeWorldSurface} from '../src/world/surface-model.js';
const surface=normalizeWorldSurface({baseTerrainFamilyId:'plain',zones:[{id:'z',terrainFamilyId:'forest',materialId:'ground.snow',width:20,points:[{x:0,y:50},{x:100,y:50}]}],routes:[{id:'r',terrainFamilyId:'road',materialId:'road.dirt',width:8,points:[{x:50,y:0},{x:50,y:100}]}]});
test('encounter family comes from stroke geometry not material',()=>{
 assert.equal(terrainFamilyAtWorldPosition(surface,{x:10,y:50}),'forest');
 assert.equal(terrainFamilyAtWorldPosition(surface,{x:50,y:50}),'road');
 assert.equal(terrainFamilyAtWorldPosition(surface,{x:90,y:90}),'plain');
});
test('world coordinate must be finite',()=>assert.throws(()=>terrainFamilyAtWorldPosition(surface,{x:NaN,y:0}),TypeError));
