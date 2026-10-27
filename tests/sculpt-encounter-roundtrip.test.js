import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';
import {createBlankSculptPreviewScene,serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';

test('V81 RED: scene encounter configuration survives JSON export and import',()=>{
  const scene=createBlankSculptPreviewScene();
  const canonicalEncounterConfig=normalizeTerrainFamilyEncounterConfig({families:[{terrainFamilyId:'forest',encounterChancePercent:25,elementChances:[{elementId:'earth',chancePercent:50},{elementId:'nature',chancePercent:50}]}]});
  const exported=JSON.parse(serializeSculptPreviewScene(scene.terrain,scene.objects,scene.surface,scene.actors,canonicalEncounterConfig));
  assert.deepEqual(exported.encounterConfig,canonicalEncounterConfig,'export must retain encounter data without a parallel registry');
  const imported=importSculptPreviewScene(exported);
  assert.deepEqual(imported.encounterConfig,canonicalEncounterConfig,'import must retain the same encounter data');
});
