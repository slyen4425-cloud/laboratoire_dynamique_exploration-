import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TERRAIN_FAMILY_IDS,
  createTerrainFamilyRegistry
} from '../src/world/terrain-family-registry.js';

test('Terrain Family registry exposes the eight canonical families only', () => {
  assert.deepEqual(TERRAIN_FAMILY_IDS, [
    'plain',
    'forest',
    'sea',
    'mountain',
    'volcano',
    'snow',
    'road',
    'sand'
  ]);
});

test('family is semantic and texture choices are only compatible visuals', () => {
  const registry = createTerrainFamilyRegistry();

  assert.equal(registry.require('forest').label, 'Forêt');
  assert.equal(registry.require('road').materialKind, 'path');
  assert.equal(registry.require('sea').materialKind, 'water');

  assert.ok(
    registry.require('forest').materialIds.includes('grass.forest')
  );
  assert.ok(
    registry.require('sand').materialIds.includes('ground.sand')
  );
  assert.ok(
    registry.require('snow').materialIds.includes('ground.snow')
  );

  // Same visual can temporarily serve multiple semantic families
  // without making materialId the gameplay authority.
  assert.ok(
    registry.require('plain').materialIds.includes('ground.dirt')
  );
  assert.ok(
    registry.require('mountain').materialIds.includes('ground.dirt')
  );
  assert.ok(
    registry.require('volcano').materialIds.includes('ground.dirt')
  );
});

test('registry never infers gameplay family from a material id', () => {
  const registry = createTerrainFamilyRegistry();

  assert.equal(
    Object.hasOwn(registry, 'familyFromMaterialId'),
    false
  );
});
