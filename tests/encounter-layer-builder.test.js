import test from 'node:test';
import assert from 'node:assert/strict';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  addEncounterLayer,
  addEncounterTableEntry,
  createWorldBuilderDraft,
  deleteEncounterLayer,
  serializeWorldBuilderDraft,
  importWorldBuilderDocument,
  updateEncounterLayer,
  updateEncounterTableEntry,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';

function draft() {
  return createWorldBuilderDraft(demoWorldDocument);
}

test('Builder adds an Encounter Layer to WorldArea data, not surface.zones', () => {
  const before = draft();
  const beforeSurfaceZones =
    before.areas[0].surface.zones.length;

  const next = addEncounterLayer(
    before,
    'forest-exterior',
    {
      points: [
        { x: 100, y: 100 },
        { x: 600, y: 300 }
      ],
      width: 360,
      encounterChancePercent: 25
    }
  );

  const area = next.areas.find(
    (item) => item.id === 'forest-exterior'
  );

  assert.equal(area.encounterLayers.length, 1);
  assert.equal(area.encounterLayers[0].encounterChancePercent, 25);
  assert.equal(
    area.surface.zones.length,
    beforeSurfaceZones
  );
  assert.equal(
    'materialId' in area.encounterLayers[0],
    false
  );
});

test('Builder edits layer chance, priority and table percentages', () => {
  let next = addEncounterLayer(
    draft(),
    'forest-exterior',
    {
      points: [
        { x: 100, y: 100 },
        { x: 600, y: 300 }
      ]
    }
  );
  const layerId =
    next.areas[0].encounterLayers[0].id;

  next = updateEncounterLayer(
    next,
    'forest-exterior',
    layerId,
    {
      label: 'Forêt',
      encounterChancePercent: 35,
      checkDistance: 140,
      priority: 5
    }
  );

  next = addEncounterTableEntry(
    next,
    'forest-exterior',
    layerId,
    {
      selectorKind: 'element',
      selectorId: 'earth',
      weight: 80
    }
  );

  const entryId =
    next.areas[0].encounterLayers[0].table[0].id;

  next = updateEncounterTableEntry(
    next,
    'forest-exterior',
    layerId,
    entryId,
    {
      selectorKind: 'element',
      selectorId: 'fire',
      weight: 20
    }
  );

  const layer = next.areas[0].encounterLayers[0];
  assert.equal(layer.label, 'Forêt');
  assert.equal(layer.encounterChancePercent, 35);
  assert.equal(layer.checkDistance, 140);
  assert.equal(layer.priority, 5);
  assert.equal(layer.table[0].selectorKind, 'element');
  assert.equal(layer.table[0].selectorId, 'fire');
  assert.equal(layer.table[0].weight, 20);
});

test('Safe layer with 0 percent validates without table, positive chance requires one', () => {
  const safe = addEncounterLayer(
    draft(),
    'forest-exterior',
    {
      points: [
        { x: 0, y: 650 },
        { x: 800, y: 650 }
      ],
      width: 90,
      encounterChancePercent: 0,
      priority: 100,
      table: []
    }
  );

  assert.equal(validateWorldBuilderDraft(safe).valid, true);

  const unsafe = updateEncounterLayer(
    safe,
    'forest-exterior',
    safe.areas[0].encounterLayers[0].id,
    { encounterChancePercent: 20 }
  );

  const result = validateWorldBuilderDraft(unsafe);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) =>
      error.startsWith('encounter-layer-table-empty:')
    )
  );
});

test('Encounter Layers survive WorldDocument export/import', () => {
  let next = addEncounterLayer(
    draft(),
    'forest-exterior',
    {
      points: [
        { x: 100, y: 100 },
        { x: 700, y: 400 }
      ],
      encounterChancePercent: 30
    }
  );
  const layerId = next.areas[0].encounterLayers[0].id;

  next = addEncounterTableEntry(
    next,
    'forest-exterior',
    layerId,
    {
      selectorKind: 'creature',
      selectorId: 'crea_braiseau',
      weight: 100
    }
  );

  const json = serializeWorldBuilderDraft(next);
  const imported = importWorldBuilderDocument(json);

  assert.deepEqual(
    imported.areas[0].encounterLayers,
    next.areas[0].encounterLayers
  );

  const removed = deleteEncounterLayer(
    imported,
    'forest-exterior',
    layerId
  );
  assert.equal(removed.areas[0].encounterLayers.length, 0);
});
