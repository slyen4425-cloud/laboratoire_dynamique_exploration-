import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

import {
  listWorldObjectAssets,
  resolveWorldObjectAsset
} from '../src/assets/world-object-asset-adapter.js';
import {
  createImageAssetLoader
} from '../src/assets/image-asset-loader.js';
import {
  bridgeVisualRect,
  buildingDoorAnchorWorld,
  buildingFootprintRect,
  normalizeWorldObjects
} from '../src/world/world-object-model.js';

const BRIDGE_EXPECTED = Object.freeze({
  'object.bridge.wood.rustic_bank.01':
    './assets/exploration/objects/bridges/bridge_wood_rustic_bank_01.webp',
  'object.bridge.stone.medieval_bank.01':
    './assets/exploration/objects/bridges/bridge_stone_medieval_bank_01.webp',
  'object.bridge.wood.rope_bank.01':
    './assets/exploration/objects/bridges/bridge_wood_rope_bank_01.webp',
  'object.bridge.stone.moss_bank.01':
    './assets/exploration/objects/bridges/bridge_stone_moss_bank_01.webp'
});

const BUILDING_EXPECTED = Object.freeze({
  'object.building.house.fantasy_wood_stone.01':
    './assets/exploration/objects/buildings/building_house_fantasy_wood_stone_01.webp'
});

function assertCompleteWebP(bytes, label) {
  assert.ok(bytes.length >= 12, `${label}: file too small`);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
  assert.equal(
    bytes.length,
    bytes.readUInt32LE(4) + 8,
    `${label}: truncated WebP binary`
  );
}

test('World Object Asset Adapter exposes the four Bridge visuals', () => {
  const assets = listWorldObjectAssets()
    .filter((asset) => asset.kind === 'bridge-visual');

  assert.equal(assets.length, 4);

  for (const [id, path] of Object.entries(BRIDGE_EXPECTED)) {
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

test('World Object Asset Adapter exposes the first Building visual', () => {
  const id = 'object.building.house.fantasy_wood_stone.01';
  const asset = resolveWorldObjectAsset(id);

  assert.equal(asset?.id, id);
  assert.equal(asset?.kind, 'building-visual');
  assert.equal(asset?.path, BUILDING_EXPECTED[id]);
  assert.equal(asset?.render?.rotationOffsetDeg, 0);
  assert.ok(asset?.render?.widthScale > 0);
  assert.ok(asset?.render?.heightScale > 0);
});

test('every WorldObject visual adapter path exists in the repository', async () => {
  const paths = [
    ...Object.values(BRIDGE_EXPECTED),
    ...Object.values(BUILDING_EXPECTED)
  ];

  for (const path of paths) {
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

  const manifestIds = new Set(
    manifest.files.map((item) => item.assetId)
  );
  const adapterIds = new Set(
    listWorldObjectAssets()
      .filter((item) => item.kind === 'bridge-visual')
      .map((item) => item.id)
  );

  assert.deepEqual(manifestIds, adapterIds);
});

test('building manifest and semantic asset adapter stay in sync', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        '../assets/exploration/objects/buildings/manifest.v1.json',
        import.meta.url
      ),
      'utf8'
    )
  );

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.packId, 'building-visual-assets-v1');
  assert.equal(manifest.runtimeProfile, 'mobile-webp-384x384-q82');

  const manifestIds = new Set(
    manifest.files.map((item) => item.assetId)
  );
  const adapterIds = new Set(
    listWorldObjectAssets()
      .filter((item) => item.kind === 'building-visual')
      .map((item) => item.id)
  );

  assert.deepEqual(manifestIds, adapterIds);
});

test('shared image loader loads WorldObject visuals with explicit lifecycle', async () => {
  const images = [];
  const loader = createImageAssetLoader({
    resolveAsset: resolveWorldObjectAsset,
    imageFactory: () => {
      const image = { onload: null, onerror: null, src: '' };
      images.push(image);
      return image;
    }
  });

  const loading = loader.load(['object.building.house.fantasy_wood_stone.01']);

  assert.equal(loader.status().loading, 1);
  assert.equal(
    images[0].src,
    BUILDING_EXPECTED['object.building.house.fantasy_wood_stone.01']
  );

  images[0].onload();
  const loadedStatus = await loading;

  assert.equal(loadedStatus.ready, 1);
  assert.equal(
    loader.get('object.building.house.fantasy_wood_stone.01'),
    images[0]
  );

  loader.dispose();
  assert.equal(loader.status().disposed, true);
});

test('changing Bridge asset id never changes logical bridge geometry', () => {
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

test('changing Building asset id never changes logical footprint or door anchor', () => {
  const make = (assetId) => normalizeWorldObjects([
    {
      id: 'building-visual-swap',
      kind: 'building',
      transform: {
        x: 300,
        y: 400,
        rotationDeg: 22,
        scaleX: 1.2,
        scaleY: 0.9
      },
      baseSize: {
        width: 280,
        height: 260
      },
      visual: { assetId },
      footprint: {
        widthRatio: 0.78,
        heightRatio: 0.62,
        offsetX: 0,
        offsetY: -0.08
      },
      doorAnchors: [
        { id: 'main-door', x: 0, y: 0.38 }
      ]
    }
  ])[0];

  const first = make('object.building.house.fantasy_wood_stone.01');
  const second = make('object.building.future.02');

  assert.deepEqual(buildingFootprintRect(first), buildingFootprintRect(second));
  assert.deepEqual(
    buildingDoorAnchorWorld(first, 'main-door'),
    buildingDoorAnchorWorld(second, 'main-door')
  );
});

test('required WorldObject asset failure is explicit and never replaced by another visual', async () => {
  const loader = createImageAssetLoader({
    resolveAsset: resolveWorldObjectAsset,
    imageFactory: () => ({ onload: null, onerror: null, src: '' })
  });

  const status = await loader.load(['object.building.unknown']);

  assert.equal(status.missing, 1);
  assert.equal(status.ready, 0);
  assert.equal(loader.get('object.building.unknown'), null);
  assert.equal(loader.state('object.building.unknown'), 'missing');
});

test('all declared WorldObject WebP binaries are complete', async () => {
  const paths = [
    ...Object.values(BRIDGE_EXPECTED),
    ...Object.values(BUILDING_EXPECTED)
  ];

  for (const path of paths) {
    const repositoryPath = path.replace(/^\.\//, '');
    const bytes = await readFile(
      new URL(`../${repositoryPath}`, import.meta.url)
    );

    assertCompleteWebP(bytes, path);
  }
});

test('bridge manifest hashes and byte sizes match runtime binaries', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        '../assets/exploration/objects/bridges/manifest.v1.json',
        import.meta.url
      ),
      'utf8'
    )
  );

  for (const item of manifest.files) {
    const bytes = await readFile(
      new URL(`../${item.path}`, import.meta.url)
    );
    const sha256 = createHash('sha256').update(bytes).digest('hex');

    assert.equal(bytes.length, item.bytes, `${item.assetId}: byte size mismatch`);
    assert.equal(sha256, item.sha256, `${item.assetId}: sha256 mismatch`);
  }
});

test('building manifest hash and byte size match runtime binary', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        '../assets/exploration/objects/buildings/manifest.v1.json',
        import.meta.url
      ),
      'utf8'
    )
  );

  for (const item of manifest.files) {
    const bytes = await readFile(
      new URL(`../${item.path}`, import.meta.url)
    );
    const sha256 = createHash('sha256').update(bytes).digest('hex');

    assert.equal(bytes.length, item.bytes, `${item.assetId}: byte size mismatch`);
    assert.equal(sha256, item.sha256, `${item.assetId}: sha256 mismatch`);
  }
});

test('image loader can force cache revision without changing adapter authority', async () => {
  const images = [];
  const loader = createImageAssetLoader({
    resolveAsset: resolveWorldObjectAsset,
    cacheRevision: 'building-v1-assets-2026-10-02',
    imageFactory: () => {
      const image = { onload: null, onerror: null, src: '' };
      images.push(image);
      return image;
    }
  });

  const id = 'object.building.house.fantasy_wood_stone.01';
  const loading = loader.load([id]);

  assert.equal(
    images[0].src,
    BUILDING_EXPECTED[id] + '?rev=building-v1-assets-2026-10-02'
  );

  images[0].onload();
  const status = await loading;

  assert.equal(status.ready, 1);
  assert.equal(resolveWorldObjectAsset(id).path, BUILDING_EXPECTED[id]);
});
