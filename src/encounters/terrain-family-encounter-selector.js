import { findTerrainFamilyEncounterProfile } from './terrain-family-encounter-config.js';

// Pure decision service: one terrain family, one encounter roll, one Capture catalog.
// Material IDs, renderer textures and DOM never participate in this decision.
export function selectTerrainFamilyEncounter({ terrainFamilyId, config, catalog, random = Math.random }) {
  if (typeof terrainFamilyId !== 'string' || !terrainFamilyId.trim()) return null;
  if (!catalog || typeof catalog.findByElement !== 'function') {
    throw new TypeError('Capture catalog provider is required');
  }
  if (typeof random !== 'function') throw new TypeError('random must be a function');
  const profile = findTerrainFamilyEncounterProfile(config, terrainFamilyId);
  if (!profile || profile.encounterChancePercent <= 0) return null;
  const roll = () => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError('Encounter random must be in [0, 1)');
    }
    return value;
  };
  if (roll() * 100 >= profile.encounterChancePercent) return null;
  const eligible = profile.elementChances.map(({ elementId, chancePercent }) => {
    const creatures = catalog.findByElement(elementId).filter(
      creature => Number.isFinite(creature.spawnChance) && creature.spawnChance > 0
    );
    return { elementId, chancePercent, creatures };
  }).filter(group => group.chancePercent > 0 && group.creatures.length);
  const total = eligible.reduce((sum, group) => sum + group.chancePercent, 0);
  if (!total) return null;
  let elementRoll = roll() * total;
  const group = eligible.find(group => (elementRoll -= group.chancePercent) < 0) ?? eligible.at(-1);
  const creatureTotal = group.creatures.reduce((sum, creature) => sum + creature.spawnChance, 0);
  let creatureRoll = roll() * creatureTotal;
  const creature = group.creatures.find(creature => (creatureRoll -= creature.spawnChance) < 0) ?? group.creatures.at(-1);
  return Object.freeze({
    kind: 'wild-terrain',
    terrainFamilyId,
    elementId: group.elementId,
    creatureId: creature.id
  });
}
