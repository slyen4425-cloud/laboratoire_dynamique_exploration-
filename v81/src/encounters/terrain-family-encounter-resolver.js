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

  // Historical WorldDocument v1 elementChances are now just a set of
  // enabled element IDs: their former percentages never weight the lottery.
  // A creature with multiple enabled elements appears ONCE in this pool.
  const enabled = new Set(
    (profile.elementChances ?? [])
      .filter((entry) => entry.chancePercent > 0)
      .map((entry) => entry.elementId)
  );
  const candidates = captureCatalog.listCreatures().filter(
    (creature) => creature.spawnChance > 0 &&
      creature.elements.some((id) => enabled.has(id))
  );

  const creature = weightedPick(
    candidates,
    (entry) => entry.spawnChance,
    random
  );

  if (!creature) {
    return Object.freeze({
      triggered: false,
      reason: 'no-element',
      terrainFamilyId
    });
  }

  // EncounterSnapshot v1 expects a meaningful element context. Choose one
  // of the winning creature's enabled elements; do not roll a second lottery.
  const elementId = creature.elements.find((id) => enabled.has(id));

  return Object.freeze({
    triggered: true,
    reason: 'selected',
    terrainFamilyId,
    elementId,
    creatureId: creature.id,
    spawnChance: creature.spawnChance
  });
}
