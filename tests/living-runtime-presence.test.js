import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeLivingWorldConfig
} from '../src/living/living-world-model.js';
import {
  createInitialWildlife,
  createWildMapActorView,
  collectLivingMapActorAssetIds
} from '../src/living/living-runtime.js';
import {
  normalizeMapActorVisual
} from '../src/actors/map-actor-visual-model.js';
import { demoWorldDocument } from '../src/world/demo-world.js';

function definition(id, modes = ['ground']) {
  return Object.freeze({
    id,
    mapVisual: normalizeMapActorVisual({
      assetId: 'actor.demo.hero.traveler.01',
      role: 'creature',
      targetHeight: 54
    }),
    exploration: Object.freeze({
      radius: 12,
      locomotion: Object.freeze({
        modes: Object.freeze([...modes])
      })
    })
  });
}

const definitions = new Map([
  ['capture.creature.ground', definition('capture.creature.ground')],
  ['capture.creature.fly', definition('capture.creature.fly', ['fly'])]
]);

const resolveDefinition = (id) => definitions.get(id) ?? null;

test('runtime activation creates minimal wild entities without copying actor profile data', () => {
  const config = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'forest-zone',
        areaId: 'forest-exterior',
        x: 1500,
        y: 1000,
        radius: 120
      }
    ],
    spawnRules: [
      {
        id: 'ground-rule',
        zoneId: 'forest-zone',
        actorDefinitionId: 'capture.creature.ground',
        maxActive: 2,
        weight: 1
      }
    ]
  });

  const entities = createInitialWildlife(config, {
    worldDocument: demoWorldDocument,
    resolveActorDefinition: resolveDefinition,
    seed: 'runtime-presence',
    activationCount: 2,
    collisionCheck: () => false
  });

  assert.equal(entities.length, 2);
  assert.notEqual(entities[0].id, entities[1].id);

  for (const entity of entities) {
    assert.equal(entity.actorDefinitionId, 'capture.creature.ground');
    assert.equal(entity.areaId, 'forest-exterior');
    assert.equal('mapVisual' in entity, false);
    assert.equal('locomotion' in entity, false);
    assert.equal('stats' in entity, false);
  }
});

test('runtime spawn validation receives locomotion from actor definition', () => {
  const config = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'zone',
        areaId: 'forest-exterior',
        x: 700,
        y: 500,
        radius: 30
      }
    ],
    spawnRules: [
      {
        id: 'fly-rule',
        zoneId: 'zone',
        actorDefinitionId: 'capture.creature.fly'
      }
    ]
  });
  let seenProbe = null;

  const entities = createInitialWildlife(config, {
    worldDocument: demoWorldDocument,
    resolveActorDefinition: resolveDefinition,
    activationCount: 1,
    collisionCheck(_area, probe) {
      seenProbe = probe;
      return false;
    }
  });

  assert.equal(entities.length, 1);
  assert.deepEqual(seenProbe.locomotion, { modes: ['fly'] });
  assert.equal(seenProbe.radius, 12);
});

test('actual Collision/Traversal rejects a ground creature spawned entirely inside water', () => {
  const config = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'water-zone',
        areaId: 'forest-exterior',
        x: 1190,
        y: 820,
        radius: 8
      }
    ],
    spawnRules: [
      {
        id: 'ground-water',
        zoneId: 'water-zone',
        actorDefinitionId: 'capture.creature.ground'
      }
    ]
  });

  const entities = createInitialWildlife(config, {
    worldDocument: demoWorldDocument,
    resolveActorDefinition: resolveDefinition,
    seed: 'ground-in-water',
    activationCount: 1
  });

  assert.equal(entities.length, 0);
});

test('actual Collision/Traversal allows a flying creature over the same water zone', () => {
  const config = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'water-zone',
        areaId: 'forest-exterior',
        x: 1190,
        y: 820,
        radius: 8
      }
    ],
    spawnRules: [
      {
        id: 'fly-water',
        zoneId: 'water-zone',
        actorDefinitionId: 'capture.creature.fly'
      }
    ]
  });

  const entities = createInitialWildlife(config, {
    worldDocument: demoWorldDocument,
    resolveActorDefinition: resolveDefinition,
    seed: 'fly-over-water',
    activationCount: 1
  });

  assert.equal(entities.length, 1);
});

test('render view resolves MapActorVisual from actorDefinitionId without mutating entity', () => {
  const entity = Object.freeze({
    schemaVersion: 1,
    id: 'wild-1',
    actorDefinitionId: 'capture.creature.ground',
    areaId: 'forest-exterior',
    x: 300,
    y: 400,
    homeZoneId: 'forest-zone',
    facingX: -1,
    moving: false
  });

  const view = createWildMapActorView(
    entity,
    resolveDefinition
  );

  assert.ok(view.mapVisual);
  assert.equal(view.x, entity.x);
  assert.equal(view.y, entity.y);
  assert.equal('mapVisual' in entity, false);
});

test('required living Map Actor assets are collected through actor definitions', () => {
  const config = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'zone',
        areaId: 'forest-exterior',
        x: 100,
        y: 100,
        radius: 50
      }
    ],
    spawnRules: [
      {
        id: 'a',
        zoneId: 'zone',
        actorDefinitionId: 'capture.creature.ground'
      },
      {
        id: 'b',
        zoneId: 'zone',
        actorDefinitionId: 'capture.creature.fly'
      }
    ]
  });

  assert.deepEqual(
    collectLivingMapActorAssetIds(config, resolveDefinition),
    ['actor.demo.hero.traveler.01']
  );
});
