import {
  findWorldArea,
  findWorldAreaSpawn,
  normalizeWorldAreas,
  resolveWorldAreaSpawnPoint
} from './world-area-model.js?rev=encounter-layers-v1';
import {
  normalizePortals,
  portalReferencesAreValid
} from './portal-model.js?rev=builder-dynamic-return-v1';

export const WORLD_DOCUMENT_SCHEMA_VERSION = 1;

function normalizedString(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

export function normalizeWorldDocument(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const areas = normalizeWorldAreas(source.areas);

  const validPortals = normalizePortals(source.portals)
    .filter((portal) => portalReferencesAreValid(areas, portal));

  const requestedInitialAreaId = normalizedString(source.initialAreaId);
  const initialArea =
    findWorldArea(areas, requestedInitialAreaId) ??
    areas[0] ??
    null;

  const requestedInitialSpawnId = normalizedString(source.initialSpawnId);
  const initialSpawn =
    initialArea
      ? (
          findWorldAreaSpawn(initialArea, requestedInitialSpawnId) ??
          initialArea.spawns[0] ??
          null
        )
      : null;

  return Object.freeze({
    schemaVersion: WORLD_DOCUMENT_SCHEMA_VERSION,
    id: normalizedString(source.id) ?? 'world-document',
    areas,
    portals: Object.freeze(validPortals),
    initialAreaId: initialArea?.id ?? null,
    initialSpawnId: initialSpawn?.id ?? null
  });
}

export function findWorldAreaById(worldDocument, areaId) {
  return findWorldArea(worldDocument?.areas, areaId);
}

export function findWorldSpawnById(
  worldDocument,
  areaId,
  spawnId
) {
  const area = findWorldAreaById(worldDocument, areaId);
  return findWorldAreaSpawn(area, spawnId);
}

export function createInitialExplorationState(worldDocument) {
  const area = findWorldAreaById(
    worldDocument,
    worldDocument?.initialAreaId
  );
  const spawn = findWorldAreaSpawn(
    area,
    worldDocument?.initialSpawnId
  );
  const point = resolveWorldAreaSpawnPoint(
    area,
    worldDocument?.initialSpawnId
  );

  if (!area || !spawn || !point) return null;

  return Object.freeze({
    currentAreaId: area.id,
    x: point.x,
    y: point.y,
    viaPortalId: null
  });
}
