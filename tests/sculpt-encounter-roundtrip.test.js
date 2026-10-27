import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankSculptPreviewScene,serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';

test('V81 RED: scene encounter configuration survives JSON export and import',()=>{
  const scene=createBlankSculptPreviewScene();
  const canonicalEncounterConfig={families:[{terrainFamilyId:'forest',encounterChancePercent:25,elementIds:['earth','nature']}]};
  const exported=JSON.parse(serializeSculptPreviewScene(scene.terrain,scene.objects,scene.surface,scene.actors,canonicalEncounterConfig));
  assert.deepEqual(exported.encounterConfig,canonicalEncounterConfig,'export must retain encounter data without a parallel registry');
  const imported=importSculptPreviewScene(exported);
  assert.deepEqual(imported.encounterConfig,canonicalEncounterConfig,'import must retain the same encounter data');
});
