import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEncounterPaintPreset,
  encounterEditorAvailability,
  updateEncounterPaintPreset
} from '../src/builder/encounter-layer-editor-state.js';

test('Encounter creation selectors stay available before any layer exists', () => {
  const availability = encounterEditorAvailability(false);

  assert.equal(availability.selectorEnabled, true);
  assert.equal(availability.chanceEnabled, true);
  assert.equal(availability.brushEnabled, true);
  assert.equal(availability.deleteLayerEnabled, false);
  assert.equal(availability.addTableEntryEnabled, false);
});

test('Encounter paint preset is editor-only creation state with typed Capture selector', () => {
  const preset = createEncounterPaintPreset({
    defaultElementId: 'fire'
  });

  assert.deepEqual(preset, {
    encounterChancePercent: 20,
    width: 260,
    checkDistance: 160,
    priority: 0,
    selectorKind: 'element',
    selectorId: 'fire',
    weight: 100
  });

  const next = updateEncounterPaintPreset(preset, {
    selectorKind: 'creature',
    selectorId: 'crea_braiseau',
    encounterChancePercent: 35
  });

  assert.equal(next.selectorKind, 'creature');
  assert.equal(next.selectorId, 'crea_braiseau');
  assert.equal(next.encounterChancePercent, 35);
  assert.equal('materialId' in next, false);
});
