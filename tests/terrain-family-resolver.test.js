import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeWorldSurface } from '../src/world/surface-model.js';
import {
  resolveTerrainFamilyAtPoint
} from '../src/encounters/terrain-family-resolver.js';

function surface() {
  return normalizeWorldSurface({
    baseTerrainFamilyId: 'forest',
    baseMaterialId: 'grass.forest',
    zones: [
      {
        id: 'snow-zone',
        terrainFamilyId: 'snow',
        materialId: 'ground.dirt',
        width: 180,
        points: [{ x: 100, y: 100 }, { x: 500, y: 100 }]
      }
    ],
    routes: [
      {
        id: 'road',
        terrainFamilyId: 'road',
        materialId: 'visual.anything',
        width: 80,
        points: [{ x: 0, y: 200 }, { x: 800, y: 200 }]
      }
    ],
    rivers: [
      {
        id: 'sea-strip',
        terrainFamilyId: 'sea',
        materialId: 'visual.other',
        width: 100,
        points: [{ x: 400, y: 0 }, { x: 400, y: 600 }]
      }
    ]
  });
}

test('terrain family resolver reads semantic family, never material id', () => {
  const worldSurface = surface();

  assert.equal(
    resolveTerrainFamilyAtPoint(worldSurface, 150, 100).terrainFamilyId,
    'snow'
  );
  assert.equal(
    resolveTerrainFamilyAtPoint(worldSurface, 20, 400).terrainFamilyId,
    'forest'
  );
});

test('route takes encounter-family precedence where the player is on the route', () => {
  const result = resolveTerrainFamilyAtPoint(surface(), 400, 200);

  assert.equal(result.terrainFamilyId, 'road');
  assert.equal(result.featureKind, 'route');
});

test('river/sea wins over painted ground when no route is present', () => {
  const result = resolveTerrainFamilyAtPoint(surface(), 400, 100);

  assert.equal(result.terrainFamilyId, 'sea');
  assert.equal(result.featureKind, 'river');
});

test('latest painted terrain zone wins among overlapping terrain zones', () => {
  const worldSurface = normalizeWorldSurface({
    baseTerrainFamilyId: 'plain',
    zones: [
      {
        id: 'first',
        terrainFamilyId: 'forest',
        width: 200,
        points: [{ x: 0, y: 0 }, { x: 500, y: 0 }]
      },
      {
        id: 'second',
        terrainFamilyId: 'volcano',
        width: 200,
        points: [{ x: 0, y: 0 }, { x: 500, y: 0 }]
      }
    ]
  });

  assert.equal(
    resolveTerrainFamilyAtPoint(worldSurface, 250, 0).terrainFamilyId,
    'volcano'
  );
});
