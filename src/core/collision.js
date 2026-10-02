import {
  bridgeTraversalRect,
  buildingFootprintRect
} from '../world/world-object-model.js';

const COLLISION_EPSILON = 1e-6;

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

function orientedLocalPoint(x, y, rect) {
  const dx = x - rect.x;
  const dy = y - rect.y;
  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);

  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos
  };
}

function orientedWorldPoint(localX, localY, rect) {
  const cos = Math.cos(rect.rotation);
  const sin = Math.sin(rect.rotation);

  return {
    x: rect.x + localX * cos - localY * sin,
    y: rect.y + localX * sin + localY * cos
  };
}

export function pointInOrientedRect(x, y, rect) {
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

  const local = orientedLocalPoint(x, y, rect);

  return (
    Math.abs(local.x) <= rect.length / 2 + COLLISION_EPSILON &&
    Math.abs(local.y) <= rect.width / 2 + COLLISION_EPSILON
  );
}

export function circleIntersectsOrientedRect(x, y, radius, rect) {
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

  const local = orientedLocalPoint(x, y, rect);
  const nearestX = clamp(local.x, -rect.length / 2, rect.length / 2);
  const nearestY = clamp(local.y, -rect.width / 2, rect.width / 2);
  const dx = local.x - nearestX;
  const dy = local.y - nearestY;

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

  const local = orientedLocalPoint(x, y, rect);

  return (
    Math.abs(local.x) + radius <=
      rect.length / 2 + COLLISION_EPSILON &&
    Math.abs(local.y) + radius <=
      rect.width / 2 + COLLISION_EPSILON
  );
}

function bridgeAllowsObstacle(world, obstacle, x, y) {
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

    if (pointInOrientedRect(x, y, passage)) {
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

    if (bridgeAllowsObstacle(world, obstacle, x, y)) {
      continue;
    }

    return true;
  }

  for (const object of Array.isArray(world.objects) ? world.objects : []) {
    if (object.kind !== 'building') continue;

    const footprint = buildingFootprintRect(object);

    if (
      footprint &&
      circleIntersectsOrientedRect(
        x,
        y,
        entity.radius,
        footprint
      )
    ) {
      return true;
    }
  }

  return false;
}

export function resolveBridgeGuidedPosition(
  world,
  entity,
  targetX,
  targetY
) {
  for (const object of Array.isArray(world.objects) ? world.objects : []) {
    if (
      object.kind !== 'bridge' ||
      object.traversal?.enabled !== true
    ) {
      continue;
    }

    const passage = bridgeTraversalRect(object);
    if (!passage) continue;

    const touchesReferencedObstacle = world.obstacles.some((obstacle) =>
      object.traversal.overridesObstacleIds.includes(obstacle.id) &&
      circleIntersectsRect(
        targetX,
        targetY,
        entity.radius,
        obstacle
      )
    );

    if (!touchesReferencedObstacle) continue;

    const local = orientedLocalPoint(targetX, targetY, passage);
    const halfLength = passage.length / 2;
    const halfWidth = passage.width / 2;
    const assistMargin =
      passage.width * object.traversal.edgeAssistRatio;

    if (
      Math.abs(local.x) > halfLength + COLLISION_EPSILON ||
      Math.abs(local.y) >
        halfWidth + assistMargin + COLLISION_EPSILON
    ) {
      continue;
    }

    const guided = orientedWorldPoint(
      local.x,
      clamp(local.y, -halfWidth, halfWidth),
      passage
    );

    if (!isBlocked(world, entity, guided.x, guided.y)) {
      return Object.freeze(guided);
    }
  }

  return null;
}
