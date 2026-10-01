import {
  bridgeTraversalRect
} from '../world/world-object-model.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export function circleIntersectsRect(x, y, radius, rect) {
  const nearestX = clamp(x, rect.x, rect.x + rect.w);
  const nearestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

export function circleFitsOrientedRect(x, y, radius, rect) {
  if (
    !rect ||
    !Number.isFinite(rect.x) ||
    !Number.isFinite(rect.y) ||
    !Number.isFinite(rect.rotation) ||
    !Number.isFinite(rect.length) ||
    !Number.isFinite(rect.width) ||
    rect.length <= 0 ||
    rect.width <= 0
  ) {
    return false;
  }

  const dx = x - rect.x;
  const dy = y - rect.y;
  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  return (
    Math.abs(localX) + radius <= rect.length / 2 &&
    Math.abs(localY) + radius <= rect.width / 2
  );
}

function bridgeAllowsObstacle(world, obstacle, x, y, radius) {
  if (!obstacle?.id) return false;

  for (const object of Array.isArray(world.objects) ? world.objects : []) {
    if (
      object.kind !== 'bridge' ||
      object.traversal?.enabled !== true ||
      !object.traversal.overridesObstacleIds.includes(obstacle.id)
    ) {
      continue;
    }

    const passage = bridgeTraversalRect(object);

    if (circleFitsOrientedRect(x, y, radius, passage)) {
      return true;
    }
  }

  return false;
}

export function isBlocked(world, entity, x, y) {
  if (
    x - entity.radius < 0 ||
    y - entity.radius < 0 ||
    x + entity.radius > world.width ||
    y + entity.radius > world.height
  ) {
    return true;
  }

  for (const obstacle of world.obstacles) {
    if (!circleIntersectsRect(x, y, entity.radius, obstacle)) {
      continue;
    }

    if (bridgeAllowsObstacle(world, obstacle, x, y, entity.radius)) {
      continue;
    }

    return true;
  }

  return false;
}
