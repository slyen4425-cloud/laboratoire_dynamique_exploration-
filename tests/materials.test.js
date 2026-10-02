import test from 'node:test';
import assert from 'node:assert/strict';

import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { normalizeWorldSurface } from '../src/world/surface-model.js';

test('Material Pack v1 exposes pilot materials plus paintable terrain surfaces', () => {
  const registry = createMaterialRegistry(materialPackV1);

  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.packId, 'forest-core-v1');
  assert.equal(registry.resolve('grass.forest')?.kind, 'surface');
  assert.equal(registry.resolve('road.dirt')?.kind, 'path');
  assert.equal(registry.resolve('water.forest_stream')?.kind, 'water');
  assert.equal(registry.resolve('floor.wood.house')?.kind, 'surface');
  assert.equal(registry.resolve('ground.dirt')?.kind, 'surface');
  assert.equal(registry.resolve('ground.sand')?.kind, 'surface');
  assert.equal(registry.resolve('ground.snow')?.kind, 'surface');
  assert.equal(registry.list().length, 7);
});

test('unknown material ids never silently fall back', () => {
  const registry = createMaterialRegistry(materialPackV1);

  assert.equal(registry.resolve('road.stone'), null);
  assert.throws(
    () => registry.require('road.stone'),
    /Unknown material id/
  );
});

test('material kind is explicit and enforced', () => {
  const registry = createMaterialRegistry(materialPackV1);

  assert.equal(registry.require('road.dirt', 'path').id, 'road.dirt');
  assert.throws(
    () => registry.require('road.dirt', 'water'),
    /expected water/
  );
});

test('resolved material definitions are immutable', () => {
  const registry = createMaterialRegistry(materialPackV1);
  const material = registry.require('road.dirt');

  assert.equal(Object.isFrozen(material), true);
  assert.equal(Object.isFrozen(material.render), true);
  assert.equal(Object.isFrozen(material.assets), true);
});

test('changing materialId does not change route geometry', () => {
  const base = {
    baseMaterialId: 'grass.forest',
    routes: [
      {
        id: 'road-a',
        width: 82,
        materialId: 'road.dirt',
        points: [
          { x: 10, y: 20 },
          { x: 400, y: 320 },
          { x: 800, y: 300 }
        ]
      }
    ]
  };

  const dirt = normalizeWorldSurface(base);
  const stone = normalizeWorldSurface({
    ...base,
    routes: [
      {
        ...base.routes[0],
        materialId: 'road.stone'
      }
    ]
  });

  assert.equal(dirt.routes[0].width, stone.routes[0].width);
  assert.deepEqual(dirt.routes[0].points, stone.routes[0].points);
  assert.notEqual(dirt.routes[0].materialId, stone.routes[0].materialId);
});


test('forest material owns configurable decal rendering values', () => {
  const registry = createMaterialRegistry(materialPackV1);
  const grass = registry.require('grass.forest', 'surface');

  assert.equal(grass.render.decalSpacing, 230);
  assert.equal(grass.render.decalDensity, 0.42);
  assert.equal(grass.render.decalMinSize, 48);
  assert.equal(grass.render.decalMaxSize, 82);
  assert.equal(grass.render.decalOpacity, 0.36);
});
