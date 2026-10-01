import test from 'node:test';
import assert from 'node:assert/strict';

import {
  listTerrainAssets,
  resolveTerrainAsset
} from '../src/assets/asset-adapter.js';
import {
  terrainPatchDescriptor,
  terrainVariantIndex
} from '../src/render/terrain-renderer.js';

test('forest asset adapter exposes exactly six local variants', () => {
  const assets = listTerrainAssets({ biome: 'forest' });

  assert.equal(assets.length, 6);

  for (let index = 0; index < assets.length; index += 1) {
    const expectedVariant = String(index + 1).padStart(2, '0');
    assert.equal(assets[index].id, `terrain.forest.${expectedVariant}`);
    assert.equal(
      assets[index].path,
      `./assets/exploration/biomes/forest/floor_${expectedVariant}.png`
    );
  }
});

test('asset adapter does not silently fall back to another variant or biome', () => {
  assert.equal(resolveTerrainAsset({ biome: 'forest', variant: 1 })?.id, 'terrain.forest.01');
  assert.equal(resolveTerrainAsset({ biome: 'forest', variant: 7 }), null);
  assert.equal(resolveTerrainAsset({ biome: 'water', variant: 1 }), null);
  assert.deepEqual(listTerrainAssets({ biome: 'water' }), []);
});

test('terrain variant selection is deterministic and stays in range', () => {
  const first = terrainVariantIndex(4, 7, 6);
  const second = terrainVariantIndex(4, 7, 6);

  assert.equal(first, second);
  assert.ok(first >= 0 && first < 6);
  assert.equal(terrainVariantIndex(0, 0, 0), -1);
});

test('terrain patch placement is deterministic and bounded', () => {
  const first = terrainPatchDescriptor(8, 12, 6, 118);
  const second = terrainPatchDescriptor(8, 12, 6, 118);

  assert.deepEqual(first, second);
  assert.ok(first.variantIndex >= 0 && first.variantIndex < 6);
  assert.ok(Math.abs(first.jitterX) <= 118 * 0.29 + Number.EPSILON);
  assert.ok(Math.abs(first.jitterY) <= 118 * 0.29 + Number.EPSILON);
  assert.ok(first.scale >= 0.86 && first.scale <= 1.18);
  assert.ok(
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].includes(first.rotation)
  );
  assert.equal(terrainPatchDescriptor(0, 0, 0, 118), null);
});
