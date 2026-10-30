import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {listSculptPlaceableDefinitions,appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {findSculptVisualObjectAtPoint,sculptObjectVisualRect} from '../src/render/sculpt-object-picking.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';

const def=listSculptPlaceableDefinitions().find(o=>o.kind==='building');
function placed({x=160,y=138,rotationDeg=0,scale=.6}={}){
  return appendSculptPreviewObject([],{
    definitionId:def.id,x,y,scale,rotationDeg
  });
}
function resolved(list){
  return resolveWorldObjectPlacements(list,objectDefinitionCatalogV1);
}
test('V44 selection hits true raised 2.5D artwork rather than underlying sculpt tile',()=>{
  assert.ok(def);
  const levels=Array(16*12).fill(2);
  const x=160,y=138,cellX=Math.floor(x/28),cellY=Math.floor(y/21);
  levels[cellY*16+cellX]=5;
  const terrain=createSculptTerrain({width:16,height:12,levels});
  const list=placed({x,y});
  const shape=sculptObjectVisualRect(resolved(list)[0],terrain);
  assert.equal(shape.y,y-5*18);
  assert.equal(shape.x,x);
  const top={x,y:shape.y-shape.height*.35};
  assert.equal(findSculptVisualObjectAtPoint(list,terrain,top,{zoom:1})?.id,list[0].id);
  assert.equal(findSculptVisualObjectAtPoint(list,terrain,{x:4,y:5}),null);
});
test('V44 rotated and overlapping sprites use visual shape and depth, never collision',()=>{
  const terrain=createSculptTerrain({width:16,height:12});
  const list=placed({x:140,y:115,rotationDeg:45,scale:.5});
  const rect=sculptObjectVisualRect(resolved(list)[0],terrain);
  const p={x:rect.x+rect.width*.36*Math.cos(rect.angle)-rect.height*.2*Math.sin(rect.angle),
    y:rect.y+rect.width*.36*Math.sin(rect.angle)+rect.height*.2*Math.cos(rect.angle)};
  assert.equal(findSculptVisualObjectAtPoint(list,terrain,p,{zoom:1,paddingPx:0})?.id,list[0].id);
  const added=appendSculptPreviewObject(list,{definitionId:def.id,x:140,y:117,scale:.5});
  assert.equal(findSculptVisualObjectAtPoint(added,terrain,{x:140,y:84})?.id,added[1].id,
    'frontmost drawn object should receive touch');
});
