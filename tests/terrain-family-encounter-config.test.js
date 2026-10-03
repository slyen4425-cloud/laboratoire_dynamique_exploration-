import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeTerrainFamilyEncounterConfig
} from '../src/encounters/terrain-family-encounter-config.js';

test('encounter config always exposes one profile for each canonical terrain family', () => {
  const config = normalizeTerrainFamilyEncounterConfig();

  assert.deepEqual(
    config.families.map((profile) => profile.terrainFamilyId),
    ['plain','forest','sea','mountain','volcano','snow','road','sand']
  );
});

test('family profile stores encounter chance and element distribution only', () => {
  const config = normalizeTerrainFamilyEncounterConfig({
    families: [
      {
        terrainFamilyId: 'forest',
        encounterChancePercent: 30,
        elementWeights: [
          { elementId: 'nature', weight: 60 },
          { elementId: 'earth', weight: 25 },
          { elementId: 'fire', weight: 15 }
        ],
        materialId: 'must-not-own-encounters'
      }
    ]
  });

  const forest = config.families.find(
    (profile) => profile.terrainFamilyId === 'forest'
  );

  assert.equal(forest.encounterChancePercent, 30);
  assert.deepEqual(
    forest.elementWeights.map(({ elementId, weight }) => [elementId, weight]),
    [['nature',60],['earth',25],['fire',15]]
  );
  assert.equal('materialId' in forest, false);
});

test('road can be configured as a safe family with zero encounters', () => {
  const config = normalizeTerrainFamilyEncounterConfig({
    families: [
      {
        terrainFamilyId: 'road',
        encounterChancePercent: 0,
        elementWeights: []
      }
    ]
  });

  const road = config.families.find(
    (profile) => profile.terrainFamilyId === 'road'
  );

  assert.equal(road.encounterChancePercent, 0);
  assert.deepEqual(road.elementWeights, []);
});

test('chance is clamped and invalid element weights are discarded', () => {
  const config = normalizeTerrainFamilyEncounterConfig({
    families: [
      {
        terrainFamilyId: 'volcano',
        encounterChancePercent: 180,
        elementWeights: [
          { elementId: 'fire', weight: 80 },
          { elementId: '', weight: 10 },
          { elementId: 'earth', weight: 0 }
        ]
      }
    ]
  });

  const volcano = config.families.find(
    (profile) => profile.terrainFamilyId === 'volcano'
  );

  assert.equal(volcano.encounterChancePercent, 100);
  assert.deepEqual(
    volcano.elementWeights,
    [{ elementId: 'fire', weight: 80 }]
  );
});
