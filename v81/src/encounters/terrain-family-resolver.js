import {
  pointToPathDistance
} from '../core/geometry.js?rev=surface-traversal-replay-v1';

function contains(feature, x, y) {
  if (
    !feature ||
    !Array.isArray(feature.points) ||
    feature.points.length < 2 ||
    !Number.isFinite(feature.width) ||
    feature.width <= 0
  ) {
    return false;
  }

  return (
    pointToPathDistance(
      { x, y },
      feature.points
    ) <= feature.width / 2
  );
}

function result(featureKind, featureId, terrainFamilyId) {
  return Object.freeze({
    featureKind,
    featureId,
    terrainFamilyId
  });
}

export function resolveTerrainFamilyAtPoint(
  surface,
  x,
  y
) {
  if (
    !surface ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return result(
      'base',
      'surface-base',
      'forest'
    );
  }

  for (const route of surface.routes ?? []) {
    if (contains(route, x, y)) {
      return result(
        'route',
        route.id,
        route.terrainFamilyId ?? 'road'
      );
    }
  }

  for (const river of surface.rivers ?? []) {
    if (contains(river, x, y)) {
      return result(
        'river',
        river.id,
        river.terrainFamilyId ?? 'sea'
      );
    }
  }

  const zones = Array.isArray(surface.zones)
    ? surface.zones
    : [];

  for (let index = zones.length - 1; index >= 0; index -= 1) {
    const zone = zones[index];
    if (contains(zone, x, y)) {
      return result(
        'zone',
        zone.id,
        zone.terrainFamilyId ??
          surface.baseTerrainFamilyId ??
          'forest'
      );
    }
  }

  return result(
    'base',
    'surface-base',
    surface.baseTerrainFamilyId ?? 'forest'
  );
}
