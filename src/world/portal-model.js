import {
  findWorldArea,
  findWorldAreaSpawn,
  resolveWorldAreaObjects,
  resolveWorldAreaSpawnPoint
} from './world-area-model.js?rev=builder-dynamic-return-v1';
import {
  normalizeWorldTriggerGeometry,
  resolveWorldTriggerPoint,
  worldTriggerContainsPoint
} from './world-trigger-geometry.js?rev=trigger-geometry-v1';

export const PORTAL_SCHEMA_VERSION = 1;

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function normalizedString(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

function normalizePortalVisual(raw) {
  const visual = raw && typeof raw === 'object' ? raw : {};
  const marker =
    visual.marker === 'exit' ||
    visual.marker === 'entry' ||
    visual.marker === 'portal'
      ? visual.marker
      : 'portal';

  return Object.freeze({
    visible: visual.visible === true,
    marker,
    label: normalizedString(visual.label)
  });
}

export function normalizePortal(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const sourceAreaId = normalizedString(raw.sourceAreaId);
  const targetAreaId = normalizedString(raw.targetAreaId);
  const targetSpawnId = normalizedString(raw.targetSpawnId);
  const trigger = normalizeWorldTriggerGeometry(raw.trigger);

  if (!sourceAreaId || !targetAreaId || !targetSpawnId || !trigger) {
    return null;
  }

  return Object.freeze({
    schemaVersion: PORTAL_SCHEMA_VERSION,
    id: normalizedString(raw.id) ?? `portal-${index + 1}`,
    enabled: raw.enabled !== false,
    sourceAreaId,
    trigger,
    targetAreaId,
    targetSpawnId,
    visual: normalizePortalVisual(raw.visual)
  });
}

export function normalizePortals(rawPortals = []) {
  if (!Array.isArray(rawPortals)) return Object.freeze([]);

  const seen = new Set();
  const portals = [];

  rawPortals.forEach((raw, index) => {
    const portal = normalizePortal(raw, index);
    if (!portal || seen.has(portal.id)) return;
    seen.add(portal.id);
    portals.push(portal);
  });

  return Object.freeze(portals);
}

export function resolvePortalTriggerPoint(areas, portal) {
  if (!portal?.trigger) return null;

  const area = findWorldArea(areas, portal.sourceAreaId);
  if (!area) return null;

  return resolveWorldTriggerPoint(
    area,
    portal.trigger
  );
}
export function portalReferencesAreValid(areas, portal) {
  if (!portal) return false;

  const sourceArea = findWorldArea(areas, portal.sourceAreaId);
  const targetArea = findWorldArea(areas, portal.targetAreaId);
  const targetSpawn = findWorldAreaSpawn(
    targetArea,
    portal.targetSpawnId
  );
  const targetPoint = resolveWorldAreaSpawnPoint(
    targetArea,
    portal.targetSpawnId
  );
  const triggerPoint = resolvePortalTriggerPoint(areas, portal);

  return Boolean(
    sourceArea &&
    targetArea &&
    targetSpawn &&
    targetPoint &&
    triggerPoint
  );
}

export function findTriggeredPortal(
  worldDocument,
  currentAreaId,
  entity
) {
  if (
    !worldDocument ||
    typeof currentAreaId !== 'string' ||
    !entity ||
    !Number.isFinite(entity.x) ||
    !Number.isFinite(entity.y)
  ) {
    return null;
  }

  for (const portal of worldDocument.portals) {
    if (
      portal.enabled !== true ||
      portal.sourceAreaId !== currentAreaId
    ) {
      continue;
    }

    const point = resolvePortalTriggerPoint(
      worldDocument.areas,
      portal
    );
    if (!point) continue;

    if (worldTriggerContainsPoint(entity, point)) {
      return portal;
    }
  }

  return null;
}

export function applyPortalTransition(
  worldDocument,
  state,
  portal
) {
  if (
    !worldDocument ||
    !state ||
    !portal ||
    state.currentAreaId !== portal.sourceAreaId
  ) {
    return null;
  }

  const targetArea = findWorldArea(
    worldDocument.areas,
    portal.targetAreaId
  );
  const targetSpawn = findWorldAreaSpawn(
    targetArea,
    portal.targetSpawnId
  );
  const targetPoint = resolveWorldAreaSpawnPoint(
    targetArea,
    portal.targetSpawnId
  );

  if (!targetArea || !targetSpawn || !targetPoint) return null;

  return Object.freeze({
    currentAreaId: targetArea.id,
    x: targetPoint.x,
    y: targetPoint.y,
    viaPortalId: portal.id
  });
}
