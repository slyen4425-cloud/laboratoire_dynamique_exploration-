import test from 'node:test';
import assert from 'node:assert/strict';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createWorldAreaFromSculptMapPreset}
  from '../src/builder/sculpt-map-preset-library.js';
import {resolvePortalTriggerPoint} from '../src/world/portal-model.js';

test('creator maps replace, rather than supplement, the retired eight showcase presets',()=>{
  const presets=builtinSculptMapPresets();
  assert.deepEqual(presets.map(p=>p.name),['Forêt 1 · projet','Plaine 1 · projet']);
  const [forest,plain]=presets.map(p=>importSculptPreviewScene(p.scene));
  const houses=scene=>scene.objects.filter(o=>
    o.objectDefinitionId.startsWith('objectdef.building.'));
  assert.equal(houses(forest).length,2);
  assert.equal(houses(plain).length,9);
  assert.equal(forest.surface.routes.length,5);
  assert.equal(plain.surface.routes.length,14);
  assert.equal(plain.terrain.ramps.length,7);
  assert.equal(forest.terrain.levels.length,80*60);
  assert.equal(plain.terrain.levels.length,80*60);
});

test('real WorldDocument owns each author map house interior and portal',()=>{
 for(const preset of builtinSculptMapPresets()){
   const base=createBlankWorldBuilderDraft({
     id:'creator-'+preset.id,width:36*28,height:24*21
   });
   const doc=createWorldAreaFromSculptMapPreset(base,preset,{
     name:preset.name,kind:'exterior'
   });
   const outside=doc.areas.find(a=>a.label===preset.name);
   assert.ok(outside);
   const houses=outside.objects.filter(o=>
     o.objectDefinitionId.startsWith('objectdef.building.'));
   const doors=doc.portals.filter(p=>p.sourceAreaId===outside.id&&
     p.trigger?.kind==='object-anchor');
   assert.equal(doors.length,houses.length,
     'native building links, never a parallel scene graph');
   for(const door of doors){
     assert.ok(resolvePortalTriggerPoint(doc.areas,door));
     assert.ok(doc.areas.some(a=>a.id===door.targetAreaId&&a.kind==='interior'));
   }
 }
});
