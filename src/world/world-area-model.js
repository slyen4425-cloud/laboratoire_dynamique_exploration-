import { normalizeWorldSurface } from './surface-model.js?rev=terrain-family-encounters-v1';
import {
  buildingDoorArrivalWorld
} from './world-object-model.js?rev=object-catalog-placement-v1';
import {
  normalizeWorldObjectPlacements,
  resolveWorldObjectPlacements
} from './world-object-placement-model.js?rev=object-catalog-placement-v1';
import {
  normalizeWorldActorPlacements
} from '../actors/world-actor-placement-model.js';

export const WORLD_AREA_SCHEMA_VERSION = 5;

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function normalizeId(value, fallback) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : fallback;
}

function normalizeSpawnAnchor(raw) {
  if (!raw || typeof raw !== 'object') return null;

  if (raw.kind !== 'building-door') return null;

  const objectId =
    typeof raw.objectId === 'string' && raw.objectId.trim()
      ? raw.objectId.trim()
      : null;
  const anchorId =
    typeof raw.anchorId === 'string' && raw.anchorId.trim()
      ? raw.anchorId.trim()
      : null;

  if (!objectId || !anchorId) return null;

  return Object.freeze({
    kind: 'building-door',
    objectId,
    anchorId,
    offset: finiteNumber(raw.offset, 56, { min: 0, max: 1000 })
  });
}

function normalizeSpawn(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const id = normalizeId(raw.id, `spawn-${index + 1}`);
  const anchor = normalizeSpawnAnchor(raw.anchor);

  if (anchor) {
    return Object.freeze({
      id,
      anchor
    });
  }

  return Object.freeze({
    id,
    x: finiteNumber(raw.x, 0),
    y: finiteNumber(raw.y, 0)
  });
}

function normalizeWorldAreaEncounters(raw, kind) {
  const encounters =
    raw && typeof raw === 'object'
      ? raw
      : {};

  return Object.freeze({
    randomEnabled:
      typeof encounters.randomEnabled === 'boolean'
        ? encounters.randomEnabled
        : kind !== 'interior'
  });
}

function normalizeObstacle(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  return Object.freeze({
    id: normalizeId(raw.id, `obstacle-${index + 1}`),
    x: finiteNumber(raw.x, 0),
    y: finiteNumber(raw.y, 0),
    w: finiteNumber(raw.w, 1, { min: 1, max: 10000 }),
    h: finiteNumber(raw.h, 1, { min: 1, max: 10000 }),
    kind: normalizeId(raw.kind, 'obstacle')
  });
}

export function normalizeWorldArea(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const id = normalizeId(raw.id, `area-${index + 1}`);
  const kind = raw.kind === 'interior' ? 'interior' : 'exterior';

  const spawns = Array.isArray(raw.spawns)
    ? raw.spawns
        .map((spawn, spawnIndex) => normalizeSpawn(spawn, spawnIndex))
        .filter(Boolean)
    : [];

  const seenSpawnIds = new Set();
  const uniqueSpawns = spawns.filter((spawn) => {
    if (seenSpawnIds.has(spawn.id)) return false;
    seenSpawnIds.add(spawn.id);
    return true;
  });

  const obstacles = Array.isArray(raw.obstacles)
    ? raw.obstacles
        .map((obstacle, obstacleIndex) =>
          normalizeObstacle(obstacle, obstacleIndex)
        )
        .filter(Boolean)
    : [];

  return Object.freeze({
    schemaVersion: WORLD_AREA_SCHEMA_VERSION,
    id,
    kind,
    width: finiteNumber(raw.width, 1200, { min: 128, max: 20000 }),
    height: finiteNumber(raw.height, 800, { min: 128, max: 20000 }),
    encounters: normalizeWorldAreaEncounters(
      raw.encounters,
      kind
    ),
    surface: normalizeWorldSurface(raw.surface),
    objects: normalizeWorldObjectPlacements(raw.objects),
    actors: normalizeWorldActorPlacements(raw.actors),
    obstacles: Object.freeze(obstacles),
    spawns: Object.freeze(uniqueSpawns)
  });
}

export function normalizeWorldAreas(rawAreas = []) {
  if (!Array.isArray(rawAreas)) return Object.freeze([]);

  const seen = new Set();
  const areas = [];

  rawAreas.forEach((raw, index) => {
    const area = normalizeWorldArea(raw, index);
    if (!area || seen.has(area.id)) return;
    seen.add(area.id);
    areas.push(area);
  });

  return Object.freeze(areas);
}

export function findWorldArea(areas, areaId) {
  if (!Array.isArray(areas) || typeof areaId !== 'string') return null;
  return areas.find((area) => area.id === areaId) ?? null;
}

export function findWorldAreaSpawn(area, spawnId) {
  if (!area || typeof spawnId !== 'string') return null;
  return area.spawns.find((spawn) => spawn.id === spawnId) ?? null;
}

export function resolveWorldAreaObjects(area) {
  return resolveWorldObjectPlacements(
    area?.objects ?? []
  );
}

export function resolveWorldAreaSpawnPoint(area, spawnId) {
  const spawn = findWorldAreaSpawn(area, spawnId);
  if (!spawn) return null;

  if (spawn.anchor?.kind === 'building-door') {
    const building =
      resolveWorldAreaObjects(area).find(
        (object) =>
          object.kind === 'building' &&
          object.id === spawn.anchor.objectId
      );

    if (!building) return null;

    const point = buildingDoorArrivalWorld(
      building,
      spawn.anchor.anchorId,
      spawn.anchor.offset
    );

    if (!point) return null;

    return Object.freeze({
      id: spawn.id,
      x: point.x,
      y: point.y
    });
  }

  return Object.freeze({
    id: spawn.id,
    x: spawn.x,
    y: spawn.y
  });
}
