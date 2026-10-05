import test from 'node:test';
import assert from 'node:assert/strict';

import {
  USER_MATERIAL_SCHEMA_VERSION,
  USER_TEXTURE_MAX_BYTES,
  composeMaterialPackWithUserMaterials,
  countMaterialReferences,
  createUserMaterialRecord,
  materialDefinitionFromUserRecord,
  validateUserTextureMetadata
} from '../src/materials/user-material-library.js';

test('user texture metadata validation is explicit and mobile bounded', () => {
  assert.equal(USER_MATERIAL_SCHEMA_VERSION, 1);
  assert.equal(USER_TEXTURE_MAX_BYTES, 8 * 1024 * 1024);

  assert.deepEqual(
    validateUserTextureMetadata({
      mimeType: 'image/webp',
      bytes: 512000,
      width: 1024,
      height: 1024
    }),
    { valid: true, errors: [] }
  );

  const invalid = validateUserTextureMetadata({
    mimeType: 'image/gif',
    bytes: USER_TEXTURE_MAX_BYTES + 1,
    width: 8192,
    height: 8
  });
  assert.equal(invalid.valid, false);
  assert.deepEqual(
    new Set(invalid.errors),
    new Set([
      'format-unsupported',
      'file-too-large',
      'dimensions-too-large',
      'dimensions-too-small'
    ])
  );
});

test('versioned user records reserve stable user material and asset namespaces', () => {
  const blob = new Blob(['texture'], { type: 'image/png' });
  const record = createUserMaterialRecord({
    idToken: 'abc-123',
    kind: 'surface',
    label: 'Mon sol',
    mimeType: 'image/png',
    width: 512,
    height: 512,
    bytes: blob.size,
    sourceName: 'mon-sol.png',
    blob,
    createdAt: '2026-10-05T15:00:00.000Z'
  });

  assert.equal(record.schemaVersion, 1);
  assert.equal(record.id, 'user.material.surface.abc-123');
  assert.equal(record.assetId, 'user.texture.surface.abc-123');
  assert.equal(record.kind, 'surface');
  assert.equal(record.provenance, 'user-local');
  assert.equal(record.blob, blob);
});

test('user records become normal Material Registry definitions for all three canonical kinds', () => {
  const base = {
    idToken: 'one',
    label: 'Perso',
    mimeType: 'image/webp',
    width: 512,
    height: 512,
    bytes: 100,
    sourceName: 'perso.webp',
    blob: new Blob(['x'], { type: 'image/webp' }),
    createdAt: '2026-10-05T15:00:00.000Z'
  };

  const surface = materialDefinitionFromUserRecord(
    createUserMaterialRecord({ ...base, kind: 'surface' })
  );
  const path = materialDefinitionFromUserRecord(
    createUserMaterialRecord({ ...base, idToken: 'two', kind: 'path' })
  );
  const water = materialDefinitionFromUserRecord(
    createUserMaterialRecord({ ...base, idToken: 'three', kind: 'water' })
  );

  assert.equal(surface.kind, 'surface');
  assert.equal(surface.assets.base, 'user.texture.surface.one');
  assert.equal(path.kind, 'path');
  assert.equal(path.assets.center, 'user.texture.path.two');
  assert.equal(water.kind, 'water');
  assert.equal(water.assets.center, 'user.texture.water.three');
});

test('user materials are composed into one pack without mutating the native pack', () => {
  const nativePack = Object.freeze({
    schemaVersion: 1,
    id: 'native',
    surfaceTransition: Object.freeze({ mode: 'none' }),
    materials: Object.freeze([
      Object.freeze({
        id: 'native.surface',
        kind: 'surface',
        label: 'Native',
        assets: Object.freeze({ base: null }),
        render: Object.freeze({ baseColor: '#000' })
      })
    ]),
    transitions: Object.freeze([]),
    decals: Object.freeze([])
  });

  const record = createUserMaterialRecord({
    idToken: 'custom',
    kind: 'surface',
    label: 'Custom',
    mimeType: 'image/png',
    width: 256,
    height: 256,
    bytes: 1,
    sourceName: 'custom.png',
    blob: new Blob(['x'], { type: 'image/png' }),
    createdAt: '2026-10-05T15:00:00.000Z'
  });

  const composed = composeMaterialPackWithUserMaterials(
    nativePack,
    [record]
  );

  assert.equal(nativePack.materials.length, 1);
  assert.equal(composed.materials.length, 2);
  assert.equal(composed.materials[1].id, record.id);
  assert.equal(composed.surfaceTransition, nativePack.surfaceTransition);
});

test('deletion protection counts every canonical WorldDocument material reference', () => {
  const world = {
    areas: [
      {
        surface: {
          baseMaterialId: 'user.material.surface.base',
          zones: [
            { materialId: 'user.material.surface.paint' }
          ],
          routes: [
            { materialId: 'user.material.path.road' }
          ],
          rivers: [
            { materialId: 'user.material.water.river' }
          ]
        }
      }
    ]
  };

  assert.equal(
    countMaterialReferences(world, 'user.material.surface.base'),
    1
  );
  assert.equal(
    countMaterialReferences(world, 'user.material.surface.paint'),
    1
  );
  assert.equal(
    countMaterialReferences(world, 'user.material.path.road'),
    1
  );
  assert.equal(
    countMaterialReferences(world, 'user.material.water.river'),
    1
  );
  assert.equal(countMaterialReferences(world, 'missing'), 0);
});
