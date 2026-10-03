import {
  TERRAIN_FAMILY_IDS
} from '../world/terrain-family-registry.js?rev=terrain-family-encounters-v1';

export const TERRAIN_FAMILY_ENCOUNTER_CONFIG_VERSION = 1;

function finitePercent(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, number));
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? number
    : null;
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
    const chancePercent = finitePercent(entry.chancePercent, 0);

    if (!elementId || chancePercent <= 0 || seen.has(elementId)) continue;
    seen.add(elementId);
    result.push(Object.freeze({ elementId, chancePercent }));
  }

  return Object.freeze(result);
}

function profileById(rawFamilies) {
  const byId = new Map();

  if (!Array.isArray(rawFamilies)) return byId;

  for (const raw of rawFamilies) {
    const id = text(raw?.terrainFamilyId);
    if (!id || !TERRAIN_FAMILY_IDS.includes(id) || byId.has(id)) {
      continue;
    }
    byId.set(id, raw);
  }

  return byId;
}

export function normalizeTerrainFamilyEncounterConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const byId = profileById(source.families);

  const families = TERRAIN_FAMILY_IDS.map((terrainFamilyId) => {
    const profile = byId.get(terrainFamilyId) ?? {};

    return Object.freeze({
      terrainFamilyId,
      encounterChancePercent: finitePercent(
        profile.encounterChancePercent,
        0
      ),
      elementChances: normalizeElementChances(
        profile.elementChances
      )
    });
  });

  return Object.freeze({
    version: TERRAIN_FAMILY_ENCOUNTER_CONFIG_VERSION,
    families: Object.freeze(families)
  });
}

export function findTerrainFamilyEncounterProfile(
  config,
  terrainFamilyId
) {
  return config?.families?.find(
    (profile) => profile.terrainFamilyId === terrainFamilyId
  ) ?? null;
}
