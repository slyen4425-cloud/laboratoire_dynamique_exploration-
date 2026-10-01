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

export function isBlocked(world, entity, x, y) {
  if (
    x - entity.radius < 0 ||
    y - entity.radius < 0 ||
    x + entity.radius > world.width ||
    y + entity.radius > world.height
  ) {
    return true;
  }

  return world.obstacles.some((obstacle) =>
    circleIntersectsRect(x, y, entity.radius, obstacle)
  );
}
