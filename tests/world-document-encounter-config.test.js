import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeWorldDocument
} from '../src/world/world-document-model.js';

test('WorldDocument owns terrain family definitions and one encounter config', () => {
  const world =
    normalizeWorldDocument({
      id: 'world',
      terrainFamilies: [
        {
          id: 'swamp',
          label: 'Marais'
        }
      ],
      areas: [
        {
          id: 'a',
          kind: 'exterior',
          width: 500,
          height: 500,
          surface: {
            baseTerrainFamilyId:
              'swamp',
            baseMaterialId:
              'ground.dirt'
          },
          spawns: [
            {
              id: 'start',
              x: 10,
              y: 10
            }
          ]
        }
      ],
      initialAreaId: 'a',
      initialSpawnId: 'start',
      encounterConfig: {
        families: [
          {
            terrainFamilyId:
              'swamp',
            encounterChancePercent:
              20,
            elementChances: [
              {
                elementId: 'earth',
                chancePercent: 80
              },
              {
                elementId: 'water',
                chancePercent: 20
              }
            ]
          }
        ]
      }
    });

  assert.deepEqual(
    world.terrainFamilies,
    [
      {
        id: 'swamp',
        label: 'Marais'
      }
    ]
  );
  assert.equal(
    world.encounterConfig.families[0]
      .terrainFamilyId,
    'swamp'
  );
  assert.equal(
    world.encounterConfig.families[0]
      .encounterChancePercent,
    20
  );
  assert.equal(
    world.areas[0].surface
      .baseTerrainFamilyId,
    'swamp'
  );
});

test('old WorldDocuments without explicit definitions receive the eight presets', () => {
  const world =
    normalizeWorldDocument({
      areas: [
        {
          id: 'a',
          spawns: [
            {
              id: 'start',
              x: 0,
              y: 0
            }
          ]
        }
      ],
      initialAreaId: 'a',
      initialSpawnId: 'start'
    });

  assert.equal(
    world.terrainFamilies.length,
    8
  );
  assert.equal(
    world.encounterConfig.families.length,
    8
  );
  assert.ok(
    world.encounterConfig.families
      .every(
        (entry) =>
          entry.encounterChancePercent ===
          0
      )
  );
});
