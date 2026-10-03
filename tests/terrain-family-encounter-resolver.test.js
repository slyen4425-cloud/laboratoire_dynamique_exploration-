import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCaptureCreatureCatalogProvider
} from '../src/capture/capture-creature-catalog-provider.js';
import {
  normalizeTerrainFamilyEncounterConfig
} from '../src/encounters/terrain-family-encounter-config.js';
import {
  resolveTerrainFamilyEncounter
} from '../src/encounters/terrain-family-encounter-resolver.js';

function provider() {
  return createCaptureCreatureCatalogProvider({
    schema: 'capture-database-v1',
    version: 1,
    creatures: [
      {
        draft: {
          id: 'common-fire',
          displayName: 'Commun Feu',
          elements: ['fire'],
          capture: { spawnChance: 25 },
          presentation: null
        }
      },
      {
        draft: {
          id: 'legend-fire',
          displayName: 'Légendaire Feu',
          elements: ['fire'],
          capture: { spawnChance: 0.5 },
          presentation: null
        }
      },
      {
        draft: {
          id: 'water',
          displayName: 'Eau',
          elements: ['water'],
          capture: { spawnChance: 10 },
          presentation: null
        }
      }
    ]
  });
}

function config(chance = 100) {
  return normalizeTerrainFamilyEncounterConfig({
    families: [
      {
        terrainFamilyId: 'forest',
        encounterChancePercent: chance,
        elementChances: [
          { elementId: 'fire', chancePercent: 80 },
          { elementId: 'water', chancePercent: 20 }
        ]
      }
    ]
  });
}

function sequence(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

test('family encounter chance can reject before element/creature selection', () => {
  const result = resolveTerrainFamilyEncounter({
    terrainFamilyId: 'forest',
    config: config(20),
    captureCatalog: provider(),
    random: sequence([0.5])
  });

  assert.equal(result.triggered, false);
  assert.equal(result.reason, 'chance');
});

test('family element weights select a Capture element before choosing a creature', () => {
  const result = resolveTerrainFamilyEncounter({
    terrainFamilyId: 'forest',
    config: config(),
    captureCatalog: provider(),
    random: sequence([0, 0.95, 0])
  });

  assert.equal(result.triggered, true);
  assert.equal(result.elementId, 'water');
  assert.equal(result.creatureId, 'water');
});

test('intrinsic Capture spawnChance remains the creature rarity authority', () => {
  const result = resolveTerrainFamilyEncounter({
    terrainFamilyId: 'forest',
    config: normalizeTerrainFamilyEncounterConfig({
      families: [
        {
          terrainFamilyId: 'forest',
          encounterChancePercent: 100,
          elementChances: [
            { elementId: 'fire', chancePercent: 100 }
          ]
        }
      ]
    }),
    captureCatalog: provider(),
    random: sequence([0, 0, 0.99])
  });

  assert.equal(result.triggered, true);
  assert.equal(result.elementId, 'fire');
  assert.equal(result.creatureId, 'legend-fire');
  assert.equal(result.spawnChance, 0.5);
});

test('configured element with no eligible Capture creature is ignored', () => {
  const result = resolveTerrainFamilyEncounter({
    terrainFamilyId: 'forest',
    config: normalizeTerrainFamilyEncounterConfig({
      families: [
        {
          terrainFamilyId: 'forest',
          encounterChancePercent: 100,
          elementChances: [
            { elementId: 'shadow', chancePercent: 999 },
            { elementId: 'water', chancePercent: 1 }
          ]
        }
      ]
    }),
    captureCatalog: provider(),
    random: sequence([0, 0, 0])
  });

  assert.equal(result.triggered, true);
  assert.equal(result.elementId, 'water');
  assert.equal(result.creatureId, 'water');
});

test('zero-spawn creatures are never selected', () => {
  const catalog = createCaptureCreatureCatalogProvider({
    schema: 'capture-database-v1',
    version: 1,
    creatures: [
      {
        draft: {
          id: 'disabled',
          displayName: 'Disabled',
          elements: ['fire'],
          capture: { spawnChance: 0 },
          presentation: null
        }
      }
    ]
  });

  const result = resolveTerrainFamilyEncounter({
    terrainFamilyId: 'forest',
    config: normalizeTerrainFamilyEncounterConfig({
      families: [
        {
          terrainFamilyId: 'forest',
          encounterChancePercent: 100,
          elementChances: [
            { elementId: 'fire', chancePercent: 100 }
          ]
        }
      ]
    }),
    captureCatalog: catalog,
    random: sequence([0, 0, 0])
  });

  assert.equal(result.triggered, false);
  assert.equal(result.reason, 'no-element');
});
