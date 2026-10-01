import { isBlocked } from './collision.js';
import { normalize } from './vector.js';

export function stepMovement(world, entity, input, dt) {
  const direction = normalize(input.x, input.y);
  const dx = direction.x * entity.speed * dt;
  const dy = direction.y * entity.speed * dt;

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
