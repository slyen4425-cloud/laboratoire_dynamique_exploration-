import {
  isBlocked,
  resolveBridgeGuidedPosition
} from './collision.js';
import { normalize } from './vector.js';

export function stepMovement(world, entity, input, dt, movementConfig) {
  const direction = normalize(input.x, input.y);
  const speed = movementConfig.maxSpeed;
  const dx = direction.x * speed * dt;
  const dy = direction.y * speed * dt;

  const targetX = entity.x + dx;
  const targetY = entity.y + dy;

  if (!isBlocked(world, entity, targetX, targetY)) {
    entity.x = targetX;
    entity.y = targetY;
    return entity;
  }

  const guided = resolveBridgeGuidedPosition(
    world,
    entity,
    targetX,
    targetY
  );

  if (guided) {
    entity.x = guided.x;
    entity.y = guided.y;
    return entity;
  }

  const nextX = entity.x + dx;
  if (!isBlocked(world, entity, nextX, entity.y)) {
    entity.x = nextX;
  }

  const nextY = entity.y + dy;
  if (!isBlocked(world, entity, entity.x, nextY)) {
    entity.y = nextY;
  }

  return entity;
}
