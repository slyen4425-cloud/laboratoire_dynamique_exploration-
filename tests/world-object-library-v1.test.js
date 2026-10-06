import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  listObjectLibraryCategories,
  listObjectLibraryFolders,
  resolveObjectLibraryFolder
} from '../src/objects/object-library-taxonomy.js';
import {
  createUserWorldObjectRecord,
  objectDefinitionFromUserRecord,
  countObjectDefinitionReferences
} from '../src/objects/user-object-library.js';
import {
  createObjectDefinitionCatalog,
  objectDefinitionCatalogV1
} from '../src/objects/object-definition-catalog.js';
import {
  createWorldObjectAssetResolver
} from '../src/assets/world-object-asset-adapter.js';
import {
  normalizeWorldObjectPlacement,
  resolveWorldObjectPlacement
} from '../src/world/world-object-placement-model.js';

test('World Object Library exposes stable categories and subfolders', () => {
  const categories = listObjectLibraryCategories();
  const folders = listObjectLibraryFolders();

  for (const id of [
    'buildings',
    'vegetation',
    'rocks',
    'doors',
    'stairs',
    'bridges',
    'decor'
  ]) {
    assert.ok(categories.some((item) => item.id === id), id);
  }

  for (const id of [
    'buildings/houses/temperate',
    'buildings/houses/snow',
    'buildings/houses/sand',
    'vegetation/trees',
    'vegetation/bushes',
    'rocks/general',
    'doors/general',
    'stairs/general'
  ]) {
    assert.ok(folders.some((item) => item.id === id), id);
    assert.ok(resolveObjectLibraryFolder(id));
  }
});

test('native ObjectDefinitions carry logical library metadata without physical paths', () => {
  for (const definition of objectDefinitionCatalogV1.list()) {
    assert.ok(definition.library?.categoryId, definition.id);
    assert.ok(definition.library?.folderId, definition.id);
    assert.equal(
      /\.(png|jpe?g|webp|svg)$/i.test(definition.library.folderId),
      false,
      definition.id
    );
  }
});

test('user object import record becomes a normal ObjectDefinition in a chosen folder', () => {
  const blob = new Blob(['asset'], { type: 'image/webp' });
  const record = createUserWorldObjectRecord({
    idToken: 'oak-custom-1',
    kind: 'tree',
    label: 'Mon chêne',
    categoryId: 'vegetation',
    folderId: 'vegetation/trees',
    folderLabel: 'Arbres',
    mimeType: 'image/webp',
    width: 512,
    height: 640,
    bytes: blob.size,
    sourceName: 'oak.webp',
    blob,
    createdAt: '2026-10-06T00:00:00.000Z'
  });

  const definition = objectDefinitionFromUserRecord(record);

  assert.equal(record.assetId, 'user.object.asset.tree.oak-custom-1');
  assert.equal(record.definitionId, 'user.objectdef.tree.oak-custom-1');
  assert.equal(definition.id, record.definitionId);
  assert.equal(definition.visual.assetId, record.assetId);
  assert.equal(definition.library.categoryId, 'vegetation');
  assert.equal(definition.library.folderId, 'vegetation/trees');
  assert.ok(definition.baseSize.width > 0);
  assert.ok(definition.baseSize.height > 0);

  const composed = createObjectDefinitionCatalog([
    ...objectDefinitionCatalogV1.list(),
    definition
  ]);
  assert.equal(composed.require(record.definitionId).label, 'Mon chêne');
});

test('custom user subfolder remains logical metadata and can coexist with canonical folders', () => {
  const blob = new Blob(['asset'], { type: 'image/png' });
  const record = createUserWorldObjectRecord({
    idToken: 'bush-1',
    kind: 'decor',
    label: 'Buisson rouge',
    categoryId: 'vegetation',
    folderId: 'vegetation/bushes/my-red-garden',
    folderLabel: 'Mon jardin rouge',
    mimeType: 'image/png',
    width: 256,
    height: 192,
    bytes: blob.size,
    sourceName: 'bush.png',
    blob
  });

  assert.equal(record.folderId, 'vegetation/bushes/my-red-garden');
  assert.equal(record.folderLabel, 'Mon jardin rouge');
  assert.equal(record.folderId.includes('assets/'), false);
});

test('composed WorldObject asset resolver keeps native authority and adds user blobs through one resolver', () => {
  const userAsset = Object.freeze({
    id: 'user.object.asset.tree.one',
    kind: 'user-world-object-visual',
    path: 'blob:test-one',
    render: Object.freeze({
      rotationOffsetDeg: 0,
      widthScale: 1,
      heightScale: 1
    })
  });
  const resolve = createWorldObjectAssetResolver({
    resolveUserAsset: (id) =>
      id === userAsset.id ? userAsset : null
  });

  assert.ok(resolve('object.tree.forest.oak.01'));
  assert.equal(resolve(userAsset.id), userAsset);
  assert.equal(resolve('missing'), null);
});

test('unknown ObjectDefinition references survive placement normalization and fail only at resolution', () => {
  const placement = normalizeWorldObjectPlacement({
    id: 'user-object-1',
    objectDefinitionId: 'user.objectdef.tree.offline',
    transform: {
      x: 10,
      y: 20,
      rotationDeg: 0,
      scaleX: 1,
      scaleY: 1
    }
  });

  assert.ok(placement);
  assert.equal(
    placement.objectDefinitionId,
    'user.objectdef.tree.offline'
  );
  assert.equal(
    resolveWorldObjectPlacement(
      placement,
      objectDefinitionCatalogV1
    ),
    null
  );
});

test('user object deletion protection counts WorldDocument references', () => {
  const world = {
    areas: [
      {
        objects: [
          {
            id: 'one',
            objectDefinitionId: 'user.objectdef.tree.custom'
          },
          {
            id: 'two',
            objectDefinitionId: 'objectdef.tree.forest.oak.01'
          }
        ]
      }
    ]
  };

  assert.equal(
    countObjectDefinitionReferences(
      world,
      'user.objectdef.tree.custom'
    ),
    1
  );
});

test('building visual variants resolve declaratively through placement overrides', () => {
  const catalog = createObjectDefinitionCatalog([
    {
      schemaVersion: 1,
      id: 'objectdef.building.test.oriented',
      label: 'Maison test',
      kind: 'building',
      library: {
        categoryId: 'buildings',
        folderId: 'buildings/houses/temperate'
      },
      visual: {
        assetId: 'object.building.test.front',
        defaultVariantId: 'south',
        variants: [
          {
            id: 'south',
            label: 'Façade vers le bas',
            assetId: 'object.building.test.front'
          },
          {
            id: 'north',
            label: 'Arrière vers le bas',
            assetId: 'object.building.test.rear'
          }
        ]
      },
      baseSize: { width: 280, height: 240 },
      footprint: { enabled: false },
      doorAnchors: []
    }
  ]);

  const placement = normalizeWorldObjectPlacement(
    {
      id: 'house-1',
      objectDefinitionId: 'objectdef.building.test.oriented',
      transform: { x: 0, y: 0, rotationDeg: 0, scaleX: 1, scaleY: 1 },
      overrides: { visualVariantId: 'north' }
    }
  );
  const resolved = resolveWorldObjectPlacement(placement, catalog);

  assert.equal(resolved.visual.assetId, 'object.building.test.rear');
  assert.equal(resolved.visual.variantId, 'north');
});

test('Builder exposes category/folder browsing and user object import controls', async () => {
  const [html, main] = await Promise.all([
    readFile(new URL('../builder.html', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/builder/world-builder-main.js', import.meta.url),
      'utf8'
    )
  ]);

  for (const id of [
    'object-library-category',
    'object-library-folder',
    'user-object-name',
    'user-object-kind',
    'user-object-folder',
    'user-object-custom-folder',
    'user-object-file',
    'user-object-import',
    'user-object-library',
    'user-object-delete',
    'user-object-status'
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`), id);
  }

  assert.match(main, /createUserWorldObjectStore/);
  assert.match(main, /createUserWorldObjectAssetResolver/);
  assert.match(main, /createWorldObjectAssetResolver/);
  assert.match(main, /objectDefinitionFromUserRecord/);
  assert.match(main, /rebuildWorldObjectPipeline/);
});


test('Exploration runtime rebuilds the same composed WorldObject pipeline as Builder', async () => {
  const runtime = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(runtime, /createUserWorldObjectStore/);
  assert.match(runtime, /objectDefinitionFromUserRecord/);
  assert.match(runtime, /createComposedObjectDefinitionCatalog/);
  assert.match(runtime, /createUserWorldObjectAssetResolver/);
  assert.match(runtime, /createWorldObjectAssetResolver/);
  assert.match(runtime, /resolveRuntimeWorldObjectPlacements/);
  assert.match(
    runtime,
    /Objets personnels introuvables sur cet appareil/
  );
});


const BUILDING_ORIENTATION_VARIANTS = Object.freeze([
  Object.freeze({
    definitionId: 'objectdef.building.house.blue_cottage.01',
    frontAssetId: 'object.building.house.blue_cottage.01',
    sideAssetId: 'object.building.house.blue_cottage.side.01',
    backAssetId: 'object.building.house.blue_cottage.back.01',
    sidePath: './assets/exploration/objects/buildings/building_house_blue_cottage_side_01.webp',
    backPath: './assets/exploration/objects/buildings/building_house_blue_cottage_back_01.webp'
  }),
  Object.freeze({
    definitionId: 'objectdef.building.house.red_tile.01',
    frontAssetId: 'object.building.house.red_tile.01',
    sideAssetId: 'object.building.house.red_tile.side.01',
    backAssetId: 'object.building.house.red_tile.back.01',
    sidePath: './assets/exploration/objects/buildings/building_house_red_tile_side_01.webp',
    backPath: './assets/exploration/objects/buildings/building_house_red_tile_back_01.webp'
  }),
  Object.freeze({
    definitionId: 'objectdef.building.inn.golden_thatch.01',
    frontAssetId: 'object.building.inn.golden_thatch.01',
    sideAssetId: 'object.building.inn.golden_thatch.side.01',
    backAssetId: 'object.building.inn.golden_thatch.back.01',
    sidePath: './assets/exploration/objects/buildings/building_inn_golden_thatch_side_01.webp',
    backPath: './assets/exploration/objects/buildings/building_inn_golden_thatch_back_01.webp'
  })
]);

test('native building orientation variants expose front side and back assets through the same ObjectDefinition', async () => {
  const {
    resolveWorldObjectAsset
  } = await import('../src/assets/world-object-asset-adapter.js');

  for (const item of BUILDING_ORIENTATION_VARIANTS) {
    const definition =
      objectDefinitionCatalogV1.require(
        item.definitionId
      );
    const variants =
      definition.visual?.variants ?? [];

    assert.equal(
      definition.visual?.defaultVariantId,
      'front',
      item.definitionId
    );
    assert.deepEqual(
      variants.map((variant) => variant.id),
      ['front', 'side', 'back'],
      item.definitionId
    );
    assert.equal(
      variants.find((variant) => variant.id === 'front')?.assetId,
      item.frontAssetId
    );
    assert.equal(
      variants.find((variant) => variant.id === 'side')?.assetId,
      item.sideAssetId
    );
    assert.equal(
      variants.find((variant) => variant.id === 'back')?.assetId,
      item.backAssetId
    );

    assert.equal(
      resolveWorldObjectAsset(item.sideAssetId)?.path,
      item.sidePath
    );
    assert.equal(
      resolveWorldObjectAsset(item.backAssetId)?.path,
      item.backPath
    );
  }
});

test('building orientation variant files are tracked by manifest with SHA-256 and byte size', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        '../assets/exploration/objects/buildings/manifest.v1.json',
        import.meta.url
      ),
      'utf8'
    )
  );

  for (const item of BUILDING_ORIENTATION_VARIANTS) {
    for (const [assetId, path] of [
      [item.sideAssetId, item.sidePath],
      [item.backAssetId, item.backPath]
    ]) {
      const entry = manifest.files.find(
        (file) => file.assetId === assetId
      );

      assert.ok(entry, assetId);
      assert.equal(
        entry.path,
        path.replace(/^\.\//, '')
      );
      assert.match(entry.sha256, /^[a-f0-9]{64}$/);
      assert.ok(
        Number.isInteger(entry.bytes) &&
        entry.bytes > 0
      );
    }
  }
});
