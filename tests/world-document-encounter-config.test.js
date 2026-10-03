import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeWorldDocument
} from '../src/world/world-document-model.js';

test('WorldDocument owns one terrain-family encounter config', () => {
  const world = normalizeWorldDocument({
    id: 'world',
    areas: [
      {
        id: 'a',
        kind: 'exterior',
        width: 500,
        height: 500,
        surface: {
          baseTerrainFamilyId: 'plain',
          baseMaterialId: 'ground.dirt'
        },
        spawns: [{ id: 'start', x: 10, y: 10 }]
      }
    ],
    initialAreaId: 'a',
    initialSpawnId: 'start',
    encounterConfig: {
      families: [
        {
          terrainFamilyId: 'plain',
          encounterChancePercent: 20,
          elementWeights: [
            { elementId: 'earth', weight: 80 },
            { elementId: 'fire', weight: 20 }
          ]
        }
      ]
    }
  });

  assert.equal(
    world.encounterConfig.families.find(
      (entry) => entry.terrainFamilyId === 'plain'
    ).encounterChancePercent,
    20
  );
});

test('missing encounter config gets one safe profile per family', () => {
  const world = normalizeWorldDocument({
    areas: [
      {
        id: 'a',
        spawns: [{ id: 'start', x: 0, y: 0 }]
      }
    ],
    initialAreaId: 'a',
    initialSpawnId: 'start'
  });

  assert.equal(world.encounterConfig.families.length, 8);
  assert.ok(
    world.encounterConfig.families.every(
      (entry) => entry.encounterChancePercent === 0
    )
  );
});
