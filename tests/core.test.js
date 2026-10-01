import test from 'node:test';
import assert from 'node:assert/strict';

import { normalize } from '../src/core/vector.js';
import { circleIntersectsRect, isBlocked } from '../src/core/collision.js';
import { stepMovement } from '../src/core/movement.js';

test('normalize removes diagonal speed boost', () => {
  const result = normalize(1, 1);
  assert.ok(Math.abs(Math.hypot(result.x, result.y) - 1) < 1e-12);
});

test('circle collision detects an obstacle', () => {
  const rect = { x: 100, y: 100, w: 80, h: 80 };
  assert.equal(circleIntersectsRect(90, 140, 20, rect), true);
  assert.equal(circleIntersectsRect(50, 50, 10, rect), false);
});

test('world bounds are blocking', () => {
  const world = { width: 500, height: 500, obstacles: [] };
  const entity = { radius: 10 };
  assert.equal(isBlocked(world, entity, 5, 100), true);
  assert.equal(isBlocked(world, entity, 100, 100), false);
});

test('movement reaches obstacle tangent without penetrating it', () => {
  const world = {
    width: 500,
    height: 500,
    obstacles: [{ x: 120, y: 80, w: 50, h: 80 }]
  };
  const entity = { x: 90, y: 120, radius: 10, speed: 100 };

  stepMovement(world, entity, { x: 1, y: 0 }, 0.1);
  assert.equal(entity.x, 100);

  stepMovement(world, entity, { x: 1, y: 0 }, 0.1);
  assert.equal(entity.x, 110);

  stepMovement(world, entity, { x: 1, y: 0 }, 0.1);
  assert.equal(entity.x, 110);

  stepMovement(world, entity, { x: 0, y: 1 }, 0.1);
  assert.equal(entity.y, 130);
});
