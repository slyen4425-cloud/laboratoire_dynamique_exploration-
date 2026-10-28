import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,createBlankSculptPreviewScene,
  importSculptPreviewScene,serializeSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';

test('V24: true blank scene uses canonical heightfield dimensions, dry cells, empty placements',()=>{
  const source=createBlankSculptPreviewScene({width:18,height:12});
  assert.equal(source.terrain.width,18);
  assert.equal(source.terrain.height,12);
  assert.equal(source.terrain.levels.length,216);
  assert.ok(source.terrain.levels.every(level=>level===2));
  assert.ok(source.terrain.waterLevels.every(level=>level===-1));
  assert.deepEqual(source.objects,[]);
  assert.ok(Object.isFrozen(source)&&Object.isFrozen(source.terrain)&&Object.isFrozen(source.objects));
  const imported=importSculptPreviewScene(serializeSculptPreviewScene(source.terrain,source.objects));
  assert.deepEqual(imported.terrain,source.terrain);
  assert.deepEqual(imported.objects,source.objects);
  assert.equal(importSculptPreviewScene(serializeSculptTerrain(source.terrain)).isScene,false,
    'old heights-only export/import still valid');
});
test('V24: optional editor canvas dimensions within existing canonical limits',()=>{
  assert.deepEqual([createBlankSculptPreviewScene({width:8,height:8}).terrain.width,
    createBlankSculptPreviewScene({width:80,height:64}).terrain.height],[8,64]);
  // Existing model clamps bad values: no new validator or competing geometry.
  assert.equal(createBlankSculptPreviewScene({width:999,height:-7}).terrain.width,80);
  assert.equal(createBlankSculptPreviewScene({width:999,height:-7}).terrain.height,8);
});
test('V24: non-empty V23 scene does not change by constructing a separate blank scene',()=>{
  const original=createSculptTerrain({width:36,height:24,
    waterLevels:Array(36*24).fill(3)});
  const objects=appendSculptPreviewObject([],{definitionId:'objectdef.building.house.blue_cottage.01',
    x:220,y:150,variantId:'side',scale:.4});
  const before=serializeSculptPreviewScene(original,objects);
  const blank=createBlankSculptPreviewScene({width:20,height:14});
  assert.equal(blank.objects.length,0);
  assert.equal(blank.terrain.width,20);
  assert.equal(serializeSculptPreviewScene(original,objects),before,'old scene untouched');
});
test('V24: visible control, explicit confirmation, no direct code path erases 2D Builder',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  for(const id of ['new-map-toggle','new-map-panel','new-map-form','new-map-width',
    'new-map-height','new-map-confirm','new-map-cancel','new-map-create']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1);
  }
  assert.match(main,/createBlankSculptPreviewScene/);
  assert.match(main,/mountSculptArea\(blank\)/);
  // All editing undo stacks are reset by the single scene mount command.
  assert.match(main,/history=\[\];redoHistory=\[\];objectHistory=\[\];objectRedo=\[\]/);
  assert.match(main,/\$\('new-map-confirm'\)\.checked/);
  assert.match(html,/id="new-map-width" min="8" max="80"/);
  assert.match(html,/id="new-map-height" min="8" max="64"/);
  const builder=readFileSync(new URL('../builder.html',import.meta.url),'utf8');
  assert.doesNotMatch(builder,/new-map-form/);
});
