import {
  findTerrainFamilyEncounterProfile
} from './terrain-family-encounter-config.js?rev=terrain-family-encounters-v1';

function boundedRandom(random) {
  const value = Number(random());
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999999999999, value));
}

function weightedPick(items, weightOf, random) {
  const weighted = items
    .map((item) => ({
      item,
      weight: Number(weightOf(item))
    }))
    .filter(({ weight }) =>
      Number.isFinite(weight) && weight > 0
    );

  const total = weighted.reduce(
    (sum, entry) => sum + entry.weight,
    0
  );

  if (total <= 0) return null;

  const target = boundedRandom(random) * total;
  let cursor = 0;

  for (const entry of weighted) {
    cursor += entry.weight;
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

  const eligibleElements = profile.elementWeights.filter(
    ({ elementId }) =>
      captureCatalog
        .findByElement(elementId)
        .some((creature) => creature.spawnChance > 0)
  );

  const selectedElement = weightedPick(
    eligibleElements,
    (entry) => entry.weight,
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
