import {
  TERRAIN_FAMILY_IDS
} from '../world/terrain-family-registry.js?rev=terrain-family-extensibility-v1';

export const TERRAIN_FAMILY_ENCOUNTER_CONFIG_VERSION = 1;

function finitePercent(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, number));
}

function text(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

function normalizeElementChances(raw = []) {
  if (!Array.isArray(raw)) return Object.freeze([]);

  const seen = new Set();
  const result = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;

    const elementId = text(entry.elementId);
    const chancePercent = finitePercent(
      entry.chancePercent,
      0
    );

    if (
      !elementId ||
      chancePercent <= 0 ||
      seen.has(elementId)
    ) {
      continue;
    }

    seen.add(elementId);
    result.push(
      Object.freeze({
        elementId,
        chancePercent
      })
    );
  }

  return Object.freeze(result);
}

function normalizeFamilyIds(rawIds) {
  const source =
    Array.isArray(rawIds) && rawIds.length > 0
      ? rawIds
      : TERRAIN_FAMILY_IDS;
  const seen = new Set();
  const ids = [];

  for (const raw of source) {
    const id = text(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids.length > 0
    ? ids
    : [...TERRAIN_FAMILY_IDS];
}

function profileById(
  rawFamilies,
  allowedIds
) {
  const byId = new Map();
  const allowed = new Set(allowedIds);

  if (!Array.isArray(rawFamilies)) {
    return byId;
  }

  for (const raw of rawFamilies) {
    const id = text(raw?.terrainFamilyId);
    if (
      !id ||
      !allowed.has(id) ||
      byId.has(id)
    ) {
      continue;
    }

    byId.set(id, raw);
  }

  return byId;
}

export function normalizeTerrainFamilyEncounterConfig(
  raw = {},
  terrainFamilyIds = TERRAIN_FAMILY_IDS
) {
  const source =
    raw && typeof raw === 'object'
      ? raw
      : {};
  const ids =
    normalizeFamilyIds(terrainFamilyIds);
  const byId =
    profileById(source.families, ids);

  const families = ids.map(
    (terrainFamilyId) => {
      const profile =
        byId.get(terrainFamilyId) ?? {};

      return Object.freeze({
        terrainFamilyId,
        encounterChancePercent:
          finitePercent(
            profile.encounterChancePercent,
            0
          ),
        elementChances:
          normalizeElementChances(
            profile.elementChances
          )
      });
    }
  );

  return Object.freeze({
    version:
      TERRAIN_FAMILY_ENCOUNTER_CONFIG_VERSION,
    families: Object.freeze(families)
  });
}

export function findTerrainFamilyEncounterProfile(
  config,
  terrainFamilyId
) {
  return config?.families?.find(
    (profile) =>
      profile.terrainFamilyId ===
      terrainFamilyId
  ) ?? null;
}
