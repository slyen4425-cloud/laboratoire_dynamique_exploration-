export const WORLD_OBJECT_SCHEMA_VERSION = 2;

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

function normalizeTransform(raw) {
  const transform = raw && typeof raw === 'object' ? raw : {};

  return Object.freeze({
    x: finiteNumber(transform.x, 0),
    y: finiteNumber(transform.y, 0),
    rotationDeg: normalizeRotationDegrees(transform.rotationDeg),
    scaleX: finiteNumber(
      transform.scaleX,
      1,
      {
        min: WORLD_OBJECT_LIMITS.minScale,
        max: WORLD_OBJECT_LIMITS.maxScale
      }
    ),
    scaleY: finiteNumber(
      transform.scaleY,
      1,
      {
        min: WORLD_OBJECT_LIMITS.minScale,
        max: WORLD_OBJECT_LIMITS.maxScale
      }
    )
  });
}

function normalizeVisual(raw) {
  const visual = raw && typeof raw === 'object' ? raw : {};

  return Object.freeze({
    assetId:
      typeof visual.assetId === 'string' && visual.assetId.trim()
        ? visual.assetId.trim()
        : null
  });
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
  const baseSize = source.baseSize && typeof source.baseSize === 'object'
    ? source.baseSize
    : {};
  const traversal =
    source.traversal && typeof source.traversal === 'object'
      ? source.traversal
      : {};

  const id =
    typeof source.id === 'string' && source.id.trim()
      ? source.id.trim()
      : `bridge-${index + 1}`;

  return Object.freeze({
    schemaVersion: WORLD_OBJECT_SCHEMA_VERSION,
    id,
    kind: 'bridge',
    transform: normalizeTransform(source.transform),
    baseSize: Object.freeze({
      length: finiteNumber(baseSize.length, 160, { min: 24, max: 1600 }),
      width: finiteNumber(baseSize.width, 80, { min: 24, max: 800 })
    }),
    visual: normalizeVisual(source.visual),
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
      edgeAssistRatio: finiteNumber(
        traversal.edgeAssistRatio,
        0.15,
        { min: 0, max: 0.5 }
      ),
      traversalRuleId:
        typeof traversal.traversalRuleId === 'string' &&
        traversal.traversalRuleId.trim()
          ? traversal.traversalRuleId.trim()
          : 'terrain.bridge',
      overridesSurfaceFeatureIds: normalizeIds(
        Array.isArray(traversal.overridesSurfaceFeatureIds)
          ? traversal.overridesSurfaceFeatureIds
          : traversal.overridesObstacleIds
      )
    })
  });
}

function normalizeDoorAnchors(rawAnchors) {
  if (!Array.isArray(rawAnchors)) return Object.freeze([]);

  const anchors = [];
  const seen = new Set();

  for (const raw of rawAnchors) {
    if (!raw || typeof raw !== 'object') continue;

    const id =
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id.trim()
        : null;

    if (!id || seen.has(id)) continue;
    seen.add(id);

    anchors.push(Object.freeze({
      id,
      x: finiteNumber(raw.x, 0, { min: -0.75, max: 0.75 }),
      y: finiteNumber(raw.y, 0, { min: -0.75, max: 0.75 })
    }));
  }

  return Object.freeze(anchors);
}

function normalizeBuilding(raw, index) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const baseSize = source.baseSize && typeof source.baseSize === 'object'
    ? source.baseSize
    : {};
  const footprint =
    source.footprint && typeof source.footprint === 'object'
      ? source.footprint
      : {};
  const doorAnchors = normalizeDoorAnchors(source.doorAnchors);

  const id =
    typeof source.id === 'string' && source.id.trim()
      ? source.id.trim()
      : `building-${index + 1}`;

  return Object.freeze({
    schemaVersion: WORLD_OBJECT_SCHEMA_VERSION,
    id,
    kind: 'building',
    transform: normalizeTransform(source.transform),
    baseSize: Object.freeze({
      width: finiteNumber(baseSize.width, 260, { min: 24, max: 1600 }),
      height: finiteNumber(baseSize.height, 260, { min: 24, max: 1600 })
    }),
    visual: normalizeVisual(source.visual),
    footprint: Object.freeze({
      enabled: footprint.enabled !== false,
      widthRatio: finiteNumber(
        footprint.widthRatio,
        0.78,
        { min: 0.1, max: 1 }
      ),
      heightRatio: finiteNumber(
        footprint.heightRatio,
        0.62,
        { min: 0.1, max: 1 }
      ),
      offsetX: finiteNumber(
        footprint.offsetX,
        0,
        { min: -0.5, max: 0.5 }
      ),
      offsetY: finiteNumber(
        footprint.offsetY,
        -0.08,
        { min: -0.5, max: 0.5 }
      )
    }),
    doorAnchors
  });
}

export function normalizeWorldObject(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  if (raw.kind === 'bridge') {
    return normalizeBridge(raw, index);
  }

  if (raw.kind === 'building') {
    return normalizeBuilding(raw, index);
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

function localPointToWorld(object, localX, localY) {
  const rotation = worldObjectRotationRadians(object);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return Object.freeze({
    x: object.transform.x + localX * cos - localY * sin,
    y: object.transform.y + localX * sin + localY * cos
  });
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

export function buildingVisualRect(building) {
  if (!building || building.kind !== 'building') return null;

  return Object.freeze({
    x: building.transform.x,
    y: building.transform.y,
    rotation: worldObjectRotationRadians(building),
    width: building.baseSize.width * building.transform.scaleX,
    height: building.baseSize.height * building.transform.scaleY
  });
}

export function buildingFootprintRect(building) {
  if (
    !building ||
    building.kind !== 'building' ||
    building.footprint?.enabled !== true
  ) {
    return null;
  }

  const width = building.baseSize.width * building.transform.scaleX;
  const height = building.baseSize.height * building.transform.scaleY;
  const center = localPointToWorld(
    building,
    width * building.footprint.offsetX,
    height * building.footprint.offsetY
  );

  return Object.freeze({
    x: center.x,
    y: center.y,
    rotation: worldObjectRotationRadians(building),
    length: width * building.footprint.widthRatio,
    width: height * building.footprint.heightRatio
  });
}

export function buildingDoorAnchorWorld(building, anchorId) {
  if (!building || building.kind !== 'building') return null;

  const anchor = building.doorAnchors.find((item) => item.id === anchorId);
  if (!anchor) return null;

  const width = building.baseSize.width * building.transform.scaleX;
  const height = building.baseSize.height * building.transform.scaleY;

  const point = localPointToWorld(
    building,
    width * anchor.x,
    height * anchor.y
  );

  return Object.freeze({
    id: anchor.id,
    x: point.x,
    y: point.y
  });
}
