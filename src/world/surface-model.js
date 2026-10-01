const DEFAULT_BASE_MATERIAL = 'ground.forest.base';

function finite(value) {
  return Number.isFinite(value);
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
  const id = typeof item.id === 'string' && item.id.trim()
    ? item.id.trim()
    : `${prefix}-${index + 1}`;
  const materialId =
    typeof item.materialId === 'string' && item.materialId.trim()
      ? item.materialId.trim()
      : `${prefix}.default`;

  return Object.freeze({
    id,
    width,
    materialId,
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

  const baseMaterialId =
    typeof source.baseMaterialId === 'string' && source.baseMaterialId.trim()
      ? source.baseMaterialId.trim()
      : DEFAULT_BASE_MATERIAL;

  return Object.freeze({
    version: 1,
    baseMaterialId,
    routes: Object.freeze(routes),
    rivers: Object.freeze(rivers)
  });
}
