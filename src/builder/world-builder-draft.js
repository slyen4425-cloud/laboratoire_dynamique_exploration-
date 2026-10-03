import {
  normalizeWorldDocument
} from '../world/world-document-model.js?rev=encounter-layers-v1';
import {
  ENCOUNTER_LAYER_SCHEMA_VERSION
} from '../encounters/encounter-layer-model.js?rev=encounter-layers-v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function findArea(draft, areaId) {
  return draft.areas.find((area) => area.id === areaId) ?? null;
}

function uniqueId(prefix, items) {
  const ids = new Set(items.map((item) => item.id));
  let index = 1;
  let candidate = `${prefix}-${index}`;

  while (ids.has(candidate)) {
    index += 1;
    candidate = `${prefix}-${index}`;
  }

  return candidate;
}

export function createWorldBuilderDraft(sourceDocument) {
  const normalized = normalizeWorldDocument(sourceDocument);
  return clone(normalized);
}

export function validateWorldBuilderDraft(draft) {
  const errors = [];

  if (!draft || typeof draft !== 'object') {
    return Object.freeze({
      valid: false,
      errors: Object.freeze(['draft-invalid']),
      document: null
    });
  }

  const rawAreas = Array.isArray(draft.areas) ? draft.areas : [];
  const rawPortals = Array.isArray(draft.portals) ? draft.portals : [];
  const document = normalizeWorldDocument(draft);

  if (document.areas.length !== rawAreas.length) {
    errors.push('area-invalid-or-duplicate');
  }

  for (const rawArea of rawAreas) {
    const normalizedArea = document.areas.find(
      (area) => area.id === rawArea.id
    );

    if (!normalizedArea) continue;

    const rawObjects = Array.isArray(rawArea.objects)
      ? rawArea.objects
      : [];
    const rawSpawns = Array.isArray(rawArea.spawns)
      ? rawArea.spawns
      : [];
    const rawZones = Array.isArray(rawArea.surface?.zones)
      ? rawArea.surface.zones
      : [];
    const rawRoutes = Array.isArray(rawArea.surface?.routes)
      ? rawArea.surface.routes
      : [];
    const rawRivers = Array.isArray(rawArea.surface?.rivers)
      ? rawArea.surface.rivers
      : [];
    const rawEncounterLayers = Array.isArray(rawArea.encounterLayers)
      ? rawArea.encounterLayers
      : [];

    if (normalizedArea.objects.length !== rawObjects.length) {
      errors.push(`object-invalid:${rawArea.id}`);
    }

    if (normalizedArea.spawns.length !== rawSpawns.length) {
      errors.push(`spawn-invalid-or-duplicate:${rawArea.id}`);
    }

    if (normalizedArea.surface.zones.length !== rawZones.length) {
      errors.push(`terrain-zone-invalid:${rawArea.id}`);
    }

    if (normalizedArea.surface.routes.length !== rawRoutes.length) {
      errors.push(`route-invalid:${rawArea.id}`);
    }

    if (normalizedArea.surface.rivers.length !== rawRivers.length) {
      errors.push(`river-invalid:${rawArea.id}`);
    }

    if (normalizedArea.encounterLayers.length !== rawEncounterLayers.length) {
      errors.push(`encounter-layer-invalid-or-duplicate:${rawArea.id}`);
    }

    for (const layer of normalizedArea.encounterLayers) {
      if (
        layer.encounterChancePercent > 0 &&
        layer.table.length === 0
      ) {
        errors.push(
          `encounter-layer-table-empty:${rawArea.id}:${layer.id}`
        );
      }
    }
  }

  if (document.portals.length !== rawPortals.length) {
    errors.push('portal-invalid-or-duplicate');
  }

  if (!document.initialAreaId || !document.initialSpawnId) {
    errors.push('initial-area-or-spawn-missing');
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    document
  });
}

export function updateAreaProperties(
  draft,
  areaId,
  { width, height, baseMaterialId } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area) return next;

  if (width !== undefined) area.width = finite(width, area.width);
  if (height !== undefined) area.height = finite(height, area.height);

  if (
    typeof baseMaterialId === 'string' &&
    baseMaterialId.trim()
  ) {
    area.surface ??= {};
    area.surface.baseMaterialId = baseMaterialId.trim();
  }

  return next;
}


function surfaceCollection(area, kind) {
  area.surface ??= {};
  const key =
    kind === 'river'
      ? 'rivers'
      : kind === 'terrain'
        ? 'zones'
        : 'routes';
  area.surface[key] ??= [];
  return area.surface[key];
}

export function addSurfacePath(
  draft,
  areaId,
  kind,
  {
    width,
    materialId,
    points
  } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area || !['route', 'river', 'terrain'].includes(kind)) return next;

  const items = surfaceCollection(area, kind);
  const prefix =
    kind === 'river'
      ? 'river'
      : kind === 'terrain'
        ? 'zone'
        : 'road';
  const id = uniqueId(prefix, items);
  const fallbackMaterial =
    kind === 'river'
      ? 'water.forest_stream'
      : kind === 'terrain'
        ? 'grass.forest'
        : 'road.dirt';

  const safePoints = Array.isArray(points)
    ? points
        .filter((point) =>
          point &&
          Number.isFinite(Number(point.x)) &&
          Number.isFinite(Number(point.y))
        )
        .map((point) => ({
          x: Number(point.x),
          y: Number(point.y)
        }))
    : [];

  if (safePoints.length === 1) {
    safePoints.push({ ...safePoints[0] });
  }

  if (safePoints.length < 2) return next;

  items.push({
    id,
    width: finite(
      width,
      kind === 'river' ? 72 : kind === 'terrain' ? 180 : 82
    ),
    materialId:
      typeof materialId === 'string' && materialId.trim()
        ? materialId.trim()
        : fallbackMaterial,
    points: safePoints
  });

  return next;
}

export function updateSurfacePath(
  draft,
  areaId,
  kind,
  pathId,
  patch = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area || !['route', 'river', 'terrain'].includes(kind)) return next;

  const item = surfaceCollection(area, kind)
    .find((path) => path.id === pathId);
  if (!item) return next;

  if (patch.width !== undefined) {
    item.width = Math.max(1, finite(patch.width, item.width));
  }

  if (
    typeof patch.materialId === 'string' &&
    patch.materialId.trim()
  ) {
    item.materialId = patch.materialId.trim();
  }

  if (Array.isArray(patch.points)) {
    const points = patch.points
      .filter((point) =>
        point &&
        Number.isFinite(Number(point.x)) &&
        Number.isFinite(Number(point.y))
      )
      .map((point) => ({
        x: Number(point.x),
        y: Number(point.y)
      }));

    if (points.length >= 2) item.points = points;
  }

  return next;
}

export function appendSurfacePathPoint(
  draft,
  areaId,
  kind,
  pathId,
  point
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area || !['route', 'river', 'terrain'].includes(kind)) return next;

  const item = surfaceCollection(area, kind)
    .find((path) => path.id === pathId);
  if (
    !item ||
    !point ||
    !Number.isFinite(Number(point.x)) ||
    !Number.isFinite(Number(point.y))
  ) {
    return next;
  }

  item.points ??= [];
  item.points.push({
    x: Number(point.x),
    y: Number(point.y)
  });

  return next;
}

export function deleteSurfacePath(
  draft,
  areaId,
  kind,
  pathId
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area || !['route', 'river', 'terrain'].includes(kind)) return next;

  const items = surfaceCollection(area, kind);
  const index = items.findIndex((path) => path.id === pathId);
  if (index >= 0) items.splice(index, 1);

  return next;
}

function encounterLayerCollection(area) {
  area.encounterLayers ??= [];
  return area.encounterLayers;
}

export function addEncounterLayer(
  draft,
  areaId,
  {
    id = null,
    label = null,
    width = 180,
    points = [],
    encounterChancePercent = 10,
    checkDistance = 160,
    priority = 0,
    table = []
  } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area) return next;

  const layers = encounterLayerCollection(area);
  const layerId =
    typeof id === 'string' &&
    id.trim() &&
    !layers.some((layer) => layer.id === id.trim())
      ? id.trim()
      : uniqueId('encounter-layer', layers);

  const safePoints = Array.isArray(points)
    ? points
        .filter((point) =>
          point &&
          Number.isFinite(Number(point.x)) &&
          Number.isFinite(Number(point.y))
        )
        .map((point) => ({
          x: Number(point.x),
          y: Number(point.y)
        }))
    : [];

  if (safePoints.length === 1) {
    safePoints.push({ ...safePoints[0] });
  }
  if (safePoints.length < 2) return next;

  layers.push({
    schemaVersion: ENCOUNTER_LAYER_SCHEMA_VERSION,
    id: layerId,
    label:
      typeof label === 'string' && label.trim()
        ? label.trim()
        : layerId,
    enabled: true,
    priority: finite(priority, 0),
    width: Math.max(8, finite(width, 180)),
    points: safePoints,
    encounterChancePercent: Math.max(
      0,
      Math.min(100, finite(encounterChancePercent, 10))
    ),
    checkDistance: Math.max(1, finite(checkDistance, 160)),
    table: Array.isArray(table) ? clone(table) : []
  });

  return next;
}

export function updateEncounterLayer(
  draft,
  areaId,
  layerId,
  patch = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const layer = area?.encounterLayers?.find(
    (item) => item.id === layerId
  );
  if (!layer) return next;

  if (typeof patch.label === 'string') {
    layer.label = patch.label.trim() || layer.id;
  }
  if (patch.enabled !== undefined) {
    layer.enabled = patch.enabled !== false;
  }
  if (patch.priority !== undefined) {
    layer.priority = finite(patch.priority, layer.priority ?? 0);
  }
  if (patch.width !== undefined) {
    layer.width = Math.max(8, finite(patch.width, layer.width));
  }
  if (patch.encounterChancePercent !== undefined) {
    layer.encounterChancePercent = Math.max(
      0,
      Math.min(
        100,
        finite(
          patch.encounterChancePercent,
          layer.encounterChancePercent
        )
      )
    );
  }
  if (patch.checkDistance !== undefined) {
    layer.checkDistance = Math.max(
      1,
      finite(patch.checkDistance, layer.checkDistance)
    );
  }
  if (Array.isArray(patch.points)) {
    const points = patch.points
      .filter((point) =>
        point &&
        Number.isFinite(Number(point.x)) &&
        Number.isFinite(Number(point.y))
      )
      .map((point) => ({
        x: Number(point.x),
        y: Number(point.y)
      }));
    if (points.length >= 2) layer.points = points;
  }

  return next;
}

export function appendEncounterLayerPoint(
  draft,
  areaId,
  layerId,
  point
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const layer = area?.encounterLayers?.find(
    (item) => item.id === layerId
  );

  if (
    !layer ||
    !point ||
    !Number.isFinite(Number(point.x)) ||
    !Number.isFinite(Number(point.y))
  ) {
    return next;
  }

  layer.points ??= [];
  layer.points.push({
    x: Number(point.x),
    y: Number(point.y)
  });

  return next;
}

export function deleteEncounterLayer(
  draft,
  areaId,
  layerId
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area) return next;

  area.encounterLayers = (area.encounterLayers ?? [])
    .filter((layer) => layer.id !== layerId);

  return next;
}

export function addEncounterTableEntry(
  draft,
  areaId,
  layerId,
  {
    id = null,
    selectorKind = 'element',
    selectorId = 'fire',
    weight = 100
  } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const layer = area?.encounterLayers?.find(
    (item) => item.id === layerId
  );
  if (!layer) return next;

  layer.table ??= [];
  const entryId =
    typeof id === 'string' &&
    id.trim() &&
    !layer.table.some((entry) => entry.id === id.trim())
      ? id.trim()
      : uniqueId('entry', layer.table);

  const kind =
    selectorKind === 'creature' ? 'creature' : 'element';
  const value =
    typeof selectorId === 'string' && selectorId.trim()
      ? selectorId.trim()
      : null;

  if (!value) return next;

  layer.table.push({
    id: entryId,
    selectorKind: kind,
    selectorId: value,
    weight: Math.max(0.001, finite(weight, 100))
  });

  return next;
}

export function updateEncounterTableEntry(
  draft,
  areaId,
  layerId,
  entryId,
  patch = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const layer = area?.encounterLayers?.find(
    (item) => item.id === layerId
  );
  const entry = layer?.table?.find(
    (item) => item.id === entryId
  );
  if (!entry) return next;

  if (patch.selectorKind !== undefined) {
    entry.selectorKind =
      patch.selectorKind === 'creature'
        ? 'creature'
        : 'element';
  }
  if (
    typeof patch.selectorId === 'string' &&
    patch.selectorId.trim()
  ) {
    entry.selectorId = patch.selectorId.trim();
  }
  if (patch.weight !== undefined) {
    entry.weight = Math.max(0.001, finite(patch.weight, entry.weight));
  }

  return next;
}

export function deleteEncounterTableEntry(
  draft,
  areaId,
  layerId,
  entryId
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const layer = area?.encounterLayers?.find(
    (item) => item.id === layerId
  );
  if (!layer) return next;

  layer.table = (layer.table ?? [])
    .filter((entry) => entry.id !== entryId);

  return next;
}

export function updateSpawn(
  draft,
  areaId,
  spawnId,
  patch = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const spawn = area?.spawns?.find((item) => item.id === spawnId);
  if (!spawn || spawn.anchor) return next;

  if (patch.x !== undefined) spawn.x = finite(patch.x, spawn.x);
  if (patch.y !== undefined) spawn.y = finite(patch.y, spawn.y);

  return next;
}

export function addSpawn(
  draft,
  areaId,
  { id = null, x = null, y = null } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area) return next;

  area.spawns ??= [];
  const spawnId =
    typeof id === 'string' && id.trim()
      ? id.trim()
      : uniqueId('spawn', area.spawns);

  if (area.spawns.some((spawn) => spawn.id === spawnId)) {
    return next;
  }

  area.spawns.push({
    id: spawnId,
    x: finite(x, area.width / 2),
    y: finite(y, area.height / 2)
  });

  return next;
}

export function deleteSpawn(draft, areaId, spawnId) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area || !Array.isArray(area.spawns)) return next;

  if (
    next.initialAreaId === areaId &&
    next.initialSpawnId === spawnId
  ) {
    return next;
  }

  const referenced = next.portals?.some(
    (portal) =>
      portal.targetAreaId === areaId &&
      portal.targetSpawnId === spawnId
  );

  if (referenced) return next;

  area.spawns = area.spawns.filter(
    (spawn) => spawn.id !== spawnId
  );

  return next;
}

export function updateWorldObjectTransform(
  draft,
  areaId,
  objectId,
  patch = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const object = area?.objects?.find((item) => item.id === objectId);
  if (!object) return next;

  object.transform ??= {};

  for (const key of ['x', 'y', 'rotationDeg', 'scaleX', 'scaleY']) {
    if (patch[key] === undefined) continue;
    object.transform[key] = finite(
      patch[key],
      object.transform[key] ?? (key.startsWith('scale') ? 1 : 0)
    );
  }

  return next;
}

export function updateWorldObjectVisual(
  draft,
  areaId,
  objectId,
  assetId
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const object = area?.objects?.find((item) => item.id === objectId);
  if (!object) return next;

  object.visual ??= {};
  object.visual.assetId =
    typeof assetId === 'string' && assetId.trim()
      ? assetId.trim()
      : null;

  return next;
}

export function patchWorldObject(
  draft,
  areaId,
  objectId,
  patcher
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const object = area?.objects?.find((item) => item.id === objectId);

  if (object && typeof patcher === 'function') {
    patcher(object);
  }

  return next;
}

export function addWorldObject(
  draft,
  areaId,
  rawObject
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area || !rawObject || typeof rawObject !== 'object') {
    return next;
  }

  area.objects ??= [];
  const object = clone(rawObject);
  const prefix = object.kind === 'building' ? 'building' : 'bridge';

  if (
    typeof object.id !== 'string' ||
    !object.id.trim() ||
    area.objects.some((item) => item.id === object.id.trim())
  ) {
    object.id = uniqueId(prefix, area.objects);
  }

  area.objects.push(object);
  return next;
}

export function duplicateWorldObject(
  draft,
  areaId,
  objectId
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const source = area?.objects?.find((item) => item.id === objectId);
  if (!source) return next;

  const copy = clone(source);
  copy.id = uniqueId(`${source.id}-copy`, area.objects);
  copy.transform ??= {};
  copy.transform.x = finite(copy.transform.x, 0) + 24;
  copy.transform.y = finite(copy.transform.y, 0) + 24;
  area.objects.push(copy);

  return next;
}

export function deleteWorldObject(
  draft,
  areaId,
  objectId
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area || !Array.isArray(area.objects)) return next;

  const referencedByPortal = next.portals?.some(
    (portal) =>
      portal.sourceAreaId === areaId &&
      portal.trigger?.kind === 'building-door' &&
      portal.trigger.objectId === objectId
  );

  if (referencedByPortal) return next;

  area.objects = area.objects.filter(
    (object) => object.id !== objectId
  );

  return next;
}

export function updatePortal(
  draft,
  portalId,
  patcher
) {
  const next = clone(draft);
  const portal = next.portals?.find((item) => item.id === portalId);

  if (portal && typeof patcher === 'function') {
    patcher(portal);
  }

  return next;
}

export function addPortal(draft, rawPortal) {
  const next = clone(draft);
  next.portals ??= [];

  if (!rawPortal || typeof rawPortal !== 'object') return next;

  const portal = clone(rawPortal);

  if (
    typeof portal.id !== 'string' ||
    !portal.id.trim() ||
    next.portals.some((item) => item.id === portal.id.trim())
  ) {
    portal.id = uniqueId('portal', next.portals);
  }

  next.portals.push(portal);
  return next;
}

export function deletePortal(draft, portalId) {
  const next = clone(draft);
  next.portals = Array.isArray(next.portals)
    ? next.portals.filter((portal) => portal.id !== portalId)
    : [];

  return next;
}

export function serializeWorldBuilderDraft(draft) {
  const result = validateWorldBuilderDraft(draft);

  if (!result.valid) {
    throw new Error(
      `Invalid World Builder draft: ${result.errors.join(', ')}`
    );
  }

  return JSON.stringify(result.document, null, 2);
}

export function importWorldBuilderDocument(jsonText) {
  const parsed = JSON.parse(jsonText);
  const draft = clone(parsed);
  const result = validateWorldBuilderDraft(draft);

  if (!result.valid) {
    throw new Error(
      `Invalid WorldDocument import: ${result.errors.join(', ')}`
    );
  }

  return createWorldBuilderDraft(result.document);
}
