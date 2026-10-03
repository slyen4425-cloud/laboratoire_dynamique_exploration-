import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCaptureCreatureCatalogProvider
} from '../src/capture/capture-creature-catalog-provider.js';

function database() {
  return {
    schema: 'capture-database-v1',
    version: 1,
    creatures: [
      {
        draft: {
          id: 'crea_fire_common',
          displayName: 'Feu commun',
          elements: ['fire'],
          capture: {
            spawnChance: 25
          },
          presentation: null
        }
      },
      {
        draft: {
          id: 'crea_fire_legend',
          displayName: 'Feu légendaire',
          elements: ['fire'],
          capture: {
            spawnChance: 0.5
          },
          presentation: null
        }
      },
      {
        draft: {
          id: 'crea_water',
          displayName: 'Eau',
          elements: ['water'],
          capture: {
            spawnChance: 10
          },
          presentation: null
        }
      }
    ]
  };
}

test('Capture provider reads elements and intrinsic spawnChance from CaptureDatabaseV1', () => {
  const provider = createCaptureCreatureCatalogProvider(database());

  assert.equal(
    provider.resolveCreature('crea_fire_common').spawnChance,
    25
  );
  assert.equal(
    provider.resolveCreature('crea_fire_legend').spawnChance,
    0.5
  );
  assert.deepEqual(
    provider.findByElement('fire').map((entry) => entry.id),
    ['crea_fire_common', 'crea_fire_legend']
  );
});

test('Capture provider never invents rarity when spawnChance is absent', () => {
  const provider = createCaptureCreatureCatalogProvider({
    schema: 'capture-database-v1',
    version: 1,
    creatures: [
      {
        draft: {
          id: 'crea_unknown',
          displayName: 'Sans chance',
          elements: ['earth'],
          capture: {},
          presentation: null
        }
      }
    ]
  });

  assert.equal(
    provider.resolveCreature('crea_unknown').spawnChance,
    0
  );
});

test('Capture provider exposes only element ids actually declared by creatures', () => {
  const provider = createCaptureCreatureCatalogProvider(database());

  assert.deepEqual(
    provider.listElements().map((entry) => entry.id),
    ['fire', 'water']
  );
});
