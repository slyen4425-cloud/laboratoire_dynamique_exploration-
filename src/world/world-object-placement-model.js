import {
  objectDefinitionCatalogV1
} from '../objects/object-definition-catalog.js?rev=collision-boundary-worldobject-obstacles-v1&bridge-axis-v55-deck-v70-rails-v71-waterfalls-v3-ramp-v77';
import {normalizeCombatArenaIdV1} from './world-combat-arena-v1.js';
import {normalizeWorldObjectShadowSettingsV1} from './world-object-shadow-settings-v1.js';

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
    ),
    // Legacy placements remain unchanged; only mirrored ones set this.
    ...(source.flipX === true ? {flipX: true} : {})
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

// Optional physical foot -> summit line belongs to the placed Stair WorldObject.
// Keep legacy WorldDocuments byte-for-byte compatible when not authored.
function normalizeStairTraversal(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const keys=['footOffsetX','footOffsetY','headOffsetX','headOffsetY','width'];
  if(keys.some(k=>!Number.isFinite(raw[k])))return null;
  const distance=Math.hypot(raw.headOffsetX-raw.footOffsetX,
    raw.headOffsetY-raw.footOffsetY);
  if(distance<25||distance>1400||raw.width<12||raw.width>448||
    keys.slice(0,4).some(k=>Math.abs(raw[k])>2000))return null;
  return Object.freeze(Object.fromEntries(keys.map(k=>[k,raw[k]])));
}
function normalizeOverrides(raw,kind) {
  const source =
    raw && typeof raw === 'object'
      ? raw
      : {};

  const combatArenaId = normalizeCombatArenaIdV1(source.combatArenaId);
  return Object.freeze({
    traversalSurfaceFeatureIds:
      normalizeIds(
        source.traversalSurfaceFeatureIds
      ),
    visualVariantId:
      normalizedString(
        source.visualVariantId
      ),
    ...(combatArenaId ? {combatArenaId} : {}),
    // Absent by default: older WorldDocuments keep their exact save shape.
    ...(normalizeWorldObjectShadowSettingsV1(source.shadow)
      ? {shadow:normalizeWorldObjectShadowSettingsV1(source.shadow)} : {}),
    ...(kind==='stairs'&&normalizeStairTraversal(source.stairTraversal)
      ? {stairTraversal:normalizeStairTraversal(source.stairTraversal)} : {})
  });
}

export function normalizeWorldObjectPlacement(
  raw,
  index = 0,
  catalog = null
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

  if (
    catalog?.get &&
    !catalog.get(objectDefinitionId)
  ) {
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
      normalizeOverrides(raw.overrides,
        (catalog??objectDefinitionCatalogV1)?.get(objectDefinitionId)?.kind)
  });
}

export function normalizeWorldObjectPlacements(
  rawPlacements = [],
  catalog = null
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
          index,
          catalog
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

function resolveDefinitionVisual(
  definition,
  placement
) {
  const candidate =
    definition?.visual;
  const visual =
    candidate &&
    typeof candidate === 'object'
      ? candidate
      : null;

  if (!visual) return null;

  const variants =
    Array.isArray(visual.variants)
      ? visual.variants
      : [];
  const requested =
    placement?.overrides?.visualVariantId;
  const selectedId =
    requested ??
    visual.defaultVariantId ??
    null;
  const selected =
    selectedId
      ? variants.find(
          (variant) =>
            variant?.id === selectedId
        )
      : null;

  if (!selected?.assetId) {
    return visual;
  }

  return Object.freeze({
    ...visual,
    assetId: selected.assetId,
    variantId: selected.id
  });
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
    visual:
      resolveDefinitionVisual(
        definition,
        placement
      ),
    baseSize: definition.baseSize,
    collision:
      definition.collision ?? null,
    // Display-only override travels with the one authoritative placement.
    ...(placement.overrides?.shadow ? {shadow:placement.overrides.shadow} : {})
  };

  if (definition.kind === 'bridge') {
    // Explicit authoring metadata, not an orientation guessed from pixels.
    // Visual view + placement rotation jointly determine deck axis.
    const selectedView = placement.overrides.visualVariantId ??
      definition.visual?.defaultVariantId ?? 'horizontal';
    const axisOffsetDeg = definition.traversal?.viewAxesDeg?.[selectedView] ?? 0;
    return Object.freeze({
      ...common,
      traversal: Object.freeze({
        ...definition.traversal,
        axisOffsetDeg,
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
        Array.isArray(definition.doorAnchors)
          ? definition.doorAnchors
          : Object.freeze([])
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
