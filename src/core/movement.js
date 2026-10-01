import { isBlocked } from './collision.js';
import { normalize } from './vector.js';

export function stepMovement(world, entity, input, dt, movementConfig) {
  const direction = normalize(input.x, input.y);
  const speed = movementConfig.maxSpeed;
  const dx = direction.x * speed * dt;
  const dy = direction.y * speed * dt;

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
