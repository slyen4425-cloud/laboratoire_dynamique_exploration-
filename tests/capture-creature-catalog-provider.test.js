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

test('native Capture provider restricts wild species to the Combat Bestiary published IDs without rewriting rarity',()=>{
 const original=createCaptureCreatureCatalogProvider(database());
 const gated=createCaptureCreatureCatalogProvider(database(),{
  allowedCreatureIds:['crea_fire_common','crea_water']
 });
 assert.deepEqual(gated.listCreatures().map(c=>c.id),['crea_water','crea_fire_common'],
  'the native provider retains its existing French name sort, not the grant order');
 assert.equal(gated.resolveCreature('crea_fire_legend'),null);
 assert.equal(gated.resolveCreature('crea_fire_common').spawnChance,
  original.resolveCreature('crea_fire_common').spawnChance);
 assert.deepEqual(gated.findByElement('fire').map(x=>x.id),['crea_fire_common']);
 assert.deepEqual(gated.listElements().map(x=>x.id),['fire','water']);
 assert.equal(original.resolveCreature('crea_fire_legend').spawnChance,0.5,
  'standalone native provider source must stay intact');
});

test('native Capture provider fails closed on forged/duplicate/unpublished allowed IDs',()=>{
 for(const ids of [
  ['crea_fake'],['crea_water','crea_water'],['bad/id'],
  'crea_water',null
 ]){
  assert.throws(()=>createCaptureCreatureCatalogProvider(database(),{
   allowedCreatureIds:ids
  }),/allowed|creature|duplicate|published|identif/i);
 }
 const empty=createCaptureCreatureCatalogProvider(database(),{allowedCreatureIds:[]});
 assert.deepEqual(empty.listCreatures(),[]);
 assert.deepEqual(empty.listElements(),[]);
 assert.equal(empty.resolveCreature('crea_water'),null);
});
