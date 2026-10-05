import test from 'node:test';
import assert from 'node:assert/strict';

import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { normalizeWorldSurface } from '../src/world/surface-model.js';

test('Material Pack v1 exposes pilot materials plus paintable terrain surfaces', () => {
  const registry = createMaterialRegistry(materialPackV1);

  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.packId, 'forest-core-v1');
  assert.deepEqual(registry.surfaceTransition, {
    mode: 'feather',
    widthRatio: 0.18,
    minWidth: 6,
    maxWidth: 64,
    steps: 7,
    edgeOpacity: 0.08
  });
  assert.equal(registry.resolve('grass.forest')?.kind, 'surface');
  assert.equal(registry.resolve('road.dirt')?.kind, 'path');
  assert.equal(registry.resolve('water.forest_stream')?.kind, 'water');
  assert.equal(registry.resolve('floor.wood.house')?.kind, 'surface');
  assert.equal(registry.resolve('ground.dirt')?.kind, 'surface');
  assert.equal(registry.resolve('ground.sand')?.kind, 'surface');
  assert.equal(registry.resolve('ground.snow')?.kind, 'surface');
  assert.equal(registry.resolve('ground.forest_floor')?.kind, 'surface');
  assert.equal(registry.resolve('ground.mountain_rock')?.kind, 'surface');
  assert.equal(registry.resolve('ground.volcanic_ash_lava')?.kind, 'surface');
  assert.equal(registry.resolve('water.clear_blue')?.kind, 'water');
  assert.equal(registry.resolve('water.turquoise')?.kind, 'water');
  assert.equal(registry.resolve('water.swamp')?.kind, 'water');
  assert.equal(registry.resolve('water.lava')?.kind, 'water');
  assert.equal(
    registry.resolve('grass.forest')?.assets.base,
    'texture.grass.forest.base.01'
  );
  assert.equal(
    registry.resolve('ground.sand')?.assets.base,
    'texture.ground.sand.stylized.01'
  );
  assert.equal(
    registry.resolve('ground.snow')?.assets.base,
    'texture.ground.snow.stylized.01'
  );
  assert.equal(
    registry.resolve('ground.forest_floor')?.assets.base,
    'texture.ground.forest_floor.stylized.01'
  );
  assert.equal(
    registry.resolve('ground.mountain_rock')?.assets.base,
    'texture.ground.mountain_rock.stylized.01'
  );
  assert.equal(
    registry.resolve('ground.volcanic_ash_lava')?.assets.base,
    'texture.ground.volcanic_ash_lava.stylized.01'
  );
  assert.equal(
    registry.resolve('water.clear_blue')?.assets.center,
    'texture.water.clear_blue.stylized.01'
  );
  assert.equal(
    registry.resolve('water.turquoise')?.assets.center,
    'texture.water.turquoise.stylized.01'
  );
  assert.equal(
    registry.resolve('water.swamp')?.assets.center,
    'texture.water.swamp.stylized.01'
  );
  assert.equal(
    registry.resolve('water.lava')?.assets.center,
    'texture.water.lava.stylized.01'
  );
  assert.equal(
    registry.list().filter((item) => item.kind === 'water').length,
    5
  );
  assert.equal(registry.list().length, 14);
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
