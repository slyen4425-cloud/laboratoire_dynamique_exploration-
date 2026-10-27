import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeWorldSurface } from '../src/world/surface-model.js';

test('surface schema stores terrain family separately from visual material', () => {
  const surface = normalizeWorldSurface({
    baseTerrainFamilyId: 'forest',
    baseMaterialId: 'grass.forest',
    zones: [
      {
        id: 'z1',
        terrainFamilyId: 'snow',
        materialId: 'ground.snow',
        width: 180,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      }
    ],
    routes: [
      {
        id: 'r1',
        terrainFamilyId: 'road',
        materialId: 'road.dirt',
        width: 80,
        points: [{ x: 0, y: 50 }, { x: 100, y: 50 }]
      }
    ],
    rivers: [
      {
        id: 'w1',
        terrainFamilyId: 'sea',
        materialId: 'water.forest_stream',
        width: 80,
        points: [{ x: 0, y: 100 }, { x: 100, y: 100 }]
      }
    ]
  });

  assert.equal(surface.version, 3);
  assert.equal(surface.baseTerrainFamilyId, 'forest');
  assert.equal(surface.baseMaterialId, 'grass.forest');
  assert.equal(surface.zones[0].terrainFamilyId, 'snow');
  assert.equal(surface.routes[0].terrainFamilyId, 'road');
  assert.equal(surface.rivers[0].terrainFamilyId, 'sea');
});

test('changing texture never changes semantic terrain family', () => {
  const surface = normalizeWorldSurface({
    baseTerrainFamilyId: 'mountain',
    baseMaterialId: 'ground.dirt',
    zones: [
      {
        id: 'mountain-zone',
        terrainFamilyId: 'mountain',
        materialId: 'ground.dirt',
        width: 180,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      }
    ]
  });

  assert.equal(surface.baseTerrainFamilyId, 'mountain');
  assert.equal(surface.zones[0].terrainFamilyId, 'mountain');
  assert.equal(surface.zones[0].materialId, 'ground.dirt');
});

test('legacy surface data gets explicit safe family defaults', () => {
  const surface = normalizeWorldSurface({
    baseMaterialId: 'grass.forest',
    routes: [
      {
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      }
    ],
    rivers: [
      {
        points: [{ x: 0, y: 50 }, { x: 100, y: 50 }]
      }
    ],
    zones: [
      {
        points: [{ x: 0, y: 100 }, { x: 100, y: 100 }]
      }
    ]
  });

  assert.equal(surface.baseTerrainFamilyId, 'forest');
  assert.equal(surface.routes[0].terrainFamilyId, 'road');
  assert.equal(surface.rivers[0].terrainFamilyId, 'sea');
  assert.equal(surface.zones[0].terrainFamilyId, 'forest');
});
