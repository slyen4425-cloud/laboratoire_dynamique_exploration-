import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { listWorldObjectAssets, resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
import { listSculptPlaceableDefinitions, appendSculptPreviewObject } from '../src/world/sculpt-scene-preview.js';
import { resolveObjectLibraryFolder } from '../src/objects/object-library-taxonomy.js';

const manifestPath = new URL('../assets/exploration/objects/trees/manifest.snow-trees.v1.json', import.meta.url);

test('20 winter trees are native placeable WorldObjects in the existing vegetation library', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.packId, 'tree-snow-visual-assets-v1');
  assert.equal(manifest.files.length, 20);
  assert.equal(resolveObjectLibraryFolder('vegetation/trees').categoryId, 'vegetation');
  const ids = new Set();
  const paths = new Set();
  for (const entry of manifest.files) {
    assert.equal(entry.family, 'snow');
    assert.equal(entry.view, 'three-quarter-2.5d');
    assert.equal(entry.width, 384);
    assert.equal(entry.height, 384);
    assert.equal(ids.has(entry.assetId), false, 'duplicate asset ID');
    assert.equal(paths.has(entry.path), false, 'duplicate asset path');
    ids.add(entry.assetId);
    paths.add(entry.path);
    assert.match(entry.assetId, /^object\.tree\.snow\.[a-z0-9_]+\.[0-9]{2}$/);
    assert.match(entry.path, /^assets\/exploration\/objects\/trees\/tree_snow_[a-z0-9_]+\.webp$/);
    const defId = entry.assetId.replace('object.tree.', 'objectdef.tree.');
    const def = objectDefinitionCatalogV1.require(defId);
    assert.equal(def.kind, 'tree');
    assert.equal(def.library.categoryId, 'vegetation');
    assert.equal(def.library.folderId, 'vegetation/trees');
    assert.equal(def.visual.assetId, entry.assetId);
    assert.equal(def.collision.role, 'obstacle');
    assert.equal(def.collision.shape, 'box');
    assert.ok(listSculptPlaceableDefinitions().some((x) => x.id === defId));
    const next = appendSculptPreviewObject([], { definitionId: defId, x: 100, y: 100, scale: .38 });
    assert.equal(next.length, 1);
    const visual = resolveWorldObjectAsset(entry.assetId);
    assert.ok(visual);
    assert.equal(visual.kind, 'tree-visual');
    assert.equal(visual.path, './' + entry.path);
    assert.ok(listWorldObjectAssets().some((x) => x.id === entry.assetId));
  }
});

test('20 delivered WebP trees match approved ZIP manifest hashes, dimensions and alpha', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const entry of manifest.files) {
    const data = await readFile(new URL('../' + entry.path, import.meta.url));
    assert.equal(data.length, entry.bytes, entry.assetId + ': byte size');
    assert.equal(createHash('sha256').update(data).digest('hex'), entry.sha256, entry.assetId + ': checksum');
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    assert.equal(data.readUInt32LE(4) + 8, data.length, entry.assetId + ': riff length');
    assert.equal(data.toString('ascii', 12, 16), 'VP8X');
    assert.equal(data[20] & 0x10, 0x10, entry.assetId + ': alpha');
    assert.equal(data.readUIntLE(24, 3) + 1, 384, entry.assetId + ': width');
    assert.equal(data.readUIntLE(27, 3) + 1, 384, entry.assetId + ': height');
  }
});

test('previous forest and fantasy tree visual definitions are retained', () => {
  const prior = [
    'object.tree.forest.pine_dense.01',
    'object.tree.forest.spruce_tall.01',
    'object.tree.forest.broadleaf.01',
    'object.tree.fantasy.blossom.01',
    'object.tree.fantasy.ancient_twist.01',
    'object.tree.forest.oak.01',
    'object.tree.forest.pine.01',
    'object.tree.fantasy.ancient_blossom.01'
  ];
  for (const id of prior) {
    assert.ok(resolveWorldObjectAsset(id));
    assert.ok(objectDefinitionCatalogV1.get(id.replace('object.tree.', 'objectdef.tree.')));
  }
});
