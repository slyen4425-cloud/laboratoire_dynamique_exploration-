import {
  normalizeTerrainFamilyEncounterConfig
} from '../encounters/terrain-family-encounter-config.js?rev=terrain-family-extensibility-v1';
import {
  normalizeTerrainFamilyDefinitions
} from './terrain-family-registry.js?rev=terrain-family-extensibility-v1';

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
