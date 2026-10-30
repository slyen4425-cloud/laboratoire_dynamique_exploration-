import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeTerrainFamilyEncounterConfig
} from '../src/encounters/terrain-family-encounter-config.js';

test('encounter config exposes the eight preset terrain families by default', () => {
  const config =
    normalizeTerrainFamilyEncounterConfig();

  assert.deepEqual(
    config.families.map(
      (profile) =>
        profile.terrainFamilyId
    ),
    [
      'plain',
      'forest',
      'sea',
      'mountain',
      'volcano',
      'snow',
      'road',
      'sand'
    ]
  );
});

test('encounter config follows the family ids supplied by the WorldDocument', () => {
  const config =
    normalizeTerrainFamilyEncounterConfig(
      {
        families: [
          {
            terrainFamilyId: 'swamp',
            encounterChancePercent: 35,
            elementChances: [
              {
                elementId: 'water',
                chancePercent: 60
              },
              {
                elementId: 'poison',
                chancePercent: 40
              }
            ]
          }
        ]
      },
      ['forest', 'swamp']
    );

  assert.deepEqual(
    config.families.map(
      (profile) =>
        profile.terrainFamilyId
    ),
    ['forest', 'swamp']
  );

  const swamp =
    config.families.find(
      (profile) =>
        profile.terrainFamilyId ===
        'swamp'
    );

  assert.equal(
    swamp.encounterChancePercent,
    35
  );
  assert.deepEqual(
    swamp.elementChances,
    [
      {
        elementId: 'water',
        chancePercent: 60
      },
      {
        elementId: 'poison',
        chancePercent: 40
      }
    ]
  );
});

test('family profile stores encounter chance and element distribution only', () => {
  const config =
    normalizeTerrainFamilyEncounterConfig({
      families: [
        {
          terrainFamilyId: 'forest',
          encounterChancePercent: 30,
          elementChances: [
            {
              elementId: 'nature',
              chancePercent: 60
            },
            {
              elementId: 'earth',
              chancePercent: 25
            },
            {
              elementId: 'fire',
              chancePercent: 15
            }
          ],
          materialId:
            'must-not-own-encounters'
        }
      ]
    });

  const forest =
    config.families.find(
      (profile) =>
        profile.terrainFamilyId ===
        'forest'
    );

  assert.equal(
    forest.encounterChancePercent,
    30
  );
  assert.equal(
    'materialId' in forest,
    false
  );
});

test('road can still be configured as a safe preset with zero encounters', () => {
  const config =
    normalizeTerrainFamilyEncounterConfig({
      families: [
        {
          terrainFamilyId: 'road',
          encounterChancePercent: 0,
          elementChances: []
        }
      ]
    });

  const road =
    config.families.find(
      (profile) =>
        profile.terrainFamilyId ===
        'road'
    );

  assert.equal(
    road.encounterChancePercent,
    0
  );
  assert.deepEqual(
    road.elementChances,
    []
  );
});

test('chance is clamped and invalid element percentages are discarded', () => {
  const config =
    normalizeTerrainFamilyEncounterConfig({
      families: [
        {
          terrainFamilyId: 'volcano',
          encounterChancePercent: 180,
          elementChances: [
            {
              elementId: 'fire',
              chancePercent: 80
            },
            {
              elementId: '',
              chancePercent: 10
            },
            {
              elementId: 'earth',
              chancePercent: 0
            }
          ]
        }
      ]
    });

  const volcano =
    config.families.find(
      (profile) =>
        profile.terrainFamilyId ===
        'volcano'
    );

  assert.equal(
    volcano.encounterChancePercent,
    100
  );
  assert.deepEqual(
    volcano.elementChances,
    [
      {
        elementId: 'fire',
        chancePercent: 80
      }
    ]
  );
});
