import { normalizeWorldSurface } from './surface-model.js';
import { normalizeWorldObjects } from './world-object-model.js';

export const WORLD_AREA_SCHEMA_VERSION = 1;

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

function normalizeSpawn(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  return Object.freeze({
    id: normalizeId(raw.id, `spawn-${index + 1}`),
    x: finiteNumber(raw.x, 0),
    y: finiteNumber(raw.y, 0)
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
    surface: normalizeWorldSurface(raw.surface),
    objects: normalizeWorldObjects(raw.objects),
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
