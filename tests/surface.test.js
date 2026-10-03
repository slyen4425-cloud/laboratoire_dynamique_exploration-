import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeWorldSurface } from '../src/world/surface-model.js';

test('surface model preserves structured terrain zones, routes and rivers', () => {
  const source = {
    baseMaterialId: 'grass.forest',
    zones: [
      {
        id: 'painted-ground',
        width: 180,
        materialId: 'ground.dirt',
        points: [
          { x: 50, y: 80 },
          { x: 180, y: 150 }
        ]
      }
    ],
    routes: [
      {
        id: 'main-road',
        width: 84,
        materialId: 'road.dirt',
        points: [
          { x: 0, y: 620 },
          { x: 500, y: 590 },
          { x: 900, y: 650 }
        ]
      }
    ],
    rivers: [
      {
        id: 'river-1',
        width: 72,
        materialId: 'water.forest_stream',
        points: [
          { x: 1000, y: 800 },
          { x: 1200, y: 785 },
          { x: 1400, y: 810 }
        ]
      }
    ]
  };

  const surface = normalizeWorldSurface(source);

  assert.equal(surface.version, 2);
  assert.equal(surface.baseMaterialId, 'grass.forest');
  assert.equal(surface.baseTraversalRuleId, 'terrain.ground');
  assert.equal(surface.zones.length, 1);
  assert.equal(surface.zones[0].width, 180);
  assert.equal(surface.zones[0].materialId, 'ground.dirt');
  assert.equal(surface.routes.length, 1);
  assert.equal(surface.routes[0].width, 84);
  assert.equal(surface.routes[0].traversalRuleId, 'terrain.road');
  assert.deepEqual(
    surface.routes[0].points.map(({ x, y }) => [x, y]),
    [[0, 620], [500, 590], [900, 650]]
  );
  assert.equal(surface.rivers.length, 1);
  assert.equal(surface.rivers[0].width, 72);
  assert.equal(surface.rivers[0].traversalRuleId, 'terrain.water');
});

test('surface model filters invalid paths without mutating the source', () => {
  const source = {
    routes: [
      {
        points: [{ x: 10, y: 10 }]
      },
      {
        id: 'valid',
        width: 50,
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }]
      }
    ],
    rivers: [
      {
        id: 'broken',
        points: [{ x: 0, y: 0 }, { x: Number.NaN, y: 100 }]
      }
    ]
  };

  const before = JSON.stringify(source, (_key, value) =>
    Number.isNaN(value) ? 'NaN' : value
  );

  const surface = normalizeWorldSurface(source);

  assert.equal(surface.zones.length, 0);
  assert.equal(surface.routes.length, 1);
  assert.equal(surface.routes[0].id, 'valid');
  assert.equal(surface.rivers.length, 0);

  const after = JSON.stringify(source, (_key, value) =>
    Number.isNaN(value) ? 'NaN' : value
  );
  assert.equal(after, before);
});

test('surface model applies explicit defaults', () => {
  const surface = normalizeWorldSurface({
    routes: [
      {
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      }
    ]
  });

  assert.equal(surface.baseMaterialId, 'grass.forest');
  assert.deepEqual(surface.zones, []);
  assert.equal(surface.routes[0].width, 64);
  assert.equal(surface.routes[0].materialId, 'road.dirt');
  assert.equal(surface.routes[0].traversalRuleId, 'terrain.road');
});
