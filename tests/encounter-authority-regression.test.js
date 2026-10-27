import test from 'node:test';
import assert from 'node:assert/strict';
import { createEncounterController } from '../src/encounters/encounter-controller.js';
import { resolveTerrainFamilyAtPoint } from '../src/encounters/terrain-family-resolver.js';
import { normalizeTerrainFamilyEncounterConfig } from '../src/encounters/terrain-family-encounter-config.js';
import { normalizeWorldSurface } from '../src/world/surface-model.js';
import { createCaptureCreatureCatalogProvider } from '../src/capture/capture-creature-catalog-provider.js';

const catalog = createCaptureCreatureCatalogProvider({
  schema: 'capture-database-v1', version: 1,
  creatures: [{ draft: {
    id: 'wild-forest', displayName: 'Wild Forest', elements: ['nature'],
    capture: { spawnChance: 70 }
  } }]
});
const config = normalizeTerrainFamilyEncounterConfig({
  families: [
    { terrainFamilyId: 'forest', encounterChancePercent: 100,
      elementChances: [{ elementId: 'nature', chancePercent: 100 }] },
    { terrainFamilyId: 'road', encounterChancePercent: 0,
      elementChances: [{ elementId: 'nature', chancePercent: 100 }] }
  ]
});

function rollInArea(area, areaId = area.id) {
  const controller = createEncounterController({ checkDistance: 50 });
  const args = {
    area, encounterConfig: config, captureCatalog: catalog,
    playerPartyRef: 'capture-party', rulesetId: 'capture.standard.1v1',
    random: () => 0
  };
  controller.step({ ...args, player: { currentAreaId: areaId, x: 20, y: 100 } });
  return controller.step({ ...args, player: { currentAreaId: areaId, x: 120, y: 100 } });
}

test('changing only visual texture never alters actual terrain encounter decision', () => {
  for (const baseMaterialId of ['grass.forest', 'road.stone', 'user.my-snow-texture']) {
    const area = { id: 'forest-zone', surface: normalizeWorldSurface({
      baseTerrainFamilyId: 'forest', baseMaterialId
    }) };
    const intent = rollInArea(area);
    assert.equal(intent?.terrainFamilyId, 'forest');
    assert.equal(intent?.opponentCreatureId, 'wild-forest');
  }
});

test('safe route remains safe even with forest-looking texture', () => {
  const area = { id: 'forest-zone', surface: normalizeWorldSurface({
    baseTerrainFamilyId: 'forest', baseMaterialId: 'grass.forest',
    routes: [{ id: 'road-01', terrainFamilyId: 'road',
      materialId: 'grass.forest', width: 80,
      points: [{ x: 0, y: 100 }, { x: 500, y: 100 }] }]
  }) };
  assert.equal(rollInArea(area), null);
});

test('invalid or missing semantic surface never invents a forest family', () => {
  assert.equal(resolveTerrainFamilyAtPoint(null, 100, 100).terrainFamilyId, null);
  assert.equal(resolveTerrainFamilyAtPoint({}, 100, 100).terrainFamilyId, null);
  assert.equal(resolveTerrainFamilyAtPoint({ baseMaterialId: 'grass.forest' }, 100, 100).terrainFamilyId, null);
  assert.equal(rollInArea({ id: 'broken-area', surface: { baseMaterialId: 'grass.forest' } }), null);
});

test('player-area mismatch cannot roll encounters from stale loaded Area', () => {
  const area = { id: 'area-a', surface: normalizeWorldSurface({
    baseTerrainFamilyId: 'forest', baseMaterialId: 'grass.forest'
  }) };
  assert.equal(rollInArea(area, 'area-b'), null);
});
