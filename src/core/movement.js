import {
  isBlocked,
  resolveBridgeGuidedPosition,
  sculptNavigationNextBridgeId
} from './collision.js?rev=collision-boundary-worldobject-obstacles-v1-r2-bridge-grade-v69-deck-v70-rails-v71';
import {
  defaultTraversalRuleRegistry,
  resolveSurfaceTraversal
} from './surface-traversal.js?rev=surface-traversal-replay-v1&speed=terrain-family-speed-editor-v1';
import { normalize } from './vector.js';

export function stepMovement(
  world,
  entity,
  input,
  dt,
  movementConfig,
  traversalRegistry = defaultTraversalRuleRegistry,
  collisionContext = {}
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

  // Exploration Engine is the SINGLE owner of the actor's deck layer.
  // Collision World previews a transition without mutating the actor; only
  // accepted coordinates commit the same resolved layer atomically.
  const commitPosition = (x,y) => {
    if(collisionContext?.sculptNavigation)
      entity.sculptBridgeId=sculptNavigationNextBridgeId(
        collisionContext.sculptNavigation,entity,x,y);
    entity.x=x;
    entity.y=y;
  };

  if (
    !isBlocked(
      world,
      entity,
      targetX,
      targetY,
      traversalRegistry,
      collisionContext
    )
  ) {
    commitPosition(targetX,targetY);
    return entity;
  }

  const guided = resolveBridgeGuidedPosition(
    world,
    entity,
    targetX,
    targetY,
    traversalRegistry,
    collisionContext
  );

  if (guided) {
    commitPosition(guided.x,guided.y);
    return entity;
  }

  const nextX = entity.x + dx;
  if (
    !isBlocked(
      world,
      entity,
      nextX,
      entity.y,
      traversalRegistry,
      collisionContext
    )
  ) {
    commitPosition(nextX,entity.y);
  }

  const nextY = entity.y + dy;
  if (
    !isBlocked(
      world,
      entity,
      entity.x,
      nextY,
      traversalRegistry,
      collisionContext
    )
  ) {
    commitPosition(entity.x,nextY);
  }

  return entity;
}
