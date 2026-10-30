import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  createWorldBuilderDraft,
  updateTerrainFamilyElementChance,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import { describeWorldBuilderValidation } from '../src/builder/world-builder-validation-guidance.js';

test('active forest with no selected elements explains action in French', () => {
  let draft = createWorldBuilderDraft(demoWorldDocument);
  for (const entry of [...draft.encounterConfig.families.find(p=>p.terrainFamilyId==='forest').elementChances])
    draft = updateTerrainFamilyElementChance(draft,'forest',entry.elementId,0);
  const result = validateWorldBuilderDraft(draft);
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('encounter-elements-empty:forest'));
  const guidance=describeWorldBuilderValidation(result.errors,result.document);
  assert.equal(guidance.encounterFamilyId,'forest');
  assert.match(guidance.message,/Forêt/);
  assert.match(guidance.message,/coche au moins un élément/);
});

test('other error codes remain visible and family navigation selects first invalid family', () => {
  const guidance=describeWorldBuilderValidation(
    ['encounter-elements-empty:forest','other-invalid-code','encounter-elements-empty:volcano'],
    demoWorldDocument
  );
  assert.equal(guidance.encounterFamilyId,'forest');
  assert.match(guidance.message,/Volcan/);
  assert.match(guidance.message,/other-invalid-code/);
});

test('Builder test navigation must expose invalid encounter family without mutating data', async () => {
  const main = await readFile(new URL('../src/builder/world-builder-main.js', import.meta.url), 'utf8');
  assert.match(main, /describeWorldBuilderValidation\(result\.errors, result\.document\)/);
  assert.match(main, /selectedEncounterFamilyId = guidance\.encounterFamilyId/);
  assert.match(main, /activateTab\('terrain'\)/);
  assert.match(main, /refreshFamilyEncounterControls\(\)/);
  assert.match(main, /\.terrain-encounter-panel/);
  assert.match(main, /saveWorldBuilderTestHandoff/);
});
