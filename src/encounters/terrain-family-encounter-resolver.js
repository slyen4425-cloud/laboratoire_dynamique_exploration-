import {
  findTerrainFamilyEncounterProfile
} from './terrain-family-encounter-config.js?rev=terrain-family-encounters-v1';

function boundedRandom(random) {
  const value = Number(random());
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999999999999, value));
}

function weightedPick(items, chanceOf, random) {
  const weighted = items
    .map((item) => ({
      item,
      chance: Number(chanceOf(item))
    }))
    .filter(({ chance }) =>
      Number.isFinite(chance) && chance > 0
    );

  const total = weighted.reduce(
    (sum, entry) => sum + entry.chance,
    0
  );

  if (total <= 0) return null;

  const target = boundedRandom(random) * total;
  let cursor = 0;

  for (const entry of weighted) {
    cursor += entry.chance;
    if (target < cursor) return entry.item;
  }

  return weighted.at(-1)?.item ?? null;
}

export function resolveTerrainFamilyEncounter({
  terrainFamilyId,
  config,
  captureCatalog,
  random = Math.random
}) {
  const profile = findTerrainFamilyEncounterProfile(
    config,
    terrainFamilyId
  );

  if (!profile) {
    return Object.freeze({
      triggered: false,
      reason: 'missing-family',
      terrainFamilyId
    });
  }

  const encounterRoll = boundedRandom(random) * 100;

  if (encounterRoll >= profile.encounterChancePercent) {
    return Object.freeze({
      triggered: false,
      reason: 'chance',
      terrainFamilyId
    });
  }

  const eligibleElements = profile.elementChances.filter(
    ({ elementId }) =>
      captureCatalog
        .findByElement(elementId)
        .some((creature) => creature.spawnChance > 0)
  );

  const selectedElement = weightedPick(
    eligibleElements,
    (entry) => entry.chancePercent,
    random
  );

  if (!selectedElement) {
    return Object.freeze({
      triggered: false,
      reason: 'no-element',
      terrainFamilyId
    });
  }

  const candidates = captureCatalog
    .findByElement(selectedElement.elementId)
    .filter((creature) => creature.spawnChance > 0);

  const creature = weightedPick(
    candidates,
    (entry) => entry.spawnChance,
    random
  );

  if (!creature) {
    return Object.freeze({
      triggered: false,
      reason: 'no-creature',
      terrainFamilyId,
      elementId: selectedElement.elementId
    });
  }

  return Object.freeze({
    triggered: true,
    reason: 'selected',
    terrainFamilyId,
    elementId: selectedElement.elementId,
    creatureId: creature.id,
    spawnChance: creature.spawnChance
  });
}
