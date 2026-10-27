import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlankSculptPreviewScene,appendSculptPreviewObject,
  updateSculptPreviewObject,serializeSculptPreviewScene,importSculptPreviewScene
} from '../src/world/sculpt-scene-preview.js';
import {listSculptPlaceableDefinitions} from '../src/world/sculpt-scene-preview.js';

test('V43 drag only changes the selected canonical object position; scale/view/rotation survive save',()=>{
  const blank=createBlankSculptPreviewScene({width:18,height:12});
  const def=listSculptPlaceableDefinitions().find(o=>o.kind==='building');
  assert.ok(def,'native building catalog required');
  const first=appendSculptPreviewObject([],{
    definitionId:def.id,x:126,y:94,scale:.65,rotationDeg:137,
    variantId:def.visual?.defaultVariantId??null
  });
  assert.equal(first.length,1);
  const before=first[0];
  const moved=updateSculptPreviewObject(first,before.id,{x:146.5,y:102.25});
  const next=moved[0];
  assert.equal(next.id,before.id);
  assert.equal(next.objectDefinitionId,before.objectDefinitionId);
  assert.equal(next.transform.x,146.5);
  assert.equal(next.transform.y,102.25);
  assert.equal(next.transform.scaleX,before.transform.scaleX);
  assert.equal(next.transform.scaleY,before.transform.scaleY);
  assert.equal(next.transform.rotationDeg,before.transform.rotationDeg);
  assert.deepEqual(next.overrides,before.overrides);
  assert.equal(first[0].transform.x,126,'prior immutable placement is preserved for undo');
  const parsed=importSculptPreviewScene(serializeSculptPreviewScene(blank.terrain,moved,blank.surface));
  assert.deepEqual(parsed.objects,moved,'drag coordinates and visual properties must survive JSON');
  const invalid=updateSculptPreviewObject(moved,before.id,{x:NaN,y:Infinity});
  assert.equal(invalid[0].transform.x,146.5);
  assert.equal(invalid[0].transform.y,102.25);
});
