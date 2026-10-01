import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import {
  listMaterialAssets,
  resolveMaterialAsset
} from '../src/assets/material-asset-adapter.js';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';

const EXPECTED = Object.freeze({
  'texture.grass.forest.base.01': Object.freeze({
    path: './assets/exploration/materials/forest/surfaces/grass_forest_base_01.webp',
    sha256: '1246b557d96a092f6f5584eeaa1c65101b111f7db439edc97cc9706c8079b697'
  }),
  'texture.grass.forest.base.02': Object.freeze({
    path: './assets/exploration/materials/forest/surfaces/grass_forest_base_02.webp',
    sha256: '3794f72068827498b5563e7c591035552311daf18591dde0d81d54c1d905dd52'
  }),
  'texture.road.dirt.base.01': Object.freeze({
    path: './assets/exploration/materials/forest/paths/road_dirt_base_01.webp',
    sha256: '0041edccba3992559c27e638df642eaa68a606048298efcfb05fb530e2f4fbbd'
  }),
  'texture.water.forest_stream.base.01': Object.freeze({
    path: './assets/exploration/materials/forest/water/water_forest_stream_base_01.webp',
    sha256: 'd8377f6e7b3fa7409fbf88ba27a592b4f75aa2d7927fd0988769a1bb9aa1ab0d'
  }),
  'transition.road.dirt.grass_forest.edge.01': Object.freeze({
    path: './assets/exploration/materials/forest/transitions/road_dirt_to_grass_forest_edge_01.webp',
    sha256: '787042b76ac7933e918c362f3353e921e1f68a70d107bf3ccd69e92becdf9969'
  }),
  'transition.water.forest_stream.grass_forest.bank.01': Object.freeze({
    path: './assets/exploration/materials/forest/transitions/water_forest_stream_to_grass_forest_bank_01.webp',
    sha256: 'e3a672561cc7dba77192d5bab48e954fab38fa0575937a9bfde638c3eb314c36'
  }),
  'decal.forest.leaves.01': Object.freeze({
    path: './assets/exploration/materials/forest/decals/leaves_forest_floor_decal_01.webp',
    sha256: 'a95ad60db9fd0af571907dce88e6661fb0414cba9a459685f67f323edc1fc74b'
  }),
  'decal.forest.roots.01': Object.freeze({
    path: './assets/exploration/materials/forest/decals/roots_forest_floor_decal_01.webp',
    sha256: '8d9194ffae2c0c4d1a820cb3a014567771b53ac7796aa229d215dc35a23752d7'
  })
});

test('forest material asset adapter exposes exactly the eight controlled assets', () => {
  const assets = listMaterialAssets();

  assert.equal(assets.length, 8);
  assert.deepEqual(
    assets.map((asset) => asset.id).sort(),
    Object.keys(EXPECTED).sort()
  );

  for (const asset of assets) {
    assert.equal(asset.path, EXPECTED[asset.id].path);
  }
});

test('forest material asset adapter has no silent fallback', () => {
  assert.equal(resolveMaterialAsset('texture.grass.forest.base.01')?.id, 'texture.grass.forest.base.01');
  assert.equal(resolveMaterialAsset('texture.unknown'), null);
  assert.equal(resolveMaterialAsset(''), null);
});

test('the eight committed WebP files match their controlled SHA-256', async () => {
  for (const [assetId, expected] of Object.entries(EXPECTED)) {
    const url = new URL('../' + expected.path.replace(/^\.\//, ''), import.meta.url);
    const bytes = await readFile(url);
    const digest = createHash('sha256').update(bytes).digest('hex');

    assert.equal(digest, expected.sha256, assetId);
  }
});

test('Material Pack v1 references the controlled forest assets', () => {
  const byMaterial = new Map(
    materialPackV1.materials.map((material) => [material.id, material])
  );

  assert.equal(
    byMaterial.get('grass.forest').assets.base,
    'texture.grass.forest.base.01'
  );
  assert.deepEqual(
    [...byMaterial.get('grass.forest').assets.variants],
    ['texture.grass.forest.base.02']
  );
  assert.deepEqual(
    [...byMaterial.get('grass.forest').assets.decals],
    ['decal.forest.leaves.01', 'decal.forest.roots.01']
  );

  assert.equal(
    byMaterial.get('road.dirt').assets.center,
    'texture.road.dirt.base.01'
  );
  assert.equal(
    byMaterial.get('road.dirt').assets.edge,
    'transition.road.dirt.grass_forest.edge.01'
  );

  assert.equal(
    byMaterial.get('water.forest_stream').assets.center,
    'texture.water.forest_stream.base.01'
  );
  assert.equal(
    byMaterial.get('water.forest_stream').assets.bank,
    'transition.water.forest_stream.grass_forest.bank.01'
  );
});
