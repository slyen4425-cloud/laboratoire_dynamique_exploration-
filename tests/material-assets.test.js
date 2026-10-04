import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

import {
  listMaterialAssets,
  resolveMaterialAsset
} from '../src/assets/material-asset-adapter.js';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import {
  collectMaterialAssetIds,
  createMaterialTextureLoader
} from '../src/render/material-texture-loader.js';

const EXPECTED = Object.freeze({
  'texture.grass.forest.base.01':
    './assets/exploration/materials/forest/surfaces/grass_forest_base_01.webp',
  'texture.grass.forest.base.02':
    './assets/exploration/materials/forest/surfaces/grass_forest_base_02.webp',
  'texture.ground.forest_floor.stylized.01':
    './assets/exploration/materials/forest/surfaces/forest_floor_stylized_01.webp',
  'texture.ground.snow.stylized.01':
    './assets/exploration/materials/forest/surfaces/snow_ground_stylized_01.webp',
  'texture.ground.sand.stylized.01':
    './assets/exploration/materials/forest/surfaces/sand_ground_stylized_01.webp',
  'texture.ground.mountain_rock.stylized.01':
    './assets/exploration/materials/forest/surfaces/mountain_rock_stylized_01.webp',
  'texture.road.dirt.center.01':
    './assets/exploration/materials/forest/paths/road_dirt_base_01.webp',
  'texture.water.forest_stream.center.01':
    './assets/exploration/materials/forest/water/water_forest_stream_base_01.webp',
  'texture.water.clear_blue.stylized.01':
    './assets/exploration/materials/forest/water/water_clear_blue_stylized_01.webp',
  'texture.water.turquoise.stylized.01':
    './assets/exploration/materials/forest/water/water_turquoise_stylized_01.webp',
  'texture.water.swamp.stylized.01':
    './assets/exploration/materials/forest/water/water_swamp_stylized_01.webp',
  'texture.water.lava.stylized.01':
    './assets/exploration/materials/forest/water/lava_flow_stylized_01.webp',
  'texture.ground.volcanic_ash_lava.stylized.01':
    './assets/exploration/materials/forest/surfaces/volcanic_ash_lava_stylized_01.webp',
  'transition.road.dirt_to_grass_forest.edge.01':
    './assets/exploration/materials/forest/transitions/road_dirt_to_grass_forest_edge_01.webp',
  'transition.water.forest_stream_to_grass_forest.bank.01':
    './assets/exploration/materials/forest/transitions/water_forest_stream_to_grass_forest_bank_01.webp',
  'decal.forest.leaves.01':
    './assets/exploration/materials/forest/decals/leaves_forest_floor_decal_01.webp',
  'decal.forest.roots.01':
    './assets/exploration/materials/forest/decals/roots_forest_floor_decal_01.webp'
});

test('Material Asset Adapter exposes the pilot assets plus stylized terrain surfaces', () => {
  const assets = listMaterialAssets();

  assert.equal(assets.length, 17);

  for (const [id, path] of Object.entries(EXPECTED)) {
    const asset = resolveMaterialAsset(id);
    assert.equal(asset?.id, id);
    assert.equal(asset?.path, path);
    assert.match(asset.kind, /^(texture|transition|decal)$/);
  }

  assert.equal(resolveMaterialAsset('texture.unknown'), null);
});

test('every Material Asset Adapter path exists in the repository', async () => {
  for (const path of Object.values(EXPECTED)) {
    const repositoryPath = path.replace(/^\.\//, '');
    await access(new URL(`../${repositoryPath}`, import.meta.url));
  }
});

test('Material Pack v1 references every generated pilot asset semantically', () => {
  const ids = collectMaterialAssetIds(materialPackV1.materials);

  assert.deepEqual(new Set(ids), new Set(Object.keys(EXPECTED)));
  assert.equal(ids.length, 17);
});

test('Material Texture Loader has explicit load/get/dispose lifecycle', () => {
  const images = [];
  const loader = createMaterialTextureLoader({
    resolveAsset: resolveMaterialAsset,
    imageFactory: () => {
      const image = { onload: null, onerror: null, src: '' };
      images.push(image);
      return image;
    }
  });

  loader.load(['texture.grass.forest.base.01']);

  assert.equal(loader.status().loading, 1);
  assert.equal(images.length, 1);
  assert.equal(
    images[0].src,
    EXPECTED['texture.grass.forest.base.01']
  );

  images[0].onload();
  assert.equal(loader.status().ready, 1);
  assert.equal(
    loader.get('texture.grass.forest.base.01'),
    images[0]
  );

  loader.dispose();

  assert.equal(loader.status().disposed, true);
  assert.equal(loader.status().total, 0);
  assert.equal(images[0].onload, null);
  assert.equal(images[0].onerror, null);
});

test('missing semantic assets remain explicit and never fall back', () => {
  const loader = createMaterialTextureLoader({
    resolveAsset: resolveMaterialAsset,
    imageFactory: () => ({ onload: null, onerror: null, src: '' })
  });

  loader.load(['texture.unknown']);

  assert.equal(loader.status().missing, 1);
  assert.equal(loader.get('texture.unknown'), null);
});


test('forest manifest and semantic Asset Adapter stay in sync', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        '../assets/exploration/materials/forest/manifest.v1.json',
        import.meta.url
      ),
      'utf8'
    )
  );

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.packId, 'forest-core-v1');
  assert.equal(manifest.profile, 'mobile-test-128');
  assert.equal(manifest.ownership, 'exploration-material-pack');

  const manifestIds = new Set(manifest.files.map((item) => item.assetId));
  const adapterIds = new Set(listMaterialAssets().map((item) => item.id));

  assert.deepEqual(manifestIds, adapterIds);
});

test('material manifest hashes and byte sizes match committed binaries', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        '../assets/exploration/materials/forest/manifest.v1.json',
        import.meta.url
      ),
      'utf8'
    )
  );

  for (const item of manifest.files) {
    const bytes = await readFile(
      new URL(`../${item.path}`, import.meta.url)
    );
    assert.equal(bytes.byteLength, item.bytes, item.path);
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      item.sha256,
      item.path
    );
  }
});
