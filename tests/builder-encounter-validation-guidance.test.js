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

test('invalid forest encounter distribution explains the actual total and locates canonical family', () => {
  const draft = updateTerrainFamilyElementChance(
    createWorldBuilderDraft(demoWorldDocument), 'forest', 'nature', 40
  );
  const result = validateWorldBuilderDraft(draft);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('encounter-element-total:forest'));
  const guidance = describeWorldBuilderValidation(result.errors, result.document);
  assert.equal(guidance.encounterFamilyId, 'forest');
  assert.match(guidance.message, /Forêt/);
  assert.match(guidance.message, /90\s*%/);
  assert.match(guidance.message, /100\s*%/);
  assert.match(guidance.message, /Terrain/);
  assert.match(guidance.message, /Rencontres par famille/);
});

test('unknown validation codes stay visible; multiple erroneous families preserve error information', () => {
  const guidance = describeWorldBuilderValidation(
    ['encounter-element-total:forest', 'other-invalid-code', 'encounter-element-total:volcano'],
    demoWorldDocument
  );
  assert.equal(guidance.encounterFamilyId, 'forest');
  assert.match(guidance.message, /Forêt/);
  assert.match(guidance.message, /Volcan/);
  assert.match(guidance.message, /other-invalid-code/);
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
