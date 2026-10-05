import test from 'node:test';
import assert from 'node:assert/strict';
import {
  access,
  readFile
} from 'node:fs/promises';
import { createHash } from 'node:crypto';

import {
  objectDefinitionCatalogV1
} from '../src/objects/object-definition-catalog.js';
import {
  resolveWorldObjectAsset
} from '../src/assets/world-object-asset-adapter.js';

const SHOWCASE = Object.freeze([
  ['objectdef.building.house.blue_cottage.01', 'object.building.house.blue_cottage.01'],
  ['objectdef.building.house.red_tile.01', 'object.building.house.red_tile.01'],
  ['objectdef.building.inn.golden_thatch.01', 'object.building.inn.golden_thatch.01'],
  ['objectdef.tree.forest.oak.01', 'object.tree.forest.oak.01'],
  ['objectdef.tree.forest.pine.01', 'object.tree.forest.pine.01'],
  ['objectdef.tree.fantasy.ancient_blossom.01', 'object.tree.fantasy.ancient_blossom.01'],
  ['objectdef.rock.forest.boulder.01', 'object.rock.forest.boulder.01'],
  ['objectdef.rock.forest.spires.01', 'object.rock.forest.spires.01'],
  ['objectdef.rock.forest.plateau.01', 'object.rock.forest.plateau.01'],
  ['objectdef.door.fantasy.wood.01', 'object.door.fantasy.wood.01'],
  ['objectdef.door.fantasy.stone_redroof.01', 'object.door.fantasy.stone_redroof.01'],
  ['objectdef.door.fantasy.tavern_golden.01', 'object.door.fantasy.tavern_golden.01'],
  ['objectdef.stairs.stone.simple.01', 'object.stairs.stone.simple.01'],
  ['objectdef.stairs.wood.porch.01', 'object.stairs.wood.porch.01'],
  ['objectdef.stairs.stone.grand.01', 'object.stairs.stone.grand.01']
]);

const MANIFESTS = Object.freeze([
  'assets/exploration/objects/buildings/manifest.v1.json',
  'assets/exploration/objects/trees/manifest.v1.json',
  'assets/exploration/objects/rocks/manifest.v1.json',
  'assets/exploration/objects/doors/manifest.v1.json',
  'assets/exploration/objects/stairs/manifest.v1.json'
]);

function assertCompleteWebP(bytes, label) {
  assert.ok(
    bytes.length >= 12,
    `${label}: file too small`
  );
  assert.equal(
    bytes.subarray(0, 4).toString('ascii'),
    'RIFF'
  );
  assert.equal(
    bytes.subarray(8, 12).toString('ascii'),
    'WEBP'
  );
  assert.equal(
    bytes.length,
    bytes.readUInt32LE(4) + 8,
    `${label}: truncated WebP binary`
  );
}

test('Environment Showcase exposes all 15 generated top-down definitions through the unique catalog', () => {
  assert.equal(SHOWCASE.length, 15);

  const ids = new Set();

  for (const [definitionId, assetId] of SHOWCASE) {
    const definition =
      objectDefinitionCatalogV1.require(
        definitionId
      );

    assert.equal(
      definition.visual?.assetId,
      assetId
    );
    assert.equal(
      ids.has(assetId),
      false,
      `duplicate showcase assetId: ${assetId}`
    );
    ids.add(assetId);
  }
});

test('Environment Showcase asset adapter resolves every generated visual and owns the physical paths', async () => {
  for (const [, assetId] of SHOWCASE) {
    const asset =
      resolveWorldObjectAsset(assetId);

    assert.ok(asset, assetId);
    assert.ok(
      asset.path.startsWith(
        './assets/exploration/objects/'
      )
    );

    await access(
      new URL(
        `../${asset.path.replace(/^\.\//, '')}`,
        import.meta.url
      )
    );
  }
});

test('Environment Showcase manifests match committed WebP bytes and SHA-256', async () => {
  const entries = new Map();

  for (const manifestPath of MANIFESTS) {
    const manifest = JSON.parse(
      await readFile(
        new URL(
          `../${manifestPath}`,
          import.meta.url
        ),
        'utf8'
      )
    );

    assert.equal(manifest.schemaVersion, 1);
    assert.equal(
      manifest.runtimeProfile,
      'mobile-webp-384x384-q82'
    );

    for (const entry of manifest.files) {
      entries.set(entry.assetId, entry);
    }
  }

  for (const [, assetId] of SHOWCASE) {
    const entry = entries.get(assetId);
    assert.ok(
      entry,
      `manifest missing ${assetId}`
    );
    assert.equal(entry.view, 'top-down');

    const bytes = await readFile(
      new URL(
        `../${entry.path}`,
        import.meta.url
      )
    );

    assertCompleteWebP(bytes, assetId);

    assert.equal(
      bytes.length,
      entry.bytes,
      `${assetId}: byte size mismatch`
    );
    assert.equal(
      createHash('sha256')
        .update(bytes)
        .digest('hex'),
      entry.sha256,
      `${assetId}: sha256 mismatch`
    );
  }
});

test('Door and Stairs showcase definitions stay visual-only in v1', () => {
  const visualOnlyKinds =
    new Set(['door', 'stairs']);

  for (const [definitionId] of SHOWCASE) {
    const definition =
      objectDefinitionCatalogV1.require(
        definitionId
      );

    if (
      !visualOnlyKinds.has(
        definition.kind
      )
    ) {
      continue;
    }

    assert.equal(
      'traversal' in definition,
      false
    );
    assert.equal(
      'interaction' in definition,
      false
    );
    assert.equal(
      'portal' in definition,
      false
    );
  }
});
