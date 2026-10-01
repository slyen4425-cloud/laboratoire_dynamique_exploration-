import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

import {
  listWorldObjectAssets,
  resolveWorldObjectAsset
} from '../src/assets/world-object-asset-adapter.js';
import {
  createImageAssetLoader
} from '../src/assets/image-asset-loader.js';
import {
  bridgeVisualRect,
  normalizeWorldObjects
} from '../src/world/world-object-model.js';

const EXPECTED = Object.freeze({
  'object.bridge.wood.rustic_bank.01':
    './assets/exploration/objects/bridges/bridge_wood_rustic_bank_01.webp',
  'object.bridge.stone.medieval_bank.01':
    './assets/exploration/objects/bridges/bridge_stone_medieval_bank_01.webp',
  'object.bridge.wood.rope_bank.01':
    './assets/exploration/objects/bridges/bridge_wood_rope_bank_01.webp',
  'object.bridge.stone.moss_bank.01':
    './assets/exploration/objects/bridges/bridge_stone_moss_bank_01.webp'
});

test('World Object Asset Adapter exposes exactly the four bridge visuals', () => {
  const assets = listWorldObjectAssets();

  assert.equal(assets.length, 4);

  for (const [id, path] of Object.entries(EXPECTED)) {
    const asset = resolveWorldObjectAsset(id);

    assert.equal(asset?.id, id);
    assert.equal(asset?.kind, 'bridge-visual');
    assert.equal(asset?.path, path);
    assert.equal(asset?.render?.rotationOffsetDeg, -90);
    assert.ok(asset?.render?.lengthScale > 1);
    assert.ok(asset?.render?.widthScale > 1);
  }

  assert.equal(resolveWorldObjectAsset('object.bridge.unknown'), null);
});

test('every bridge visual adapter path exists in the repository', async () => {
  for (const path of Object.values(EXPECTED)) {
    const repositoryPath = path.replace(/^\.\//, '');
    await access(new URL(`../${repositoryPath}`, import.meta.url));
  }
});

test('bridge manifest and semantic asset adapter stay in sync', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        '../assets/exploration/objects/bridges/manifest.v1.json',
        import.meta.url
      ),
      'utf8'
    )
  );

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.packId, 'bridge-visual-assets-v1');
  assert.equal(manifest.ownership, 'exploration-world-objects');
  assert.equal(manifest.runtimeProfile, 'mobile-webp-256x512-q82');

  const manifestIds = new Set(
    manifest.files.map((item) => item.assetId)
  );
  const adapterIds = new Set(
    listWorldObjectAssets().map((item) => item.id)
  );

  assert.deepEqual(manifestIds, adapterIds);
});

test('shared image loader loads bridge visuals with explicit lifecycle', () => {
  const images = [];
  const loader = createImageAssetLoader({
    resolveAsset: resolveWorldObjectAsset,
    imageFactory: () => {
      const image = { onload: null, onerror: null, src: '' };
      images.push(image);
      return image;
    }
  });

  loader.load(['object.bridge.wood.rustic_bank.01']);

  assert.equal(loader.status().loading, 1);
  assert.equal(
    images[0].src,
    EXPECTED['object.bridge.wood.rustic_bank.01']
  );

  images[0].onload();

  assert.equal(loader.status().ready, 1);
  assert.equal(
    loader.get('object.bridge.wood.rustic_bank.01'),
    images[0]
  );

  loader.dispose();

  assert.equal(loader.status().disposed, true);
  assert.equal(loader.status().total, 0);
  assert.equal(images[0].onload, null);
  assert.equal(images[0].onerror, null);
});

test('changing bridge asset id never changes logical bridge geometry', () => {
  const make = (assetId) => normalizeWorldObjects([
    {
      id: 'bridge-visual-swap',
      kind: 'bridge',
      transform: {
        x: 100,
        y: 200,
        rotationDeg: 37,
        scaleX: 1.7,
        scaleY: 0.8
      },
      baseSize: {
        length: 180,
        width: 90
      },
      visual: { assetId },
      traversal: {
        enabled: true,
        lengthRatio: 0.9,
        widthRatio: 0.8,
        overridesObstacleIds: ['river-1']
      }
    }
  ])[0];

  const wood = make('object.bridge.wood.rustic_bank.01');
  const stone = make('object.bridge.stone.moss_bank.01');

  assert.deepEqual(bridgeVisualRect(wood), bridgeVisualRect(stone));
  assert.notEqual(wood.visual.assetId, stone.visual.assetId);
});
