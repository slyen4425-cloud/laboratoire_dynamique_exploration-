const DEFAULT_BASE_MATERIAL = 'grass.forest';
const DEFAULT_BASE_TERRAIN_FAMILY = 'forest';
const DEFAULT_BASE_TRAVERSAL_RULE = 'terrain.ground';

function finite(value) {
  return Number.isFinite(value);
}

function normalizedString(
  value,
  fallback
) {
  return typeof value === 'string' &&
    value.trim()
    ? value.trim()
    : fallback;
}

function normalizedTerrainFamilyId(
  value,
  fallback
) {
  return normalizedString(
    value,
    fallback
  );
}

function normalizePoint(point) {
  if (
    !point ||
    !finite(point.x) ||
    !finite(point.y)
  ) {
    return null;
  }

  return Object.freeze({
    x: point.x,
    y: point.y
  });
}

// Optional, purely visual road styling. Missing means no border (legacy maps).
function normalizeRoadBorderSide(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.assetId !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(raw.assetId)) return null;
  const bounded = (v, fallback, min, max) =>
    Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
  return Object.freeze({
    assetId: raw.assetId,
    width: bounded(raw.width, 8, 1, 128),
    scale: bounded(raw.scale, 1, .1, 4),
    offset: bounded(raw.offset, 0, -64, 64),
    spacing: bounded(raw.spacing, 2, 0, 128),
    opacity: bounded(raw.opacity, 1, 0, 1)
  });
}

function normalizeRoadBorder(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const left = normalizeRoadBorderSide(raw.left);
  const right = normalizeRoadBorderSide(raw.right);
  if (!left && !right) return null;
  return Object.freeze({
    enabled: raw.enabled === true,
    ...(left ? {left} : {}),
    ...(right ? {right} : {})
  });
}

function normalizeStrokeItem(
  item,
  prefix,
  index,
  {
    defaultWidth,
    defaultMaterialId,
    defaultTerrainFamilyId,
    defaultTraversalRuleId = null,
    includeTraversalRule = false
  }
) {
  if (
    !item ||
    typeof item !== 'object'
  ) {
    return null;
  }

  const points =
    Array.isArray(item.points)
      ? item.points
          .map(normalizePoint)
          .filter(Boolean)
      : [];

  if (points.length < 2) {
    return null;
  }

  const normalized = {
    id: normalizedString(
      item.id,
      `${prefix}-${index + 1}`
    ),
    width:
      finite(item.width) &&
      item.width > 0
        ? item.width
        : defaultWidth,
    terrainFamilyId:
      normalizedTerrainFamilyId(
        item.terrainFamilyId,
        defaultTerrainFamilyId
      ),
    materialId:
      normalizedString(
        item.materialId,
        defaultMaterialId
      ),
    points: Object.freeze(points),
    // Absent on every legacy round stroke; only square needs persistence.
    ...(item.brushShape === 'square' ? { brushShape: 'square' } : {})
  };

  if (includeTraversalRule) {
    normalized.traversalRuleId =
      normalizedString(
        item.traversalRuleId,
        defaultTraversalRuleId
      );
  }

  if (prefix === 'road') {
    const border = normalizeRoadBorder(item.border);
    if (border) normalized.border = border;
  }

  return Object.freeze(normalized);
}

export function normalizeWorldSurface(
  raw = {}
) {
  const source =
    raw && typeof raw === 'object'
      ? raw
      : {};
  const baseTerrainFamilyId =
    normalizedTerrainFamilyId(
      source.baseTerrainFamilyId,
      DEFAULT_BASE_TERRAIN_FAMILY
    );

  const routes =
    Array.isArray(source.routes)
      ? source.routes
          .map(
            (item, index) =>
              normalizeStrokeItem(
                item,
                'road',
                index,
                {
                  defaultWidth: 64,
                  defaultMaterialId:
                    'road.dirt',
                  defaultTerrainFamilyId:
                    'road',
                  defaultTraversalRuleId:
                    'terrain.road',
                  includeTraversalRule:
                    true
                }
              )
          )
          .filter(Boolean)
      : [];

  const rivers =
    Array.isArray(source.rivers)
      ? source.rivers
          .map(
            (item, index) =>
              normalizeStrokeItem(
                item,
                'river',
                index,
                {
                  defaultWidth: 72,
                  defaultMaterialId:
                    'water.forest_stream',
                  defaultTerrainFamilyId:
                    'sea',
                  defaultTraversalRuleId:
                    'terrain.water',
                  includeTraversalRule:
                    true
                }
              )
          )
          .filter(Boolean)
      : [];

  const zones =
    Array.isArray(source.zones)
      ? source.zones
          .map(
            (item, index) =>
              normalizeStrokeItem(
                item,
                'zone',
                index,
                {
                  defaultWidth: 180,
                  defaultMaterialId:
                    DEFAULT_BASE_MATERIAL,
                  defaultTerrainFamilyId:
                    baseTerrainFamilyId
                }
              )
          )
          .filter(Boolean)
      : [];

  return Object.freeze({
    version: 3,
    baseTerrainFamilyId,
    baseMaterialId:
      normalizedString(
        source.baseMaterialId,
        DEFAULT_BASE_MATERIAL
      ),
    baseTraversalRuleId:
      normalizedString(
        source.baseTraversalRuleId,
        DEFAULT_BASE_TRAVERSAL_RULE
      ),
    zones: Object.freeze(zones),
    routes: Object.freeze(routes),
    rivers: Object.freeze(rivers)
  });
}
