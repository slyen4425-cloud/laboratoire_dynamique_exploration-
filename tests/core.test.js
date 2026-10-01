import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeExplorationConfig } from '../src/core/config.js';
import { normalize } from '../src/core/vector.js';
import { circleIntersectsRect, isBlocked } from '../src/core/collision.js';
import { stepMovement } from '../src/core/movement.js';

test('exploration config exposes the validated Phase 0 defaults', () => {
  const config = normalizeExplorationConfig();

  assert.equal(config.schemaVersion, 1);
  assert.equal(config.player.radius, 18);
  assert.equal(config.movement.maxSpeed, 230);
  assert.equal(config.input.deadzone, 0.05);
  assert.equal(config.simulation.maxDeltaSeconds, 0.033);
  assert.equal(config.render.terrainTileSize, 96);
});

test('custom exploration config wins over defaults', () => {
  const config = normalizeExplorationConfig({
    player: { radius: 24 },
    movement: { maxSpeed: 310 },
    input: { deadzone: 0.12 },
    simulation: { maxDeltaSeconds: 0.02 },
    render: { terrainTileSize: 144 }
  });

  assert.equal(config.player.radius, 24);
  assert.equal(config.movement.maxSpeed, 310);
  assert.equal(config.input.deadzone, 0.12);
  assert.equal(config.simulation.maxDeltaSeconds, 0.02);
  assert.equal(config.render.terrainTileSize, 144);
});

test('invalid exploration config falls back safely', () => {
  const config = normalizeExplorationConfig({
    player: { radius: 0 },
    movement: { maxSpeed: -1 },
    input: { deadzone: 2 },
    simulation: { maxDeltaSeconds: 1 },
    render: { terrainTileSize: 12 }
  });

  assert.equal(config.player.radius, 18);
  assert.equal(config.movement.maxSpeed, 230);
  assert.equal(config.input.deadzone, 0.05);
  assert.equal(config.simulation.maxDeltaSeconds, 0.033);
  assert.equal(config.render.terrainTileSize, 96);
});

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

test('movement uses injected speed and reaches obstacle tangent without penetration', () => {
  const world = {
    width: 500,
    height: 500,
    obstacles: [{ x: 120, y: 80, w: 50, h: 80 }]
  };
  const entity = { x: 90, y: 120, radius: 10 };
  const movementConfig = { maxSpeed: 100 };

  stepMovement(world, entity, { x: 1, y: 0 }, 0.1, movementConfig);
  assert.equal(entity.x, 100);

  stepMovement(world, entity, { x: 1, y: 0 }, 0.1, movementConfig);
  assert.equal(entity.x, 110);

  stepMovement(world, entity, { x: 1, y: 0 }, 0.1, movementConfig);
  assert.equal(entity.x, 110);

  stepMovement(world, entity, { x: 0, y: 1 }, 0.1, movementConfig);
  assert.equal(entity.y, 130);
});

test('custom movement speed changes distance without changing core logic', () => {
  const world = { width: 1000, height: 1000, obstacles: [] };
  const entity = { x: 100, y: 100, radius: 10 };

  stepMovement(
    world,
    entity,
    { x: 1, y: 0 },
    0.5,
    { maxSpeed: 300 }
  );

  assert.equal(entity.x, 250);
  assert.equal(entity.y, 100);
});
