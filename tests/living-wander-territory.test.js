import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeLivingWorldConfig,
  createWildCreatureEntity
} from '../src/living/living-world-model.js';
import {
  planWildWanderTarget,
  advanceWildCreatureTowardTarget
} from '../src/living/wander-planner.js';
import {
  createWildWanderController
} from '../src/living/living-runtime.js';
import {
  normalizeMapActorVisual
} from '../src/actors/map-actor-visual-model.js';
import { demoWorldDocument } from '../src/world/demo-world.js';

function definition(id, modes) {
  return Object.freeze({
    id,
    mapVisual: normalizeMapActorVisual({
      assetId: 'actor.demo.hero.traveler.01',
      role: 'creature'
    }),
    exploration: Object.freeze({
      radius: 10,
      maxSpeed: 70,
      locomotion: Object.freeze({
        modes: Object.freeze([...modes])
      })
    })
  });
}

const groundDefinition = definition(
  'capture.creature.ground',
  ['ground']
);
const swimDefinition = definition(
  'capture.creature.swim',
  ['swim']
);
const flyDefinition = definition(
  'capture.creature.fly',
  ['fly']
);

function configWithZones() {
  return normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'ground-zone',
        areaId: 'forest-exterior',
        x: 320,
        y: 520,
        radius: 60
      },
      {
        id: 'water-zone',
        areaId: 'forest-exterior',
        x: 1320,
        y: 795,
        radius: 18
      }
    ],
    spawnRules: []
  });
}

test('wander target is deterministic and stays inside the creature home zone', () => {
  const config = configWithZones();
  const entity = createWildCreatureEntity({
    id: 'wild-ground-1',
    actorDefinitionId: groundDefinition.id,
    areaId: 'forest-exterior',
    x: 320,
    y: 520,
    homeZoneId: 'ground-zone'
  });

  const first = planWildWanderTarget(config, entity, {
    seed: 'world-42',
    wanderIndex: 3,
    canOccupy: () => true
  });
  const second = planWildWanderTarget(config, entity, {
    seed: 'world-42',
    wanderIndex: 3,
    canOccupy: () => true
  });

  assert.deepEqual(second, first);

  const zone = config.spawnZones.find(
    (item) => item.id === entity.homeZoneId
  );
  const distance = Math.hypot(
    first.x - zone.x,
    first.y - zone.y
  );

  assert.ok(distance <= zone.radius + 1e-9);
  assert.equal(first.areaId, entity.areaId);
});

test('wander planner uses injected passability and stops after bounded attempts', () => {
  const config = configWithZones();
  const entity = createWildCreatureEntity({
    id: 'wild-swim-1',
    actorDefinitionId: swimDefinition.id,
    areaId: 'forest-exterior',
    x: 1320,
    y: 795,
    homeZoneId: 'water-zone'
  });
  let calls = 0;

  const target = planWildWanderTarget(config, entity, {
    seed: 'water',
    wanderIndex: 0,
    maxAttempts: 5,
    canOccupy(candidate) {
      calls += 1;
      return calls === 4;
    }
  });

  assert.ok(target);
  assert.equal(calls, 4);

  const rejected = planWildWanderTarget(config, entity, {
    seed: 'blocked',
    wanderIndex: 0,
    maxAttempts: 3,
    canOccupy: () => false
  });

  assert.equal(rejected, null);
});

test('ground, swim and fly locomotion stay owned by Actor Definition', () => {
  assert.deepEqual(
    groundDefinition.exploration.locomotion,
    { modes: ['ground'] }
  );
  assert.deepEqual(
    swimDefinition.exploration.locomotion,
    { modes: ['swim'] }
  );
  assert.deepEqual(
    flyDefinition.exploration.locomotion,
    { modes: ['fly'] }
  );

  const entity = createWildCreatureEntity({
    id: 'wild-swim-1',
    actorDefinitionId: swimDefinition.id,
    areaId: 'forest-exterior',
    x: 1320,
    y: 795,
    homeZoneId: 'water-zone',
    locomotion: { modes: ['ground'] }
  });

  assert.equal('locomotion' in entity, false);
});

test('aquatic creature moves in water through canonical movement/traversal and cannot walk onto ground', () => {
  const area = demoWorldDocument.areas.find(
    (item) => item.id === 'forest-exterior'
  );
  const entity = createWildCreatureEntity({
    id: 'wild-swim-1',
    actorDefinitionId: swimDefinition.id,
    areaId: area.id,
    x: 1320,
    y: 795,
    homeZoneId: 'water-zone'
  });

  const moved = advanceWildCreatureTowardTarget(
    entity,
    swimDefinition,
    area,
    { x: 1340, y: 795 },
    0.2
  );

  assert.ok(moved.x > entity.x);
  assert.equal(moved.moving, true);

  const beforeGroundAttempt = moved;
  const groundAttempt = advanceWildCreatureTowardTarget(
    beforeGroundAttempt,
    swimDefinition,
    area,
    { x: 1320, y: 700 },
    1
  );

  assert.ok(
    groundAttempt.y >= 770,
    'swim-only creature must not leave the water onto ground'
  );
});

test('wild advancement never copies visual or locomotion profile into the runtime entity', () => {
  const area = demoWorldDocument.areas.find(
    (item) => item.id === 'forest-exterior'
  );
  const entity = createWildCreatureEntity({
    id: 'wild-fly-1',
    actorDefinitionId: flyDefinition.id,
    areaId: area.id,
    x: 1035,
    y: 795,
    homeZoneId: 'water-zone'
  });

  const next = advanceWildCreatureTowardTarget(
    entity,
    flyDefinition,
    area,
    { x: 1050, y: 795 },
    0.1
  );

  assert.equal('mapVisual' in next, false);
  assert.equal('locomotion' in next, false);
  assert.equal('stats' in next, false);
  assert.equal(next.actorDefinitionId, entity.actorDefinitionId);
});


test('wander runtime never lets an entity leave its home territory', () => {
  const config = configWithZones();
  const fastGroundDefinition = Object.freeze({
    ...groundDefinition,
    exploration: Object.freeze({
      ...groundDefinition.exploration,
      maxSpeed: 500
    })
  });
  const definitions = new Map([
    [fastGroundDefinition.id, fastGroundDefinition]
  ]);
  const controller = createWildWanderController(
    config,
    {
      worldDocument: demoWorldDocument,
      resolveActorDefinition: (id) =>
        definitions.get(id) ?? null,
      seed: 'territory-boundary'
    }
  );

  let entities = Object.freeze([
    createWildCreatureEntity({
      id: 'wild-fast-ground',
      actorDefinitionId: fastGroundDefinition.id,
      areaId: 'forest-exterior',
      x: 320,
      y: 520,
      homeZoneId: 'ground-zone'
    })
  ]);

  for (let step = 0; step < 12; step += 1) {
    entities = controller.step(entities, 1);
    const entity = entities[0];
    const distance = Math.hypot(
      entity.x - 320,
      entity.y - 520
    );

    assert.ok(
      distance <= 60 + 1e-9,
      `entity escaped territory at step ${step}: ${distance}`
    );
  }
});
