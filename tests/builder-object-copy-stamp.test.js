import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  copyWorldObjectAsStamp,
  worldObjectStampInput
} from '../src/builder/world-object-stamp-preset.js';
import {
  createBlankWorldBuilderDraft, addWorldObject, updateWorldObjectTransform,
  serializeWorldBuilderDraft, importWorldBuilderDocument, validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
const read = (p) => readFile(new URL('../' + p, import.meta.url), 'utf8');

test('Copier keeps rotation and unequal X/Y scale, but never source ID, position or surface refs', () => {
  const source = {
    id: 'rock-1', objectDefinitionId: 'objectdef.rock.forest.boulder.01',
    transform: { x: 80, y: 125, rotationDeg: 37, scaleX: 1.5, scaleY: 0.85 },
    overrides: { visualVariantId: 'alternate-view', traversalSurfaceFeatureIds: ['old-water'] }
  };
  const preset = copyWorldObjectAsStamp(source);
  assert.deepEqual(preset, {
    objectDefinitionId: source.objectDefinitionId,
    rotationDeg: 37, scaleX: 1.5, scaleY: 0.85, visualVariantId: 'alternate-view'
  });
  assert.equal(Object.isFrozen(preset), true);
  source.transform.scaleX = 3; // copied snapshot must not change
  const input = worldObjectStampInput({ definitionId: preset.objectDefinitionId, preset,
    point: {x: 200,y: 250}, area:{width: 500,height:450} });
  assert.deepEqual(input.transform, {x:200,y:250,rotationDeg:37,scaleX:1.5,scaleY:0.85});
  assert.deepEqual(input.overrides, {visualVariantId:'alternate-view',traversalSurfaceFeatureIds:[]});
  assert.equal(input.id, undefined);
});

test('Copier then stamp twice uses canonical WorldDocument, independent IDs and export/import', () => {
  let world = createBlankWorldBuilderDraft();
  const areaId = world.initialAreaId;
  const definitionId = 'objectdef.rock.forest.boulder.01';
  world = addWorldObject(world, areaId, { objectDefinitionId:definitionId,
    transform:{x:300,y:450,rotationDeg:24,scaleX:1.75,scaleY:1.2} });
  const source = world.areas[0].objects[0];
  const stamp = copyWorldObjectAsStamp(source);
  world = updateWorldObjectTransform(world,areaId,source.id,{scaleX:2.5});
  for (const x of [800, 1100]) {
    world = addWorldObject(world,areaId,worldObjectStampInput({
      definitionId,preset:stamp,point:{x,y:600},area:world.areas[0]
    }));
  }
  assert.equal(world.areas[0].objects.length, 3);
  assert.equal(new Set(world.areas[0].objects.map(o=>o.id)).size,3);
  for(const placed of world.areas[0].objects.slice(1)){
    assert.equal(placed.transform.scaleX,1.75);
    assert.equal(placed.transform.scaleY,1.2);
    assert.equal(placed.transform.rotationDeg,24);
    assert.equal(placed.transform.y,600);
  }
  assert.equal(validateWorldBuilderDraft(world).valid,true);
  const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(world));
  assert.deepEqual(restored.areas[0].objects, world.areas[0].objects);
});

test('selection of a different model uses default transform and stale presets cannot leak', () => {
  const preset=copyWorldObjectAsStamp({
    objectDefinitionId:'objectdef.rock.forest.boulder.01',
    transform:{scaleX:2,scaleY:3,rotationDeg:15}
  });
  const plain=worldObjectStampInput({definitionId:'objectdef.tree.forest.oak.01',
    preset,point:{x:-30,y:900},area:{width:600,height:500}});
  assert.deepEqual(plain.transform,{x:0,y:500,rotationDeg:0,scaleX:1,scaleY:1});
  assert.deepEqual(plain.overrides,{traversalSurfaceFeatureIds:[]});
  assert.equal(copyWorldObjectAsStamp(null),null);
});

test('Builder replaces duplicate with Copier preset action and reuses existing stamp path',async()=>{
 const html=await read('builder.html'),main=await read('src/builder/world-builder-main.js');
 assert.match(html, /id="object-duplicate"[^>]*>Copier</);
 assert.match(html, /id="map-object-copy-status"/);
 assert.match(main,/copyWorldObjectAsStamp\(currentObjectRaw\(\)\)/);
 assert.match(main,/worldObjectStampInput\(/);
 assert.match(main,/selectedStampPreset = null/);
 assert.doesNotMatch(main,/draft = duplicateWorldObject\(/);
});
