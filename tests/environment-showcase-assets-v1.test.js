import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  objectDefinitionCatalogV1
} from '../src/objects/object-definition-catalog.js';
import {
  resolveWorldObjectAsset
} from '../src/assets/world-object-asset-adapter.js';
import {
  normalizeWorldObjectPlacement
} from '../src/world/world-object-placement-model.js';
import {
  createWorldObjectRenderer
} from '../src/render/world-object-renderer.js';

const SHOWCASE = Object.freeze([
  Object.freeze({
    family: 'tree',
    definitionId: 'objectdef.tree.forest.oak.01',
    assetId: 'object.tree.forest.oak.01',
    assetPath: './assets/exploration/objects/trees/tree_forest_oak_01.webp',
    manifestPath: 'assets/exploration/objects/trees/manifest.v1.json'
  }),
  Object.freeze({
    family: 'rock',
    definitionId: 'objectdef.rock.forest.boulder.01',
    assetId: 'object.rock.forest.boulder.01',
    assetPath: './assets/exploration/objects/rocks/rock_forest_boulder_01.webp',
    manifestPath: 'assets/exploration/objects/rocks/manifest.v1.json'
  }),
  Object.freeze({
    family: 'door',
    definitionId: 'objectdef.door.fantasy.wood.01',
    assetId: 'object.door.fantasy.wood.01',
    assetPath: './assets/exploration/objects/doors/door_fantasy_wood_01.webp',
    manifestPath: 'assets/exploration/objects/doors/manifest.v1.json'
  }),
  Object.freeze({
    family: 'stairs',
    definitionId: 'objectdef.stairs.stone.simple.01',
    assetId: 'object.stairs.stone.simple.01',
    assetPath: './assets/exploration/objects/stairs/stairs_stone_simple_01.webp',
    manifestPath: 'assets/exploration/objects/stairs/manifest.v1.json'
  }),
  Object.freeze({
    family: 'building',
    definitionId: 'objectdef.building.house.fantasy_wood_stone.01',
    assetId: 'object.building.house.fantasy_wood_stone.01',
    assetPath: './assets/exploration/objects/buildings/building_house_fantasy_wood_stone_01.webp',
    manifestPath: 'assets/exploration/objects/buildings/manifest.v1.json'
  })
]);

function fakeContext() {
  const calls = [];
  return {
    calls,
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage(...args) {
      calls.push(args);
    }
  };
}

for (const item of SHOWCASE) {
  test(`Environment Showcase catalog resolves ${item.family} by stable ObjectDefinition id`, () => {
    const definition =
      objectDefinitionCatalogV1.get(
        item.definitionId
      );

    assert.ok(
      definition,
      `missing definition: ${item.definitionId}`
    );
    assert.equal(
      definition.visual?.assetId,
      item.assetId
    );
    assert.equal(
      Object.hasOwn(
        definition.visual ?? {},
        'path'
      ),
      false,
      'ObjectDefinition must not own a physical asset path'
    );
    assert.ok(
      Number.isFinite(
        definition.baseSize?.width
      ) &&
      definition.baseSize.width > 0,
      `${item.definitionId}: baseSize.width required`
    );
    assert.ok(
      Number.isFinite(
        definition.baseSize?.height
      ) &&
      definition.baseSize.height > 0,
      `${item.definitionId}: baseSize.height required`
    );
  });

  test(`Environment Showcase Asset Adapter resolves ${item.family} semantic assetId`, () => {
    const asset =
      resolveWorldObjectAsset(
        item.assetId
      );

    assert.ok(
      asset,
      `missing asset: ${item.assetId}`
    );
    assert.equal(asset.id, item.assetId);
    assert.equal(
      asset.path,
      item.assetPath
    );
    assert.equal(
      asset.path.startsWith(
        './assets/exploration/objects/'
      ),
      true
    );
  });

  test(`Environment Showcase manifest records ${item.family} hash and bytes`, async () => {
    const manifest = JSON.parse(
      await readFile(
        item.manifestPath,
        'utf8'
      )
    );

    const entry =
      manifest.files?.find(
        (file) =>
          file.assetId ===
          item.assetId
      );

    assert.ok(
      entry,
      `manifest missing ${item.assetId}`
    );
    assert.equal(
      entry.path,
      item.assetPath.replace(/^\.\//, '')
    );
    assert.match(
      entry.sha256,
      /^[a-f0-9]{64}$/
    );
    assert.ok(
      Number.isInteger(entry.bytes) &&
      entry.bytes > 0
    );
  });
}

for (
  const item of SHOWCASE.filter(
    ({ family }) =>
      family !== 'building'
  )
) {
  test(`Environment Showcase generic placement accepts ${item.family} without copying definition data`, () => {
    const placement =
      normalizeWorldObjectPlacement({
        id: `${item.family}-showcase-1`,
        objectDefinitionId:
          item.definitionId,
        transform: {
          x: 120,
          y: 140,
          rotationDeg: 45,
          scaleX: 1.25,
          scaleY: 0.75
        }
      });

    assert.ok(placement);
    assert.equal(
      placement.objectDefinitionId,
      item.definitionId
    );
    assert.deepEqual(
      placement.transform,
      {
        x: 120,
        y: 140,
        rotationDeg: 45,
        scaleX: 1.25,
        scaleY: 0.75
      }
    );
    assert.equal(
      Object.hasOwn(
        placement,
        'visual'
      ),
      false
    );
    assert.equal(
      Object.hasOwn(
        placement,
        'baseSize'
      ),
      false
    );
  });

  test(`Environment Showcase renderer draws ${item.family} through the generic WorldObject pipeline`, () => {
    const placement =
      normalizeWorldObjectPlacement({
        id: `${item.family}-render-1`,
        objectDefinitionId:
          item.definitionId,
        transform: {
          x: 100,
          y: 100,
          rotationDeg: 20,
          scaleX: 1,
          scaleY: 1
        }
      });

    assert.ok(placement);

    const ctx = fakeContext();
    const renderer =
      createWorldObjectRenderer({
        imageLoader: {
          get(assetId) {
            return assetId ===
              item.assetId
              ? { id: assetId }
              : null;
          }
        },
        resolveVisualAsset(assetId) {
          return assetId ===
            item.assetId
            ? {
                id: assetId,
                render: {
                  rotationOffsetDeg: 0,
                  widthScale: 1,
                  heightScale: 1
                }
              }
            : null;
        }
      });

    renderer.draw(ctx, {
      camera: { x: 0, y: 0 },
      viewport: {
        width: 400,
        height: 400
      },
      objects: [placement]
    });

    assert.equal(
      ctx.calls.length,
      1,
      `${item.family} must render through the existing WorldObject renderer`
    );
  });
}

test('Environment Showcase missing static object asset is an explicit renderer error', () => {
  const item = SHOWCASE[0];
  const placement =
    normalizeWorldObjectPlacement({
      id: 'tree-missing-asset',
      objectDefinitionId:
        item.definitionId,
      transform: {
        x: 100,
        y: 100
      }
    });

  assert.ok(placement);

  const renderer =
    createWorldObjectRenderer({
      imageLoader: {
        get() {
          return null;
        }
      },
      resolveVisualAsset() {
        return null;
      }
    });

  assert.throws(
    () =>
      renderer.draw(
        fakeContext(),
        {
          camera: { x: 0, y: 0 },
          viewport: {
            width: 400,
            height: 400
          },
          objects: [placement]
        }
      ),
    /WorldObject visual asset not ready/
  );
});

test('Environment Showcase keeps physical object paths out of Builder and ObjectDefinitions', async () => {
  const [
    builderSource,
    catalogSource
  ] = await Promise.all([
    readFile(
      'src/builder/world-builder-main.js',
      'utf8'
    ),
    readFile(
      'src/objects/object-definition-catalog.js',
      'utf8'
    )
  ]);

  assert.equal(
    builderSource.includes(
      'assets/exploration/objects/'
    ),
    false
  );
  assert.equal(
    catalogSource.includes('.webp'),
    false
  );
  assert.equal(
    catalogSource.includes('.png'),
    false
  );
});
