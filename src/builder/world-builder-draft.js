import {
  normalizeWorldDocument
} from '../world/world-document-model.js';

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

    if (normalizedArea.objects.length !== rawObjects.length) {
      errors.push(`object-invalid:${rawArea.id}`);
    }

    if (normalizedArea.spawns.length !== rawSpawns.length) {
      errors.push(`spawn-invalid-or-duplicate:${rawArea.id}`);
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

export function updateSpawn(
  draft,
  areaId,
  spawnId,
  patch = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const spawn = area?.spawns?.find((item) => item.id === spawnId);
  if (!spawn) return next;

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
