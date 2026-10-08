import {
  isBlocked,
  resolveBridgeGuidedPosition
} from './collision.js?rev=interior-geometry-authoring-v1';
import {
  defaultTraversalRuleRegistry,
  resolveSurfaceTraversal
} from './surface-traversal.js?rev=surface-traversal-replay-v1';
import { normalize } from './vector.js';

export function stepMovement(
  world,
  entity,
  input,
  dt,
  movementConfig,
  traversalRegistry = defaultTraversalRuleRegistry
) {
  const direction = normalize(input.x, input.y);

  const traversal = resolveSurfaceTraversal(
    world,
    entity,
    entity.x,
    entity.y,
    traversalRegistry
  );

  const speed =
    movementConfig.maxSpeed *
    (traversal.passable ? traversal.speedMultiplier : 0);

  const dx = direction.x * speed * dt;
  const dy = direction.y * speed * dt;

  const targetX = entity.x + dx;
  const targetY = entity.y + dy;

  if (
    !isBlocked(
      world,
      entity,
      targetX,
      targetY,
      traversalRegistry
    )
  ) {
    entity.x = targetX;
    entity.y = targetY;
    return entity;
  }

  const guided = resolveBridgeGuidedPosition(
    world,
    entity,
    targetX,
    targetY,
    traversalRegistry
  );

  if (guided) {
    entity.x = guided.x;
    entity.y = guided.y;
    return entity;
  }

  const nextX = entity.x + dx;
  if (
    !isBlocked(
      world,
      entity,
      nextX,
      entity.y,
      traversalRegistry
    )
  ) {
    entity.x = nextX;
  }

  const nextY = entity.y + dy;
  if (
    !isBlocked(
      world,
      entity,
      entity.x,
      nextY,
      traversalRegistry
    )
  ) {
    entity.y = nextY;
  }

  return entity;
}
