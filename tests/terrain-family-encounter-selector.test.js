import test from 'node:test';
import assert from 'node:assert/strict';
import { selectTerrainFamilyEncounter } from '../src/encounters/terrain-family-encounter-selector.js';
import { createCaptureCreatureCatalogProvider } from '../src/capture/capture-creature-catalog-provider.js';

const catalog = createCaptureCreatureCatalogProvider({
  schema: 'capture-database-v1',
  creatures: [
    { draft: { id: 'forest-a', displayName: 'Forest A', elements: ['nature'], capture: { spawnChance: 10 } } },
    { draft: { id: 'forest-b', displayName: 'Forest B', elements: ['nature'], capture: { spawnChance: 90 } } }
  ]
});
const config = { families: [
  { terrainFamilyId: 'forest', encounterChancePercent: 100, elementChances: [{ elementId: 'nature', chancePercent: 100 }] },
  { terrainFamilyId: 'road', encounterChancePercent: 0, elementChances: [{ elementId: 'nature', chancePercent: 100 }] }
] };

test('forest encounter chooses Capture creature by intrinsic rarity', () => {
  assert.equal(selectTerrainFamilyEncounter({ terrainFamilyId: 'forest', config, catalog, random: () => 0.99 }).creatureId, 'forest-b');
  assert.equal(selectTerrainFamilyEncounter({ terrainFamilyId: 'forest', config, catalog, random: () => 0 }).creatureId, 'forest-a');
});
test('safe road never produces a creature', () => {
  assert.equal(selectTerrainFamilyEncounter({ terrainFamilyId: 'road', config, catalog, random: () => 0 }), null);
});
test('no creature available never fabricates a fallback', () => {
  const missing = { families: [{ terrainFamilyId: 'forest', encounterChancePercent: 100, elementChances: [{ elementId: 'fire', chancePercent: 100 }] }] };
  assert.equal(selectTerrainFamilyEncounter({ terrainFamilyId: 'forest', config: missing, catalog, random: () => 0 }), null);
});
test('invalid random values fail explicitly', () => {
  assert.throws(() => selectTerrainFamilyEncounter({ terrainFamilyId: 'forest', config, catalog, random: () => 1 }), RangeError);
});
