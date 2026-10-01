import test from 'node:test';
import assert from 'node:assert/strict';

import {
  listTerrainAssets,
  resolveTerrainAsset
} from '../src/assets/asset-adapter.js';
import { terrainVariantIndex } from '../src/render/terrain-renderer.js';

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
