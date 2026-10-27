import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LIVING_WORLD_SCHEMA_VERSION,
  WILD_CREATURE_ENTITY_SCHEMA_VERSION,
  normalizeLivingWorldConfig,
  createWildCreatureEntity,
  livingWorldReferencesAreValid
} from '../src/living/living-world-model.js';

const world = {
  areas: [
    { id: 'forest-exterior' },
    { id: 'cave-01' }
  ]
};

test('living world config normalizes gameplay spawn zones independently from surface materials', () => {
  const config = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'forest-north',
        areaId: 'forest-exterior',
        x: 500,
        y: 320,
        radius: 240,
        biomeId: 'biome.forest',
        tags: ['forest', 'wild', 'forest'],
        materialId: 'grass.forest'
      }
    ],
    spawnRules: []
  });

  assert.equal(config.schemaVersion, LIVING_WORLD_SCHEMA_VERSION);
  assert.equal(config.spawnZones.length, 1);
  assert.deepEqual(config.spawnZones[0], {
    id: 'forest-north',
    areaId: 'forest-exterior',
    kind: 'circle',
    x: 500,
    y: 320,
    radius: 240,
    biomeId: 'biome.forest',
    tags: ['forest', 'wild']
  });
  assert.equal('materialId' in config.spawnZones[0], false);
});

test('spawn rules reference an actor definition and never copy actor profile data', () => {
  const config = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'forest-north',
        areaId: 'forest-exterior',
        x: 500,
        y: 320,
        radius: 240
      }
    ],
    spawnRules: [
      {
        id: 'wolves',
        zoneId: 'forest-north',
        actorDefinitionId: 'capture.creature.wolf',
        maxActive: 3,
        weight: 2,
        assetId: 'forbidden.asset',
        stats: { hp: 999 },
        mapVisual: { assetId: 'forbidden.visual' },
        locomotion: { modes: ['fly'] }
      }
    ]
  });

  assert.equal(config.spawnRules.length, 1);
  assert.deepEqual(config.spawnRules[0], {
    id: 'wolves',
    zoneId: 'forest-north',
    actorDefinitionId: 'capture.creature.wolf',
    maxActive: 3,
    weight: 2
  });

  for (const forbidden of [
    'assetId',
    'stats',
    'mapVisual',
    'locomotion'
  ]) {
    assert.equal(forbidden in config.spawnRules[0], false);
  }
});

test('invalid or duplicate zone/rule ids are rejected deterministically', () => {
  const config = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'zone-a',
        areaId: 'forest-exterior',
        x: 1,
        y: 2,
        radius: 100
      },
      {
        id: 'zone-a',
        areaId: 'cave-01',
        x: 3,
        y: 4,
        radius: 100
      },
      {
        id: '',
        areaId: 'forest-exterior'
      }
    ],
    spawnRules: [
      {
        id: 'rule-a',
        zoneId: 'zone-a',
        actorDefinitionId: 'capture.creature.a'
      },
      {
        id: 'rule-a',
        zoneId: 'zone-a',
        actorDefinitionId: 'capture.creature.b'
      },
      {
        id: 'missing-zone',
        zoneId: 'nope',
        actorDefinitionId: 'capture.creature.c'
      },
      {
        id: 'missing-actor',
        zoneId: 'zone-a'
      }
    ]
  });

  assert.equal(config.spawnZones.length, 1);
  assert.equal(config.spawnRules.length, 1);
  assert.equal(config.spawnZones[0].areaId, 'forest-exterior');
  assert.equal(config.spawnRules[0].actorDefinitionId, 'capture.creature.a');
});

test('living world references validate against WorldArea ids, not materials', () => {
  const valid = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'forest-zone',
        areaId: 'forest-exterior',
        x: 50,
        y: 60,
        radius: 80
      }
    ],
    spawnRules: [
      {
        id: 'forest-rule',
        zoneId: 'forest-zone',
        actorDefinitionId: 'capture.creature.wolf'
      }
    ]
  });

  const invalid = normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'unknown-zone',
        areaId: 'missing-area',
        x: 50,
        y: 60,
        radius: 80
      }
    ],
    spawnRules: []
  });

  assert.equal(livingWorldReferencesAreValid(world, valid), true);
  assert.equal(livingWorldReferencesAreValid(world, invalid), false);
});

test('wild creature runtime entity owns only living-world presence state', () => {
  const entity = createWildCreatureEntity({
    id: 'wild-1',
    actorDefinitionId: 'capture.creature.wolf',
    areaId: 'forest-exterior',
    x: 640,
    y: 420,
    homeZoneId: 'forest-north',
    facingX: -1,
    moving: true,
    stats: { hp: 100 },
    mapVisual: { assetId: 'nope' },
    locomotion: { modes: ['fly'] }
  });

  assert.equal(entity.schemaVersion, WILD_CREATURE_ENTITY_SCHEMA_VERSION);
  assert.deepEqual(entity, {
    schemaVersion: WILD_CREATURE_ENTITY_SCHEMA_VERSION,
    id: 'wild-1',
    actorDefinitionId: 'capture.creature.wolf',
    areaId: 'forest-exterior',
    x: 640,
    y: 420,
    homeZoneId: 'forest-north',
    facingX: -1,
    moving: true
  });
  assert.equal('stats' in entity, false);
  assert.equal('mapVisual' in entity, false);
  assert.equal('locomotion' in entity, false);
});
