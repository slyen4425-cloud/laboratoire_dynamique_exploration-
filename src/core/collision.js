import {
  bridgeTraversalRect,
  buildingFootprintRect
} from '../world/world-object-model.js?rev=object-catalog-placement-v1';
import {
  resolveWorldObjectPlacements
} from '../world/world-object-placement-model.js?rev=object-catalog-placement-v1';
import {
  clamp,
  circleFitsOrientedRect,
  circleIntersectsOrientedRect,
  circleIntersectsRect,
  circleIntersectsStroke,
  orientedLocalPoint,
  orientedWorldPoint,
  pointInOrientedRect
} from './geometry.js?rev=surface-traversal-replay-v1';
import {
  circleFitsWorldAreaBoundary
} from '../world/world-area-geometry.js?rev=interior-geometry-authoring-v1-r2';
import {
  defaultTraversalRuleRegistry,
  resolveBaseSurfaceFeature,
  resolveSurfaceTraversal
} from './surface-traversal.js?rev=surface-traversal-replay-v1';

const COLLISION_EPSILON = 1e-6;

export {
  circleFitsOrientedRect,
  circleIntersectsOrientedRect,
  circleIntersectsRect,
  circleIntersectsStroke,
  pointInOrientedRect
};

export function isBlocked(
  world,
  entity,
  x,
  y,
  traversalRegistry = defaultTraversalRuleRegistry
) {
  if (
    !circleFitsWorldAreaBoundary(
      world,
      x,
      y,
      entity.radius
    )
  ) {
    return true;
  }

  for (const obstacle of Array.isArray(world.obstacles) ? world.obstacles : []) {
    if (circleIntersectsRect(x, y, entity.radius, obstacle)) {
      return true;
    }
  }

  for (const object of resolveWorldObjectPlacements(world?.objects ?? [])) {
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

  const traversal = resolveSurfaceTraversal(
    world,
    entity,
    x,
    y,
    traversalRegistry,
    { padding: entity.radius }
  );

  return traversal.passable !== true;
}

export function resolveBridgeGuidedPosition(
  world,
  entity,
  targetX,
  targetY,
  traversalRegistry = defaultTraversalRuleRegistry
) {
  const targetFeature = resolveBaseSurfaceFeature(
    world,
    targetX,
    targetY,
    entity.radius
  );

  if (!targetFeature || targetFeature.kind === 'base') {
    return null;
  }

  for (const object of resolveWorldObjectPlacements(world?.objects ?? [])) {
    if (
      object.kind !== 'bridge' ||
      object.traversal?.enabled !== true ||
      !(object.traversal.overridesSurfaceFeatureIds ?? []).includes(
        targetFeature.id
      )
    ) {
      continue;
    }

    const passage = bridgeTraversalRect(object);
    if (!passage) continue;

    const local = orientedLocalPoint(
      targetX,
      targetY,
      passage
    );
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

    if (
      !isBlocked(
        world,
        entity,
        guided.x,
        guided.y,
        traversalRegistry
      )
    ) {
      return guided;
    }
  }

  return null;
}
