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

function normalizeStrokeItem(
  item,
  prefix,
  index,
  {
    defaultWidth,
    defaultMaterialId,
    defaultTraversalRuleId = null,
    includeTraversalRule = false
  }
) {
  if (!item || typeof item !== 'object') return null;

  const points = Array.isArray(item.points)
    ? item.points.map(normalizePoint).filter(Boolean)
    : [];

  if (points.length < 2) return null;

  const normalized = {
    id: normalizedString(item.id, `${prefix}-${index + 1}`),
    width:
      finite(item.width) && item.width > 0
        ? item.width
        : defaultWidth,
    materialId: normalizedString(
      item.materialId,
      defaultMaterialId
    ),
    points: Object.freeze(points)
  };

  if (includeTraversalRule) {
    normalized.traversalRuleId = normalizedString(
      item.traversalRuleId,
      defaultTraversalRuleId
    );
  }

  return Object.freeze(normalized);
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
              defaultMaterialId: 'road.dirt',
              defaultTraversalRuleId: 'terrain.road',
              includeTraversalRule: true
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
              defaultMaterialId: 'water.forest_stream',
              defaultTraversalRuleId: 'terrain.water',
              includeTraversalRule: true
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
    zones: Object.freeze(zones),
    routes: Object.freeze(routes),
    rivers: Object.freeze(rivers)
  });
}
