import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_TERRAIN_FAMILY_DEFINITIONS,
  TERRAIN_FAMILY_IDS,
  createTerrainFamilyRegistry,
  normalizeTerrainFamilyDefinitions
} from '../src/world/terrain-family-registry.js';

test('Terrain Family registry exposes eight presets by default', () => {
  assert.deepEqual(
    TERRAIN_FAMILY_IDS,
    [
      'plain',
      'forest',
      'sea',
      'mountain',
      'volcano',
      'snow',
      'road',
      'sand'
    ]
  );

  assert.equal(
    DEFAULT_TERRAIN_FAMILY_DEFINITIONS.length,
    8
  );
});

test('terrain families are semantic definitions without material ownership', () => {
  const registry =
    createTerrainFamilyRegistry([
      {
        id: 'swamp',
        label: 'Marais',
        materialKind: 'forbidden',
        materialIds: ['forbidden']
      }
    ]);

  assert.deepEqual(
    registry.list(),
    [{ id: 'swamp', label: 'Marais' }]
  );
  assert.equal(
    'materialKind' in registry.require('swamp'),
    false
  );
  assert.equal(
    'materialIds' in registry.require('swamp'),
    false
  );
});

test('custom terrain families are normalized as data and duplicate ids are removed', () => {
  const definitions =
    normalizeTerrainFamilyDefinitions([
      { id: 'swamp', label: 'Marais' },
      { id: 'swamp', label: 'Doublon' },
      { id: 'crystal', label: 'Cristal' }
    ]);

  assert.deepEqual(
    definitions,
    [
      { id: 'swamp', label: 'Marais' },
      { id: 'crystal', label: 'Cristal' }
    ]
  );
});

test('registry never infers gameplay family from a material id', () => {
  const registry =
    createTerrainFamilyRegistry();

  assert.equal(
    Object.hasOwn(
      registry,
      'familyFromMaterialId'
    ),
    false
  );
});
