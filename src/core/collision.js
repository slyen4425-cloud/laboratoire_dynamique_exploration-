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

function squaredDistancePointToSegment(px, py, a, b) {
  const abX = b.x - a.x;
  const abY = b.y - a.y;
  const lengthSquared = abX * abX + abY * abY;

  if (lengthSquared <= COLLISION_EPSILON) {
    const dx = px - a.x;
    const dy = py - a.y;
    return dx * dx + dy * dy;
  }

  const apX = px - a.x;
  const apY = py - a.y;
  const t = clamp(
    (apX * abX + apY * abY) / lengthSquared,
    0,
    1
  );
  const nearestX = a.x + abX * t;
  const nearestY = a.y + abY * t;
  const dx = px - nearestX;
  const dy = py - nearestY;

  return dx * dx + dy * dy;
}

export function circleIntersectsStroke(
  x,
  y,
  radius,
  stroke
) {
  if (
    !stroke ||
    !Number.isFinite(stroke.width) ||
    stroke.width <= 0 ||
    !Array.isArray(stroke.points) ||
    stroke.points.length < 2
  ) {
    return false;
  }

  const effectiveRadius = radius + stroke.width / 2;
  const maxDistanceSquared =
    effectiveRadius * effectiveRadius;

  for (let index = 1; index < stroke.points.length; index += 1) {
    const a = stroke.points[index - 1];
    const b = stroke.points[index];

    if (
      squaredDistancePointToSegment(x, y, a, b) <
      maxDistanceSquared
    ) {
      return true;
    }
  }

  return false;
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

function worldRivers(world) {
  return Array.isArray(world?.surface?.rivers)
    ? world.surface.rivers
    : [];
}

function bridgeAllowsBlocker(world, blockerId, x, y) {
  if (!blockerId) return false;

  for (const object of Array.isArray(world.objects) ? world.objects : []) {
    if (
      object.kind !== 'bridge' ||
      object.traversal?.enabled !== true ||
      !object.traversal.overridesObstacleIds.includes(blockerId)
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

function touchesReferencedBridgeBlocker(
  world,
  bridge,
  entity,
  x,
  y
) {
  const ids = bridge.traversal.overridesObstacleIds;

  const touchesObstacle = (
    Array.isArray(world.obstacles) ? world.obstacles : []
  ).some((obstacle) =>
    ids.includes(obstacle.id) &&
    circleIntersectsRect(
      x,
      y,
      entity.radius,
      obstacle
    )
  );

  if (touchesObstacle) return true;

  return worldRivers(world).some((river) =>
    ids.includes(river.id) &&
    circleIntersectsStroke(
      x,
      y,
      entity.radius,
      river
    )
  );
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

  // River geometry is canonical in WorldSurface. Collision World reads that
  // geometry directly; there is no duplicate river collision rectangle.
  for (const river of worldRivers(world)) {
    if (
      !circleIntersectsStroke(
        x,
        y,
        entity.radius,
        river
      )
    ) {
      continue;
    }

    if (bridgeAllowsBlocker(world, river.id, x, y)) {
      continue;
    }

    return true;
  }

  for (const obstacle of Array.isArray(world.obstacles) ? world.obstacles : []) {
    if (!circleIntersectsRect(x, y, entity.radius, obstacle)) {
      continue;
    }

    if (bridgeAllowsBlocker(world, obstacle.id, x, y)) {
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

    if (
      !touchesReferencedBridgeBlocker(
        world,
        object,
        entity,
        targetX,
        targetY
      )
    ) {
      continue;
    }

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
