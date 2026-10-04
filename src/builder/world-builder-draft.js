import {
  normalizeWorldDocument
} from '../world/world-document-model.js?rev=terrain-family-extensibility-v1';
import {
  objectDefinitionCatalogV1
} from '../objects/object-definition-catalog.js?rev=object-catalog-placement-v1';

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

function terrainFamilyExists(draft, terrainFamilyId) {
  const id =
    typeof terrainFamilyId === 'string'
      ? terrainFamilyId.trim()
      : '';

  return Boolean(
    id &&
    draft?.terrainFamilies?.some(
      (family) => family.id === id
    )
  );
}

function terrainFamilyIsUsed(draft, terrainFamilyId) {
  for (const area of draft?.areas ?? []) {
    const surface = area.surface ?? {};

    if (
      surface.baseTerrainFamilyId ===
      terrainFamilyId
    ) {
      return true;
    }

    for (const collection of [
      surface.zones,
      surface.routes,
      surface.rivers
    ]) {
      if (
        collection?.some(
          (item) =>
            item.terrainFamilyId ===
            terrainFamilyId
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

export function addTerrainFamilyDefinition(
  draft,
  {
    id = null,
    label = 'Nouvelle famille'
  } = {}
) {
  const next = clone(draft);
  next.terrainFamilies ??= [];

  const familyId =
    typeof id === 'string' && id.trim()
      ? id.trim()
      : uniqueId(
          'terrain-family',
          next.terrainFamilies
        );

  if (
    next.terrainFamilies.some(
      (family) => family.id === familyId
    )
  ) {
    return next;
  }

  next.terrainFamilies.push({
    id: familyId,
    label:
      typeof label === 'string' &&
      label.trim()
        ? label.trim()
        : familyId
  });

  next.encounterConfig ??= {
    version: 1,
    families: []
  };
  next.encounterConfig.families ??= [];
  next.encounterConfig.families.push({
    terrainFamilyId: familyId,
    encounterChancePercent: 0,
    elementChances: []
  });

  return next;
}

export function updateTerrainFamilyDefinition(
  draft,
  terrainFamilyId,
  {
    label
  } = {}
) {
  const next = clone(draft);
  const family =
    next.terrainFamilies?.find(
      (entry) =>
        entry.id === terrainFamilyId
    );

  if (!family) return next;

  if (
    typeof label === 'string' &&
    label.trim()
  ) {
    family.label = label.trim();
  }

  return next;
}

export function deleteTerrainFamilyDefinition(
  draft,
  terrainFamilyId
) {
  const next = clone(draft);

  if (
    !Array.isArray(next.terrainFamilies) ||
    next.terrainFamilies.length <= 1 ||
    terrainFamilyIsUsed(
      next,
      terrainFamilyId
    )
  ) {
    return next;
  }

  next.terrainFamilies =
    next.terrainFamilies.filter(
      (family) =>
        family.id !== terrainFamilyId
    );

  if (
    Array.isArray(
      next.encounterConfig?.families
    )
  ) {
    next.encounterConfig.families =
      next.encounterConfig.families.filter(
        (profile) =>
          profile.terrainFamilyId !==
          terrainFamilyId
      );
  }

  return next;
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
  const rawTerrainFamilies =
    Array.isArray(draft.terrainFamilies)
      ? draft.terrainFamilies
      : [];
  const document = normalizeWorldDocument(draft);
  const terrainFamilyIds = new Set(
    document.terrainFamilies.map(
      (family) => family.id
    )
  );

  if (
    document.terrainFamilies.length !==
      rawTerrainFamilies.length
  ) {
    errors.push(
      'terrain-family-invalid-or-duplicate'
    );
  }

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
    const rawActors = Array.isArray(rawArea.actors)
      ? rawArea.actors
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

    if (normalizedArea.objects.length !== rawObjects.length) {
      errors.push(`object-invalid:${rawArea.id}`);
    }

    if (normalizedArea.actors.length !== rawActors.length) {
      errors.push(`actor-invalid-or-duplicate:${rawArea.id}`);
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

    const familyRefs = [
      rawArea.surface?.baseTerrainFamilyId,
      ...rawZones.map(
        (item) => item.terrainFamilyId
      ),
      ...rawRoutes.map(
        (item) => item.terrainFamilyId
      ),
      ...rawRivers.map(
        (item) => item.terrainFamilyId
      )
    ].filter(Boolean);

    for (const familyId of familyRefs) {
      if (!terrainFamilyIds.has(familyId)) {
        errors.push(
          `terrain-family-unknown:${familyId}`
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

  for (const profile of document.encounterConfig?.families ?? []) {
    if (profile.encounterChancePercent <= 0) continue;

    const total = profile.elementChances.reduce(
      (sum, entry) => sum + entry.chancePercent,
      0
    );

    if (Math.abs(total - 100) > 0.001) {
      errors.push(
        `encounter-element-total:${profile.terrainFamilyId}`
      );
    }
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
  {
    width,
    height,
    baseTerrainFamilyId,
    baseMaterialId
  } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  if (!area) return next;

  if (width !== undefined) area.width = finite(width, area.width);
  if (height !== undefined) area.height = finite(height, area.height);

  if (
    typeof baseTerrainFamilyId === 'string' &&
    terrainFamilyExists(
      next,
      baseTerrainFamilyId
    )
  ) {
    area.surface ??= {};
    area.surface.baseTerrainFamilyId =
      baseTerrainFamilyId.trim();
  }

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
    terrainFamilyId,
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
  const preferredFallback =
    kind === 'river'
      ? 'sea'
      : kind === 'route'
        ? 'road'
        : area.surface?.baseTerrainFamilyId;
  const fallbackFamily =
    terrainFamilyExists(
      next,
      preferredFallback
    )
      ? preferredFallback
      : (
          terrainFamilyExists(
            next,
            area.surface?.baseTerrainFamilyId
          )
            ? area.surface.baseTerrainFamilyId
            : next.terrainFamilies?.[0]?.id
        );
  const resolvedFamily =
    typeof terrainFamilyId === 'string' &&
    terrainFamilyExists(
      next,
      terrainFamilyId
    )
      ? terrainFamilyId.trim()
      : fallbackFamily;

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
    terrainFamilyId: resolvedFamily,
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
    typeof patch.terrainFamilyId === 'string' &&
    terrainFamilyExists(
      next,
      patch.terrainFamilyId
    )
  ) {
    item.terrainFamilyId =
      patch.terrainFamilyId.trim();
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

function findEncounterProfile(draft, terrainFamilyId) {
  return draft.encounterConfig?.families?.find(
    (profile) =>
      profile.terrainFamilyId === terrainFamilyId
  ) ?? null;
}

export function updateTerrainFamilyEncounterProfile(
  draft,
  terrainFamilyId,
  {
    encounterChancePercent
  } = {}
) {
  const next = clone(draft);
  const profile = findEncounterProfile(
    next,
    terrainFamilyId
  );

  if (!profile) return next;

  if (encounterChancePercent !== undefined) {
    profile.encounterChancePercent = Math.max(
      0,
      Math.min(
        100,
        finite(
          encounterChancePercent,
          profile.encounterChancePercent
        )
      )
    );
  }

  return next;
}

export function updateTerrainFamilyElementChance(
  draft,
  terrainFamilyId,
  elementId,
  chancePercent
) {
  const next = clone(draft);
  const profile = findEncounterProfile(
    next,
    terrainFamilyId
  );

  if (
    !profile ||
    typeof elementId !== 'string' ||
    !elementId.trim()
  ) {
    return next;
  }

  profile.elementChances ??= [];
  const id = elementId.trim();
  const chance = Math.max(
    0,
    Math.min(100, finite(chancePercent, 0))
  );
  const index = profile.elementChances.findIndex(
    (entry) => entry.elementId === id
  );

  if (chance <= 0) {
    if (index >= 0) {
      profile.elementChances.splice(index, 1);
    }
    return next;
  }

  if (index >= 0) {
    profile.elementChances[index].chancePercent = chance;
  } else {
    profile.elementChances.push({
      elementId: id,
      chancePercent: chance
    });
  }

  return next;
}

export function addActorPlacement(
  draft,
  areaId,
  {
    id = null,
    actorDefinitionId,
    x = null,
    y = null,
    facingX = 1
  } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);

  if (
    !area ||
    typeof actorDefinitionId !== 'string' ||
    !actorDefinitionId.trim()
  ) {
    return next;
  }

  area.actors ??= [];
  const actorId =
    typeof id === 'string' && id.trim()
      ? id.trim()
      : uniqueId('actor', area.actors);

  if (
    area.actors.some(
      (actor) => actor.id === actorId
    )
  ) {
    return next;
  }

  area.actors.push({
    id: actorId,
    actorDefinitionId:
      actorDefinitionId.trim(),
    x: finite(x, area.width / 2),
    y: finite(y, area.height / 2),
    facingX:
      Number(facingX) < 0 ? -1 : 1
  });

  return next;
}

export function updateActorPlacement(
  draft,
  areaId,
  actorId,
  patch = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const actor = area?.actors?.find(
    (item) => item.id === actorId
  );

  if (!actor) {
    return next;
  }

  if (
    typeof patch.actorDefinitionId ===
      'string' &&
    patch.actorDefinitionId.trim()
  ) {
    actor.actorDefinitionId =
      patch.actorDefinitionId.trim();
  }

  if (patch.x !== undefined) {
    actor.x = finite(patch.x, actor.x);
  }

  if (patch.y !== undefined) {
    actor.y = finite(patch.y, actor.y);
  }

  if (patch.facingX !== undefined) {
    actor.facingX =
      Number(patch.facingX) < 0
        ? -1
        : 1;
  }

  return next;
}

export function deleteActorPlacement(
  draft,
  areaId,
  actorId
) {
  const next = clone(draft);
  const area = findArea(next, areaId);

  if (
    !area ||
    !Array.isArray(area.actors)
  ) {
    return next;
  }

  area.actors = area.actors.filter(
    (actor) => actor.id !== actorId
  );

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

export function updateWorldObjectOverrides(
  draft,
  areaId,
  objectId,
  {
    traversalSurfaceFeatureIds
  } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);
  const object =
    area?.objects?.find(
      (item) => item.id === objectId
    );

  if (!object) return next;

  const definition =
    objectDefinitionCatalogV1.get(
      object.objectDefinitionId
    );

  if (!definition) return next;

  object.overrides ??= {};

  if (
    definition.kind === 'bridge' &&
    Array.isArray(
      traversalSurfaceFeatureIds
    )
  ) {
    const ids = [];
    const seen = new Set();

    for (
      const value of
      traversalSurfaceFeatureIds
    ) {
      if (
        typeof value !== 'string'
      ) {
        continue;
      }

      const id = value.trim();

      if (
        !id ||
        seen.has(id)
      ) {
        continue;
      }

      seen.add(id);
      ids.push(id);
    }

    object.overrides
      .traversalSurfaceFeatureIds =
        ids;
  }

  return next;
}

export function addWorldObject(
  draft,
  areaId,
  {
    id = null,
    objectDefinitionId,
    transform = {},
    overrides = {}
  } = {}
) {
  const next = clone(draft);
  const area = findArea(next, areaId);

  const definition =
    objectDefinitionCatalogV1.get(
      objectDefinitionId
    );

  if (!area || !definition) {
    return next;
  }

  area.objects ??= [];

  const prefix =
    definition.kind === 'building'
      ? 'building'
      : definition.kind === 'bridge'
        ? 'bridge'
        : 'object';

  const placementId =
    typeof id === 'string' &&
    id.trim() &&
    !area.objects.some(
      (item) =>
        item.id === id.trim()
    )
      ? id.trim()
      : uniqueId(
          prefix,
          area.objects
        );

  area.objects.push({
    id: placementId,
    objectDefinitionId:
      definition.id,
    transform: {
      x: finite(
        transform.x,
        area.width / 2
      ),
      y: finite(
        transform.y,
        area.height / 2
      ),
      rotationDeg: finite(
        transform.rotationDeg,
        0
      ),
      scaleX: finite(
        transform.scaleX,
        1
      ),
      scaleY: finite(
        transform.scaleY,
        1
      )
    },
    overrides: {
      traversalSurfaceFeatureIds:
        Array.isArray(
          overrides
            .traversalSurfaceFeatureIds
        )
          ? [
              ...new Set(
                overrides
                  .traversalSurfaceFeatureIds
                  .filter(
                    (value) =>
                      typeof value ===
                        'string' &&
                      value.trim()
                  )
                  .map(
                    (value) =>
                      value.trim()
                  )
              )
            ]
          : []
    }
  });

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
