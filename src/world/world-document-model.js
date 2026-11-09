import {
  normalizeTerrainFamilyEncounterConfig
} from '../encounters/terrain-family-encounter-config.js?rev=terrain-family-extensibility-v1';
import {
  normalizeTerrainFamilyDefinitions
} from './terrain-family-registry.js?rev=terrain-family-palette-editable-v2&speed=terrain-family-speed-editor-v1';

import {
  findWorldArea,
  findWorldAreaSpawn,
  normalizeWorldAreas,
  resolveWorldAreaSpawnPoint
} from './world-area-model.js?rev=interior-geometry-authoring-v1-r2';
import {
  normalizePortals,
  portalReferencesAreValid
} from './portal-model.js?rev=builder-dynamic-return-v1';
import {
  normalizeWorldEvents,
  worldEventReferencesAreValid
} from './world-event-model.js?rev=world-event-contract-v1';

export const WORLD_DOCUMENT_SCHEMA_VERSION = 3;

function normalizedString(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

/**
 * Pure authoring-only coordinates for the World Assembler graph.
 * Not a map position, collision coordinate, Portal route or game-state owner.
 * Optional in legacy WorldDocuments; unknown/deleted Area IDs are discarded.
 */
function normalizeAuthoringLayout(raw, areas) {
  const input = raw?.positions;
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const positions = Object.create(null);
  for (const area of areas) {
    if (!Object.hasOwn(input, area.id)) continue;
    const point = input[area.id];
    if (!point || typeof point !== 'object' || Array.isArray(point)) continue;
    if (typeof point.x !== 'number' || typeof point.y !== 'number') continue;
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    if (point.x < 16 || point.y < 16 || point.x > 12000 || point.y > 12000) continue;
    positions[area.id] = Object.freeze({
      x: Math.round(point.x), y: Math.round(point.y)
    });
  }
  return Object.keys(positions).length
    ? Object.freeze({ positions: Object.freeze(positions) })
    : null;
}

export function normalizeWorldDocument(raw = {}) {
  const source =
    raw && typeof raw === 'object'
      ? raw
      : {};
  const terrainFamilies =
    normalizeTerrainFamilyDefinitions(
      source.terrainFamilies
    );
  const terrainFamilyIds =
    terrainFamilies.map(
      (definition) => definition.id
    );
  const areas =
    normalizeWorldAreas(source.areas);

  const validPortals =
    normalizePortals(source.portals)
      .filter(
        (portal) =>
          portalReferencesAreValid(
            areas,
            portal
          )
      );

  const validEvents =
    normalizeWorldEvents(source.events)
      .filter(
        (event) =>
          worldEventReferencesAreValid(
            areas,
            event,
            validPortals
          )
      );

  const requestedInitialAreaId =
    normalizedString(
      source.initialAreaId
    );
  const initialArea =
    findWorldArea(
      areas,
      requestedInitialAreaId
    ) ??
    areas[0] ??
    null;

  const requestedInitialSpawnId =
    normalizedString(
      source.initialSpawnId
    );
  const initialSpawn =
    initialArea
      ? (
          findWorldAreaSpawn(
            initialArea,
            requestedInitialSpawnId
          ) ??
          initialArea.spawns[0] ??
          null
        )
      : null;

  return Object.freeze({
    schemaVersion:
      WORLD_DOCUMENT_SCHEMA_VERSION,
    id:
      normalizedString(source.id) ??
      'world-document',
    terrainFamilies,
    encounterConfig:
      normalizeTerrainFamilyEncounterConfig(
        source.encounterConfig,
        terrainFamilyIds
      ),
    areas,
    ...(normalizeAuthoringLayout(source.authoringLayout, areas)
      ? {authoringLayout: normalizeAuthoringLayout(source.authoringLayout, areas)} : {}),
    portals: Object.freeze(validPortals),
    events: Object.freeze(validEvents),
    initialAreaId:
      initialArea?.id ?? null,
    initialSpawnId:
      initialSpawn?.id ?? null
  });
}

export function findWorldAreaById(
  worldDocument,
  areaId
) {
  return findWorldArea(
    worldDocument?.areas,
    areaId
  );
}

export function findWorldSpawnById(
  worldDocument,
  areaId,
  spawnId
) {
  const area =
    findWorldAreaById(
      worldDocument,
      areaId
    );
  return findWorldAreaSpawn(
    area,
    spawnId
  );
}

export function createInitialExplorationState(
  worldDocument
) {
  const area = findWorldAreaById(
    worldDocument,
    worldDocument?.initialAreaId
  );
  const spawn = findWorldAreaSpawn(
    area,
    worldDocument?.initialSpawnId
  );
  const point =
    resolveWorldAreaSpawnPoint(
      area,
      worldDocument?.initialSpawnId
    );

  if (!area || !spawn || !point) {
    return null;
  }

  return Object.freeze({
    currentAreaId: area.id,
    x: point.x,
    y: point.y,
    viaPortalId: null
  });
}
