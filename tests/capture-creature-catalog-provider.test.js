import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCaptureCreatureCatalogProvider,restrictCaptureCatalogToPublishedSpeciesV1
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

test('published-only Capture projection preserves original species records and rarities', () => {
  const source=createCaptureCreatureCatalogProvider(database());
  const filtered=restrictCaptureCatalogToPublishedSpeciesV1(source,['crea_fire_common','crea_water']);
  assert.deepEqual(filtered.listCreatures().map(c=>c.id),['crea_water','crea_fire_common'].sort((a,b)=>
    source.resolveCreature(a).name.localeCompare(source.resolveCreature(b).name,'fr')));
  assert.deepEqual(filtered.listElements().map(e=>e.id),['fire','water']);
  assert.strictEqual(filtered.resolveCreature('crea_fire_common'),source.resolveCreature('crea_fire_common'));
  assert.strictEqual(filtered.resolveCreature('crea_fire_legend'),null,
    'Unpublished author creature must never be selectable in a real game');
  assert.equal(filtered.resolveCreature('crea_fire_common').spawnChance,25);
  assert.deepEqual(filtered.findByElement('fire').map(c=>c.id),['crea_fire_common']);
  assert.deepEqual(filtered.findByElement('water').map(c=>c.id),['crea_water']);
  assert.equal(source.findByElement('fire').length,2,'Author/Test catalogue remains unchanged');
  assert.equal(Object.isFrozen(filtered.listCreatures()),true);
  assert.equal(Object.isFrozen(filtered.findByElement('fire')),true);
});
test('published-only Capture projection fails closed for unknown, duplicate or missing publication IDs', () => {
  const source=createCaptureCreatureCatalogProvider(database());
  for(const ids of [[],['missing'],['crea_fire_common','crea_fire_common'],
                    ['crea_fire_common','unknown'],[''],null,{}]){
    assert.throws(()=>restrictCaptureCatalogToPublishedSpeciesV1(source,ids),
      /publi|Bestiaire|publication/i);
  }
  assert.throws(()=>restrictCaptureCatalogToPublishedSpeciesV1({},['crea_fire_common']),
    /catalog|provider|fournisseur/i);
});
