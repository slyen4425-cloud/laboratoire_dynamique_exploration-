import {
  resolveWorldAreaObjects
} from './world-area-model.js?rev=trigger-geometry-v1';
import {
  buildingDoorAnchorWorld
} from './world-object-model.js?rev=trigger-geometry-v1';

export const WORLD_TRIGGER_GEOMETRY_SCHEMA_VERSION = 1;

function finiteNumber(
  value,
  fallback,
  { min = -Infinity, max = Infinity } = {}
) {
  const number = Number(value);

  return Number.isFinite(number) &&
    number >= min &&
    number <= max
    ? number
    : fallback;
}

function normalizedString(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

export function normalizeWorldTriggerGeometry(raw) {
  if (!raw || typeof raw !== 'object') return null;

  if (raw.kind === 'point') {
    return Object.freeze({
      kind: 'point',
      x: finiteNumber(raw.x, 0),
      y: finiteNumber(raw.y, 0),
      radius: finiteNumber(raw.radius, 28, {
        min: 4,
        max: 240
      })
    });
  }

  if (
    raw.kind === 'object-anchor' ||
    raw.kind === 'building-door'
  ) {
    const objectId = normalizedString(raw.objectId);
    const anchorId = normalizedString(raw.anchorId);

    if (!objectId || !anchorId) return null;

    return Object.freeze({
      kind: 'object-anchor',
      objectId,
      anchorId,
      radius: finiteNumber(raw.radius, 32, {
        min: 4,
        max: 240
      })
    });
  }

  return null;
}

export function resolveWorldTriggerPoint(area, trigger) {
  if (!area || !trigger) return null;

  if (trigger.kind === 'point') {
    return Object.freeze({
      x: trigger.x,
      y: trigger.y,
      radius: trigger.radius
    });
  }

  if (trigger.kind !== 'object-anchor') {
    return null;
  }

  const object =
    resolveWorldAreaObjects(area).find(
      (entry) =>
        entry.id === trigger.objectId
    );

  if (!object) return null;

  if (object.kind === 'building') {
    const anchor = buildingDoorAnchorWorld(
      object,
      trigger.anchorId
    );

    if (!anchor) return null;

    return Object.freeze({
      x: anchor.x,
      y: anchor.y,
      radius: trigger.radius
    });
  }

  return null;
}

export function worldTriggerContainsPoint(
  point,
  resolvedTriggerPoint
) {
  if (
    !point ||
    !resolvedTriggerPoint ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(resolvedTriggerPoint.x) ||
    !Number.isFinite(resolvedTriggerPoint.y) ||
    !Number.isFinite(resolvedTriggerPoint.radius)
  ) {
    return false;
  }

  const dx = point.x - resolvedTriggerPoint.x;
  const dy = point.y - resolvedTriggerPoint.y;
  const radius = Math.max(
    0,
    resolvedTriggerPoint.radius
  );

  return dx * dx + dy * dy <= radius * radius;
}
