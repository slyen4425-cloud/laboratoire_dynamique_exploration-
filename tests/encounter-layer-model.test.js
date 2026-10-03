import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeEncounterLayer,
  normalizeEncounterLayers
} from '../src/encounters/encounter-layer-model.js';

test('EncounterLayer v1 keeps gameplay geometry independent from surface/material data', () => {
  const layer = normalizeEncounterLayer({
    id: 'forest-main',
    label: 'Forêt',
    width: 420,
    points: [
      { x: 100, y: 100 },
      { x: 500, y: 300 }
    ],
    encounterChancePercent: 25,
    checkDistance: 160,
    priority: 10,
    table: [
      {
        id: 'earth-grass',
        tags: ['element.earth', 'element.grass'],
        weight: 80
      },
      {
        id: 'neutral',
        tags: ['element.neutral'],
        weight: 20
      }
    ],
    materialId: 'must-not-own-encounters'
  });

  assert.equal(layer.id, 'forest-main');
  assert.equal(layer.encounterChancePercent, 25);
  assert.equal(layer.checkDistance, 160);
  assert.equal(layer.priority, 10);
  assert.equal(layer.width, 420);
  assert.equal(layer.table[0].weight, 80);
  assert.deepEqual(layer.table[0].tags, [
    'element.earth',
    'element.grass'
  ]);
  assert.equal('materialId' in layer, false);
});

test('EncounterLayer chance and check distance are normalized safely', () => {
  const layer = normalizeEncounterLayer({
    id: 'danger',
    width: 1,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 }
    ],
    encounterChancePercent: 150,
    checkDistance: -4,
    table: [
      { id: 'x', actorDefinitionId: 'capture.creature.x', weight: 100 }
    ]
  });

  assert.equal(layer.encounterChancePercent, 100);
  assert.equal(layer.checkDistance, 1);
  assert.equal(layer.width, 8);
});

test('EncounterLayer table accepts opaque actorDefinitionId or tag pools only', () => {
  const [layer] = normalizeEncounterLayers([
    {
      id: 'mixed',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 }
      ],
      table: [
        {
          id: 'specific',
          actorDefinitionId: 'capture.creature.braiseau',
          weight: 30,
          stats: { hp: 999 },
          mapVisual: { assetId: 'forbidden' }
        },
        {
          id: 'pool',
          tags: ['element.fire', 'biome.forest'],
          weight: 70
        }
      ]
    }
  ]);

  assert.equal(layer.table[0].actorDefinitionId, 'capture.creature.braiseau');
  assert.equal('stats' in layer.table[0], false);
  assert.equal('mapVisual' in layer.table[0], false);
  assert.deepEqual(layer.table[1].tags, [
    'element.fire',
    'biome.forest'
  ]);
});

test('EncounterLayer list rejects duplicate ids and invalid geometry', () => {
  const layers = normalizeEncounterLayers([
    {
      id: 'same',
      points: [{ x: 0, y: 0 }, { x: 20, y: 20 }],
      table: [{ id: 'a', tags: ['x'], weight: 100 }]
    },
    {
      id: 'same',
      points: [{ x: 0, y: 0 }, { x: 30, y: 30 }],
      table: [{ id: 'b', tags: ['y'], weight: 100 }]
    },
    {
      id: 'invalid',
      points: [{ x: 0, y: 0 }],
      table: [{ id: 'c', tags: ['z'], weight: 100 }]
    }
  ]);

  assert.deepEqual(layers.map((layer) => layer.id), ['same']);
});

test('EncounterLayer 0 percent may be a safe layer without encounter table', () => {
  const layer = normalizeEncounterLayer({
    id: 'safe-route',
    priority: 100,
    encounterChancePercent: 0,
    width: 90,
    points: [
      { x: 0, y: 0 },
      { x: 600, y: 0 }
    ],
    table: []
  });

  assert.equal(layer.encounterChancePercent, 0);
  assert.deepEqual(layer.table, []);
  assert.equal(layer.priority, 100);
});
