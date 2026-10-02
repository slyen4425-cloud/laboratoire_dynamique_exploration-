import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isBlocked
} from '../src/core/collision.js';
import {
  normalizeWorldObjects
} from '../src/world/world-object-model.js';
import { stepMovement } from '../src/core/movement.js';

function canonicalRiverWorld({
  objects = []
} = {}) {
  return {
    width: 600,
    height: 600,
    surface: {
      rivers: [
        {
          id: 'river-canonical',
          width: 80,
          materialId: 'water.forest_stream',
          points: [
            { x: 100, y: 250 },
            { x: 500, y: 250 }
          ]
        }
      ]
    },
    objects,
    obstacles: []
  };
}

test('regression: canonical WorldSurface river blocks movement without duplicate obstacle geometry', () => {
  const world = canonicalRiverWorld();
  const entity = { radius: 18 };

  assert.equal(
    isBlocked(world, entity, 300, 250),
    true,
    'river geometry itself must be blocking'
  );

  assert.equal(
    isBlocked(world, entity, 300, 150),
    false,
    'dry ground must stay traversable'
  );
});

test('regression: Bridge traversal overrides the canonical river id without a duplicate river obstacle', () => {
  const bridge = normalizeWorldObjects([
    {
      id: 'bridge-canonical-river',
      kind: 'bridge',
      transform: {
        x: 300,
        y: 250,
        rotationDeg: 90,
        scaleX: 1,
        scaleY: 1
      },
      baseSize: {
        length: 180,
        width: 100
      },
      traversal: {
        enabled: true,
        lengthRatio: 1,
        widthRatio: 0.9,
        edgeAssistRatio: 0.15,
        overridesObstacleIds: ['river-canonical']
      }
    }
  ])[0];

  const world = canonicalRiverWorld({
    objects: [bridge]
  });
  const entity = {
    x: 300,
    y: 170,
    radius: 18
  };

  for (let step = 0; step < 18; step += 1) {
    stepMovement(
      world,
      entity,
      { x: 0, y: 1 },
      0.1,
      { maxSpeed: 100 }
    );
  }

  assert.ok(
    entity.y > 300,
    `expected bridge to cross canonical river, stopped at y=${entity.y}`
  );
});

test('regression: a Builder-style wide river remains blocking across its configured width', () => {
  const world = {
    width: 2400,
    height: 1600,
    surface: {
      rivers: [
        {
          id: 'builder-wide-water',
          width: 600,
          materialId: 'water.forest_stream',
          points: [
            { x: 300, y: 800 },
            { x: 2100, y: 800 }
          ]
        }
      ]
    },
    objects: [],
    obstacles: []
  };
  const entity = { radius: 18 };

  assert.equal(isBlocked(world, entity, 1200, 800), true);
  assert.equal(isBlocked(world, entity, 1200, 480), false);
});
