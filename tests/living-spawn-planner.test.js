import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeLivingWorldConfig
} from '../src/living/living-world-model.js';
import {
  WILD_SPAWN_INTENT_SCHEMA_VERSION,
  selectWeightedSpawnRule,
  planWildSpawnIntent
} from '../src/living/spawn-planner.js';

function makeConfig() {
  return normalizeLivingWorldConfig({
    spawnZones: [
      {
        id: 'forest-a',
        areaId: 'forest-exterior',
        x: 500,
        y: 400,
        radius: 180,
        biomeId: 'biome.forest'
      },
      {
        id: 'forest-b',
        areaId: 'forest-exterior',
        x: 900,
        y: 700,
        radius: 120,
        biomeId: 'biome.forest'
      }
    ],
    spawnRules: [
      {
        id: 'wolves',
        zoneId: 'forest-a',
        actorDefinitionId: 'capture.creature.wolf',
        maxActive: 2,
        weight: 1
      },
      {
        id: 'birds',
        zoneId: 'forest-b',
        actorDefinitionId: 'capture.creature.bird',
        maxActive: 4,
        weight: 3
      }
    ]
  });
}

test('weighted rule selection respects maxActive and deterministic unit value', () => {
  const config = makeConfig();

  const low = selectWeightedSpawnRule(
    config.spawnRules,
    {
      activeCounts: {},
      unitValue: 0
    }
  );
  assert.equal(low?.id, 'wolves');

  const high = selectWeightedSpawnRule(
    config.spawnRules,
    {
      activeCounts: {},
      unitValue: 0.99
    }
  );
  assert.equal(high?.id, 'birds');

  const wolvesFull = selectWeightedSpawnRule(
    config.spawnRules,
    {
      activeCounts: { wolves: 2, birds: 0 },
      unitValue: 0
    }
  );
  assert.equal(wolvesFull?.id, 'birds');

  const allFull = selectWeightedSpawnRule(
    config.spawnRules,
    {
      activeCounts: { wolves: 2, birds: 4 },
      unitValue: 0.4
    }
  );
  assert.equal(allFull, null);
});

test('same seed and activation index produce the same immutable spawn intent', () => {
  const config = makeConfig();

  const first = planWildSpawnIntent(config, {
    seed: 'world-seed-42',
    activationIndex: 7,
    activeCounts: {},
    canSpawn: () => true
  });
  const second = planWildSpawnIntent(config, {
    seed: 'world-seed-42',
    activationIndex: 7,
    activeCounts: {},
    canSpawn: () => true
  });

  assert.deepEqual(second, first);
  assert.equal(first.schemaVersion, WILD_SPAWN_INTENT_SCHEMA_VERSION);
  assert.equal(Object.isFrozen(first), true);
});

test('different activation indexes generate different deterministic candidates', () => {
  const config = makeConfig();

  const a = planWildSpawnIntent(config, {
    seed: 'world-seed-42',
    activationIndex: 1,
    canSpawn: () => true
  });
  const b = planWildSpawnIntent(config, {
    seed: 'world-seed-42',
    activationIndex: 2,
    canSpawn: () => true
  });

  assert.ok(a);
  assert.ok(b);
  assert.notDeepEqual(
    { x: a.x, y: a.y },
    { x: b.x, y: b.y }
  );
});

test('spawn point is always inside its gameplay zone', () => {
  const config = makeConfig();

  for (let activationIndex = 0; activationIndex < 20; activationIndex += 1) {
    const intent = planWildSpawnIntent(config, {
      seed: 'inside-zone',
      activationIndex,
      canSpawn: () => true
    });

    assert.ok(intent);

    const zone = config.spawnZones.find(
      (item) => item.id === intent.zoneId
    );
    const distance = Math.hypot(
      intent.x - zone.x,
      intent.y - zone.y
    );

    assert.ok(distance <= zone.radius + 1e-9);
    assert.equal(intent.areaId, zone.areaId);
  }
});

test('canSpawn is an injected authority and may reject candidates before one is accepted', () => {
  const config = makeConfig();
  let calls = 0;

  const intent = planWildSpawnIntent(config, {
    seed: 'external-passability',
    activationIndex: 0,
    maxAttempts: 5,
    canSpawn(candidate) {
      calls += 1;
      assert.equal('materialId' in candidate, false);
      assert.ok(candidate.actorDefinitionId);
      return calls >= 3;
    }
  });

  assert.ok(intent);
  assert.equal(calls, 3);
});

test('planner stops cleanly after bounded attempts when external passability rejects all candidates', () => {
  const config = makeConfig();
  let calls = 0;

  const intent = planWildSpawnIntent(config, {
    seed: 'blocked-zone',
    activationIndex: 0,
    maxAttempts: 4,
    canSpawn() {
      calls += 1;
      return false;
    }
  });

  assert.equal(intent, null);
  assert.equal(calls, 4);
});
