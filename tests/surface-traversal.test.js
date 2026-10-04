import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeWorldSurface } from '../src/world/surface-model.js';
import { normalizeWorldObjectPlacements } from '../src/world/world-object-placement-model.js';
import {
  createTraversalRuleRegistry,
  normalizeLocomotionProfile,
  resolveSurfaceTraversal
} from '../src/core/surface-traversal.js';
import { traversalRulePackV1 } from '../src/core/traversal-rule-pack-v1.js';
import { isBlocked } from '../src/core/collision.js';
import { stepMovement } from '../src/core/movement.js';

function makeWorld() {
  return {
    width: 800,
    height: 600,
    surface: normalizeWorldSurface({
      baseMaterialId: 'grass.forest',
      baseTraversalRuleId: 'terrain.ground',
      routes: [
        {
          id: 'road-1',
          width: 80,
          materialId: 'road.dirt',
          traversalRuleId: 'terrain.road',
          points: [
            { x: 50, y: 200 },
            { x: 750, y: 200 }
          ]
        }
      ],
      rivers: [
        {
          id: 'river-1',
          width: 80,
          materialId: 'water.forest_stream',
          traversalRuleId: 'terrain.water',
          points: [
            { x: 400, y: 50 },
            { x: 400, y: 550 }
          ]
        }
      ]
    }),
    objects: normalizeWorldObjectPlacements([
      {
        id: 'bridge-1',
        objectDefinitionId:
          'objectdef.bridge.wood.rustic_bank.01',
        transform: {
          x: 400,
          y: 200,
          rotationDeg: 90,
          scaleX: 1,
          scaleY: 1
        },
        overrides: {
          traversalSurfaceFeatureIds: [
            'river-1'
          ]
        }
      }
    ]),
    obstacles: []
  };
}

test('Surface schema v3 keeps traversal ids separate from visual material ids', () => {
  const surface = normalizeWorldSurface({
    baseMaterialId: 'visual.base.custom',
    baseTraversalRuleId: 'terrain.ground',
    routes: [
      {
        id: 'r',
        width: 70,
        materialId: 'visual.road.custom',
        traversalRuleId: 'terrain.road',
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      }
    ],
    rivers: [
      {
        id: 'w',
        width: 60,
        materialId: 'visual.water.custom',
        traversalRuleId: 'terrain.water',
        points: [{ x: 0, y: 50 }, { x: 100, y: 50 }]
      }
    ]
  });

  assert.equal(surface.version, 3);
  assert.equal(surface.baseMaterialId, 'visual.base.custom');
  assert.equal(surface.baseTraversalRuleId, 'terrain.ground');
  assert.equal(surface.routes[0].materialId, 'visual.road.custom');
  assert.equal(surface.routes[0].traversalRuleId, 'terrain.road');
  assert.equal(surface.rivers[0].materialId, 'visual.water.custom');
  assert.equal(surface.rivers[0].traversalRuleId, 'terrain.water');
});

test('Traversal Rule Registry keeps configurable multipliers out of movement engine', () => {
  const registry = createTraversalRuleRegistry(traversalRulePackV1);

  assert.equal(registry.require('terrain.ground').modes.ground, 1);
  assert.equal(registry.require('terrain.road').modes.ground, 1.25);
  assert.equal(registry.require('terrain.water').modes.swim, 0.75);
  assert.equal(registry.require('terrain.water').modes.fly, 1);
  assert.equal(registry.require('terrain.water').modes.ground, undefined);
});

test('locomotion profile is shared and defaults to ground', () => {
  assert.deepEqual(normalizeLocomotionProfile(), { modes: ['ground'] });
  assert.deepEqual(
    normalizeLocomotionProfile({ modes: ['fly', 'swim', 'fly', 'invalid'] }),
    { modes: ['fly', 'swim'] }
  );
});

test('ground actor is faster on road', () => {
  const world = makeWorld();
  const registry = createTraversalRuleRegistry(traversalRulePackV1);
  const ground = { x: 100, y: 200, radius: 10, locomotion: { modes: ['ground'] } };

  const result = resolveSurfaceTraversal(
    world,
    ground,
    ground.x,
    ground.y,
    registry
  );

  assert.equal(result.featureId, 'road-1');
  assert.equal(result.ruleId, 'terrain.road');
  assert.equal(result.passable, true);
  assert.equal(result.mode, 'ground');
  assert.equal(result.speedMultiplier, 1.25);
});

test('ground actor cannot enter water outside bridge', () => {
  const world = makeWorld();
  const registry = createTraversalRuleRegistry(traversalRulePackV1);
  const ground = {
    x: 300,
    y: 400,
    radius: 10,
    locomotion: { modes: ['ground'] }
  };

  assert.equal(
    isBlocked(world, ground, 400, 400, registry),
    true
  );
});

test('swim and fly profiles can traverse water with their configured speeds', () => {
  const world = makeWorld();
  const registry = createTraversalRuleRegistry(traversalRulePackV1);

  const swimmer = {
    radius: 10,
    locomotion: { modes: ['ground', 'swim'] }
  };
  const flyer = {
    radius: 10,
    locomotion: { modes: ['fly'] }
  };

  const swim = resolveSurfaceTraversal(world, swimmer, 400, 400, registry);
  const fly = resolveSurfaceTraversal(world, flyer, 400, 400, registry);

  assert.equal(swim.passable, true);
  assert.equal(swim.mode, 'swim');
  assert.equal(swim.speedMultiplier, 0.75);

  assert.equal(fly.passable, true);
  assert.equal(fly.mode, 'fly');
  assert.equal(fly.speedMultiplier, 1);
});

test('bridge corridor overrides only its explicitly referenced water feature', () => {
  const world = makeWorld();
  const registry = createTraversalRuleRegistry(traversalRulePackV1);
  const ground = {
    radius: 10,
    locomotion: { modes: ['ground'] }
  };

  const bridge = resolveSurfaceTraversal(world, ground, 400, 200, registry);
  const water = resolveSurfaceTraversal(world, ground, 400, 400, registry);

  assert.equal(bridge.ruleId, 'terrain.bridge');
  assert.equal(bridge.passable, true);
  assert.equal(water.ruleId, 'terrain.water');
  assert.equal(water.passable, false);
});

test('real movement applies road speed multiplier without changing movement API semantics', () => {
  const registry = createTraversalRuleRegistry(traversalRulePackV1);

  const normalWorld = {
    width: 1000,
    height: 1000,
    surface: normalizeWorldSurface({
      baseTraversalRuleId: 'terrain.ground'
    }),
    objects: [],
    obstacles: []
  };

  const roadWorld = {
    width: 1000,
    height: 1000,
    surface: normalizeWorldSurface({
      baseTraversalRuleId: 'terrain.ground',
      routes: [
        {
          id: 'road-speed',
          width: 100,
          traversalRuleId: 'terrain.road',
          points: [{ x: 0, y: 200 }, { x: 1000, y: 200 }]
        }
      ]
    }),
    objects: [],
    obstacles: []
  };

  const normal = {
    x: 100,
    y: 100,
    radius: 10,
    locomotion: { modes: ['ground'] }
  };
  const road = {
    x: 100,
    y: 200,
    radius: 10,
    locomotion: { modes: ['ground'] }
  };

  stepMovement(normalWorld, normal, { x: 1, y: 0 }, 1, { maxSpeed: 100 }, registry);
  stepMovement(roadWorld, road, { x: 1, y: 0 }, 1, { maxSpeed: 100 }, registry);

  assert.equal(normal.x, 200);
  assert.equal(road.x, 225);
});

test('bridge placement normalizes local surface override ids without duplicate fields', () => {
  const bridge =
    normalizeWorldObjectPlacements([
      {
        objectDefinitionId:
          'objectdef.bridge.wood.rustic_bank.01',
        overrides: {
          traversalSurfaceFeatureIds: [
            'river-1',
            'river-1',
            ' river-2 '
          ]
        }
      }
    ])[0];

  assert.deepEqual(
    bridge.overrides
      .traversalSurfaceFeatureIds,
    ['river-1', 'river-2']
  );
  assert.equal(
    'traversal' in bridge,
    false
  );
});


test('Surface schema v3 preserves Builder terrain zones without giving them traversal authority', () => {
  const surface = normalizeWorldSurface({
    baseMaterialId: 'grass.forest',
    baseTraversalRuleId: 'terrain.ground',
    zones: [
      {
        id: 'painted-zone-1',
        width: 180,
        materialId: 'ground.snow',
        points: [
          { x: 100, y: 100 },
          { x: 180, y: 160 }
        ]
      }
    ]
  });

  assert.equal(surface.version, 3);
  assert.equal(surface.zones.length, 1);
  assert.equal(surface.zones[0].id, 'painted-zone-1');
  assert.equal(surface.zones[0].materialId, 'ground.snow');
  assert.equal(
    Object.hasOwn(surface.zones[0], 'traversalRuleId'),
    false
  );
});
