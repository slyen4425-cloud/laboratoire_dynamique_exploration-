const DEFAULT_BASE_MATERIAL = 'grass.forest';
const DEFAULT_BASE_TRAVERSAL_RULE = 'terrain.ground';

function finite(value) {
  return Number.isFinite(value);
}

function normalizedString(value, fallback) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : fallback;
}

function normalizePoint(point) {
  if (!point || !finite(point.x) || !finite(point.y)) return null;
  return Object.freeze({ x: point.x, y: point.y });
}

function normalizePathItem(item, prefix, index) {
  if (!item || typeof item !== 'object') return null;

  const points = Array.isArray(item.points)
    ? item.points.map(normalizePoint).filter(Boolean)
    : [];

  if (points.length < 2) return null;

  const width = finite(item.width) && item.width > 0 ? item.width : 64;
  const id = normalizedString(item.id, `${prefix}-${index + 1}`);
  const materialId = normalizedString(
    item.materialId,
    prefix === 'river' ? 'water.forest_stream' : 'road.dirt'
  );
  const traversalRuleId = normalizedString(
    item.traversalRuleId,
    prefix === 'river' ? 'terrain.water' : 'terrain.road'
  );

  return Object.freeze({
    id,
    width,
    materialId,
    traversalRuleId,
    points: Object.freeze(points)
  });
}

export function normalizeWorldSurface(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};

  const routes = Array.isArray(source.routes)
    ? source.routes
        .map((item, index) => normalizePathItem(item, 'road', index))
        .filter(Boolean)
    : [];

  const rivers = Array.isArray(source.rivers)
    ? source.rivers
        .map((item, index) => normalizePathItem(item, 'river', index))
        .filter(Boolean)
    : [];

  return Object.freeze({
    version: 2,
    baseMaterialId: normalizedString(
      source.baseMaterialId,
      DEFAULT_BASE_MATERIAL
    ),
    baseTraversalRuleId: normalizedString(
      source.baseTraversalRuleId,
      DEFAULT_BASE_TRAVERSAL_RULE
    ),
    routes: Object.freeze(routes),
    rivers: Object.freeze(rivers)
  });
}
