export const WORLD_OBJECT_SCHEMA_VERSION = 1;

export const WORLD_OBJECT_LIMITS = Object.freeze({
  minScale: 0.25,
  maxScale: 4
});

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function normalizeRotationDegrees(value) {
  const degrees = Number.isFinite(value) ? value : 0;
  return ((degrees % 360) + 360) % 360;
}

function normalizeIds(values) {
  if (!Array.isArray(values)) return Object.freeze([]);

  const ids = [];
  const seen = new Set();

  for (const value of values) {
    if (typeof value !== 'string') continue;
    const id = value.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return Object.freeze(ids);
}

function normalizeBridge(raw, index) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const transform = source.transform && typeof source.transform === 'object'
    ? source.transform
    : {};
  const baseSize = source.baseSize && typeof source.baseSize === 'object'
    ? source.baseSize
    : {};
  const visual = source.visual && typeof source.visual === 'object'
    ? source.visual
    : {};
  const traversal =
    source.traversal && typeof source.traversal === 'object'
      ? source.traversal
      : {};

  const id =
    typeof source.id === 'string' && source.id.trim()
      ? source.id.trim()
      : `bridge-${index + 1}`;

  const scaleX = finiteNumber(
    transform.scaleX,
    1,
    {
      min: WORLD_OBJECT_LIMITS.minScale,
      max: WORLD_OBJECT_LIMITS.maxScale
    }
  );
  const scaleY = finiteNumber(
    transform.scaleY,
    1,
    {
      min: WORLD_OBJECT_LIMITS.minScale,
      max: WORLD_OBJECT_LIMITS.maxScale
    }
  );

  return Object.freeze({
    schemaVersion: WORLD_OBJECT_SCHEMA_VERSION,
    id,
    kind: 'bridge',
    transform: Object.freeze({
      x: finiteNumber(transform.x, 0),
      y: finiteNumber(transform.y, 0),
      rotationDeg: normalizeRotationDegrees(transform.rotationDeg),
      scaleX,
      scaleY
    }),
    baseSize: Object.freeze({
      length: finiteNumber(baseSize.length, 160, { min: 24, max: 1600 }),
      width: finiteNumber(baseSize.width, 80, { min: 24, max: 800 })
    }),
    visual: Object.freeze({
      assetId:
        typeof visual.assetId === 'string' && visual.assetId.trim()
          ? visual.assetId.trim()
          : null
    }),
    traversal: Object.freeze({
      enabled: traversal.enabled !== false,
      lengthRatio: finiteNumber(
        traversal.lengthRatio,
        0.9,
        { min: 0.1, max: 1 }
      ),
      widthRatio: finiteNumber(
        traversal.widthRatio,
        0.8,
        { min: 0.1, max: 1 }
      ),
      overridesObstacleIds: normalizeIds(
        traversal.overridesObstacleIds
      )
    })
  });
}

export function normalizeWorldObject(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  if (raw.kind === 'bridge') {
    return normalizeBridge(raw, index);
  }

  return null;
}

export function normalizeWorldObjects(rawObjects = []) {
  if (!Array.isArray(rawObjects)) return Object.freeze([]);

  return Object.freeze(
    rawObjects
      .map((item, index) => normalizeWorldObject(item, index))
      .filter(Boolean)
  );
}

export function worldObjectRotationRadians(object) {
  const degrees = object?.transform?.rotationDeg;
  return Number.isFinite(degrees) ? degrees * Math.PI / 180 : 0;
}

export function bridgeVisualRect(bridge) {
  if (!bridge || bridge.kind !== 'bridge') return null;

  return Object.freeze({
    x: bridge.transform.x,
    y: bridge.transform.y,
    rotation: worldObjectRotationRadians(bridge),
    length: bridge.baseSize.length * bridge.transform.scaleX,
    width: bridge.baseSize.width * bridge.transform.scaleY
  });
}

export function bridgeTraversalRect(bridge) {
  if (
    !bridge ||
    bridge.kind !== 'bridge' ||
    bridge.traversal?.enabled !== true
  ) {
    return null;
  }

  const visual = bridgeVisualRect(bridge);

  return Object.freeze({
    x: visual.x,
    y: visual.y,
    rotation: visual.rotation,
    length: visual.length * bridge.traversal.lengthRatio,
    width: visual.width * bridge.traversal.widthRatio
  });
}
