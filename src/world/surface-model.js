const DEFAULT_BASE_MATERIAL = 'grass.forest';

function finite(value) {
  return Number.isFinite(value);
}

function normalizePoint(point) {
  if (!point || !finite(point.x) || !finite(point.y)) return null;
  return Object.freeze({ x: point.x, y: point.y });
}

function normalizeStrokeItem(
  item,
  prefix,
  index,
  {
    defaultWidth,
    defaultMaterialId
  }
) {
  if (!item || typeof item !== 'object') return null;

  const points = Array.isArray(item.points)
    ? item.points.map(normalizePoint).filter(Boolean)
    : [];

  if (points.length < 2) return null;

  const width =
    finite(item.width) && item.width > 0
      ? item.width
      : defaultWidth;
  const id =
    typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : `${prefix}-${index + 1}`;
  const materialId =
    typeof item.materialId === 'string' && item.materialId.trim()
      ? item.materialId.trim()
      : defaultMaterialId;

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
        .map((item, index) =>
          normalizeStrokeItem(
            item,
            'road',
            index,
            {
              defaultWidth: 64,
              defaultMaterialId: 'road.dirt'
            }
          )
        )
        .filter(Boolean)
    : [];

  const rivers = Array.isArray(source.rivers)
    ? source.rivers
        .map((item, index) =>
          normalizeStrokeItem(
            item,
            'river',
            index,
            {
              defaultWidth: 72,
              defaultMaterialId: 'water.forest_stream'
            }
          )
        )
        .filter(Boolean)
    : [];

  const zones = Array.isArray(source.zones)
    ? source.zones
        .map((item, index) =>
          normalizeStrokeItem(
            item,
            'zone',
            index,
            {
              defaultWidth: 180,
              defaultMaterialId: DEFAULT_BASE_MATERIAL
            }
          )
        )
        .filter(Boolean)
    : [];

  const baseMaterialId =
    typeof source.baseMaterialId === 'string' && source.baseMaterialId.trim()
      ? source.baseMaterialId.trim()
      : DEFAULT_BASE_MATERIAL;

  return Object.freeze({
    version: 1,
    baseMaterialId,
    zones: Object.freeze(zones),
    routes: Object.freeze(routes),
    rivers: Object.freeze(rivers)
  });
}
