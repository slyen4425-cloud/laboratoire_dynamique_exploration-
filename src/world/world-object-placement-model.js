import {
  objectDefinitionCatalogV1
} from '../objects/object-definition-catalog.js';

export const WORLD_OBJECT_PLACEMENT_SCHEMA_VERSION = 1;

export const WORLD_OBJECT_PLACEMENT_LIMITS = Object.freeze({
  minScale: 0.25,
  maxScale: 4
});

function finiteNumber(
  value,
  fallback,
  {
    min = -Infinity,
    max = Infinity
  } = {}
) {
  const number = Number(value);

  return Number.isFinite(number) &&
    number >= min &&
    number <= max
    ? number
    : fallback;
}

function normalizedString(value) {
  return typeof value === 'string' &&
    value.trim()
    ? value.trim()
    : null;
}

function normalizeRotationDegrees(value) {
  const degrees =
    Number.isFinite(Number(value))
      ? Number(value)
      : 0;

  return ((degrees % 360) + 360) % 360;
}

function normalizeTransform(raw) {
  const source =
    raw && typeof raw === 'object'
      ? raw
      : {};

  return Object.freeze({
    x: finiteNumber(source.x, 0),
    y: finiteNumber(source.y, 0),
    rotationDeg:
      normalizeRotationDegrees(
        source.rotationDeg
      ),
    scaleX: finiteNumber(
      source.scaleX,
      1,
      {
        min: WORLD_OBJECT_PLACEMENT_LIMITS.minScale,
        max: WORLD_OBJECT_PLACEMENT_LIMITS.maxScale
      }
    ),
    scaleY: finiteNumber(
      source.scaleY,
      1,
      {
        min: WORLD_OBJECT_PLACEMENT_LIMITS.minScale,
        max: WORLD_OBJECT_PLACEMENT_LIMITS.maxScale
      }
    )
  });
}

function normalizeIds(raw) {
  if (!Array.isArray(raw)) {
    return Object.freeze([]);
  }

  const ids = [];
  const seen = new Set();

  for (const value of raw) {
    const id = normalizedString(value);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return Object.freeze(ids);
}

function normalizeOverrides(raw) {
  const source =
    raw && typeof raw === 'object'
      ? raw
      : {};

  return Object.freeze({
    traversalSurfaceFeatureIds:
      normalizeIds(
        source.traversalSurfaceFeatureIds
      )
  });
}

export function normalizeWorldObjectPlacement(
  raw,
  index = 0
) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const objectDefinitionId =
    normalizedString(
      raw.objectDefinitionId
    );

  if (!objectDefinitionId) {
    return null;
  }

  return Object.freeze({
    schemaVersion:
      WORLD_OBJECT_PLACEMENT_SCHEMA_VERSION,
    id:
      normalizedString(raw.id) ??
      `object-${index + 1}`,
    objectDefinitionId,
    transform:
      normalizeTransform(raw.transform),
    overrides:
      normalizeOverrides(raw.overrides)
  });
}

export function normalizeWorldObjectPlacements(
  rawPlacements = []
) {
  if (!Array.isArray(rawPlacements)) {
    return Object.freeze([]);
  }

  const placements = [];
  const seen = new Set();

  rawPlacements.forEach(
    (raw, index) => {
      const placement =
        normalizeWorldObjectPlacement(
          raw,
          index
        );

      if (
        !placement ||
        seen.has(placement.id)
      ) {
        return;
      }

      seen.add(placement.id);
      placements.push(placement);
    }
  );

  return Object.freeze(placements);
}

export function resolveWorldObjectPlacement(
  placement,
  catalog = objectDefinitionCatalogV1
) {
  if (!placement) return null;

  const definition =
    catalog?.get?.(
      placement.objectDefinitionId
    );

  if (!definition) {
    return null;
  }

  const common = {
    schemaVersion:
      definition.schemaVersion,
    id: placement.id,
    objectDefinitionId:
      placement.objectDefinitionId,
    kind: definition.kind,
    transform: placement.transform,
    visual: definition.visual,
    baseSize: definition.baseSize
  };

  if (definition.kind === 'bridge') {
    return Object.freeze({
      ...common,
      traversal: Object.freeze({
        ...definition.traversal,
        overridesSurfaceFeatureIds:
          placement.overrides
            .traversalSurfaceFeatureIds
      })
    });
  }

  if (definition.kind === 'building') {
    return Object.freeze({
      ...common,
      footprint: definition.footprint,
      doorAnchors:
        definition.doorAnchors
    });
  }

  return Object.freeze(common);
}

export function resolveWorldObjectPlacements(
  placements,
  catalog = objectDefinitionCatalogV1
) {
  if (!Array.isArray(placements)) {
    return Object.freeze([]);
  }

  return Object.freeze(
    placements
      .map((placement) =>
        resolveWorldObjectPlacement(
          placement,
          catalog
        )
      )
      .filter(Boolean)
  );
}
