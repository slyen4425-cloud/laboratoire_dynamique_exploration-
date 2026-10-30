const EPSILON = 1e-6;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export function circleIntersectsRect(x, y, radius, rect) {
  const nearestX = clamp(x, rect.x, rect.x + rect.w);
  const nearestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

export function orientedLocalPoint(x, y, rect) {
  const dx = x - rect.x;
  const dy = y - rect.y;
  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);

  return Object.freeze({
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos
  });
}

export function orientedWorldPoint(localX, localY, rect) {
  const cos = Math.cos(rect.rotation);
  const sin = Math.sin(rect.rotation);

  return Object.freeze({
    x: rect.x + localX * cos - localY * sin,
    y: rect.y + localX * sin + localY * cos
  });
}

function validOrientedRect(rect) {
  return Boolean(
    rect &&
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    Number.isFinite(rect.rotation) &&
    Number.isFinite(rect.length) &&
    Number.isFinite(rect.width) &&
    rect.length > 0 &&
    rect.width > 0
  );
}

export function pointInOrientedRect(x, y, rect) {
  if (!validOrientedRect(rect)) return false;

  const local = orientedLocalPoint(x, y, rect);

  return (
    Math.abs(local.x) <= rect.length / 2 + EPSILON &&
    Math.abs(local.y) <= rect.width / 2 + EPSILON
  );
}

export function circleIntersectsOrientedRect(x, y, radius, rect) {
  if (!validOrientedRect(rect)) return false;

  const local = orientedLocalPoint(x, y, rect);
  const nearestX = clamp(local.x, -rect.length / 2, rect.length / 2);
  const nearestY = clamp(local.y, -rect.width / 2, rect.width / 2);
  const dx = local.x - nearestX;
  const dy = local.y - nearestY;

  return dx * dx + dy * dy < radius * radius;
}

export function circleFitsOrientedRect(x, y, radius, rect) {
  if (!validOrientedRect(rect)) return false;

  const local = orientedLocalPoint(x, y, rect);

  return (
    Math.abs(local.x) + radius <= rect.length / 2 + EPSILON &&
    Math.abs(local.y) + radius <= rect.width / 2 + EPSILON
  );
}

export function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const lengthSquared = dx * dx + dy * dy;
  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) /
      lengthSquared,
    0,
    1
  );
  const nearestX = start.x + dx * t;
  const nearestY = start.y + dy * t;

  return Math.hypot(point.x - nearestX, point.y - nearestY);
}

export function pointToPathDistance(point, points) {
  if (!Array.isArray(points) || points.length < 2) return Infinity;

  let distance = Infinity;

  for (let index = 0; index < points.length - 1; index += 1) {
    distance = Math.min(
      distance,
      pointToSegmentDistance(
        point,
        points[index],
        points[index + 1]
      )
    );
  }

  return distance;
}

export function circleIntersectsStroke(x, y, radius, stroke) {
  if (
    !stroke ||
    !Number.isFinite(stroke.width) ||
    stroke.width <= 0 ||
    !Array.isArray(stroke.points) ||
    stroke.points.length < 2
  ) {
    return false;
  }

  return (
    pointToPathDistance({ x, y }, stroke.points) <
    radius + stroke.width / 2
  );
}
