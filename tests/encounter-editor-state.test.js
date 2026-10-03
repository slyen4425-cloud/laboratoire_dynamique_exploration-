import test from 'node:test';
import assert from 'node:assert/strict';

import {
  encounterEditorAvailability
} from '../src/builder/encounter-editor-state.js';

test('Encounter selectors and paint defaults stay available before any layer exists', () => {
  assert.deepEqual(
    encounterEditorAvailability({ hasLayer: false, hasEntry: false }),
    {
      layerDelete: false,
      layerSettings: true,
      entryAdd: false,
      entryDelete: false,
      selectorKind: true,
      selectorValue: true,
      entryWeight: true
    }
  );
});

test('Encounter entry actions activate after a layer exists', () => {
  assert.deepEqual(
    encounterEditorAvailability({ hasLayer: true, hasEntry: true }),
    {
      layerDelete: true,
      layerSettings: true,
      entryAdd: true,
      entryDelete: true,
      selectorKind: true,
      selectorValue: true,
      entryWeight: true
    }
  );
});
