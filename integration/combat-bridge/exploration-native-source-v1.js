// Versioned Encounter adapter. Imports the Combat Lab's OWN adapters and
// catalogs at build time: no combat formula, skill semantics or runtime fork.
import { importMonsterCaptureCreatureRecordV1 } from '../../src/adapters/input/capture/monster-capture-creature-import-v1.js';
import { applyCaptureCombatRulesToCreatureDraftV1 } from '../../src/adapters/input/capture/capture-combat-rules-overlay-v1.js';
import { adaptCaptureCreatureToFighterConfig } from '../../src/adapters/input/capture/capture-creature-to-fighter-config.js';
import { adaptCaptureSkillToSkillDefinition } from '../../src/adapters/input/capture/capture-skill-to-skill-definition.js';
import { capturePortableNativeSkillDraftsV1 } from '../../src/catalogs/capture-portable-native-skill-catalog-v1.js';
import { captureComplexNativeSkillDraftsV1 } from '../../src/catalogs/capture-complex-native-skill-catalog-v1.js';

export const EXPLORATION_NATIVE_COMBAT_BRIDGE_VERSION = 1;

function required(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(field + ' missing');
  return value;
}

// The v1 partyRef is an explicit test fixture until the Capture party provider
// is wired into GenSrpg. Never choose a random creature behind the user's back.
export function buildExplorationNativeCombatSourceV1({
  snapshot, creatureRecords, party, nativeSkillCatalog, baseFighterRules
}) {
  if (snapshot?.schema !== 'capture-encounter-snapshot-v1' ||
      snapshot.version !== 1 || !Array.isArray(snapshot.opponents) ||
      snapshot.opponents.length !== 1) {
    throw new RangeError('Unsupported CaptureEncounterSnapshot contract');
  }
  if (required(party?.id, 'party.id') !== snapshot.player?.partyRef)
    throw new RangeError('Capture player partyRef not resolved');
  const playerId = required(party.activeCreatureId, 'party.activeCreatureId');
  const enemyId = required(snapshot.opponents[0]?.creatureId, 'opponent.creatureId');
  if (!Array.isArray(creatureRecords)) throw new TypeError('Combat creature catalog missing');
  const records = new Map(creatureRecords.map(record => [record.id, record]));
  for (const id of [playerId, enemyId]) {
    if (!records.has(id)) throw new RangeError('Creature absent from official Capture catalog: ' + id);
  }
  if (!Array.isArray(nativeSkillCatalog?.entries))
    throw new TypeError('Official Combat skill catalog missing');
  const skills = new Map();
  for (const entry of nativeSkillCatalog.entries) {
    if (entry?.definition?.id) skills.set(entry.definition.id, entry.definition);
  }
  for (const draft of [...capturePortableNativeSkillDraftsV1(), ...captureComplexNativeSkillDraftsV1()]) {
    skills.set(draft.id, adaptCaptureSkillToSkillDefinition(draft));
  }
  const combatRules = {
    schema: 'capture-combat-rules-editor-draft-v1',
    maxEnergy: Number(baseFighterRules?.maxEnergy),
    initialEnergy: Number(baseFighterRules?.initialEnergy),
    energyChargeAmount: Number(baseFighterRules?.energyChargeAmount),
    energyChargeIntervalMs: Number(baseFighterRules?.energyChargeIntervalMs),
    movementEnergyPerStep: Number(baseFighterRules?.movementEnergyPerStep),
    chargeTimeModifierPct: Number(baseFighterRules?.chargeTimeModifierPct)
  };
  function buildFighter(creatureId, actorId) {
    const record = records.get(creatureId);
    const imported = importMonsterCaptureCreatureRecordV1(record);
    const configured = applyCaptureCombatRulesToCreatureDraftV1({
      creatureDraft: imported.draft, combatRules
    });
    const skillIds = [...new Set(record.abilityIds ?? [])].filter(id => skills.has(id)).slice(0, 5);
    if (skillIds.length === 0)
      throw new RangeError('No supported official Combat skills for ' + creatureId);
    return {
      creatureId, name: configured.displayName, skillIds,
      fighter: adaptCaptureCreatureToFighterConfig(configured, { fighterId: actorId })
    };
  }
  const player = buildFighter(playerId, 'local-1');
  const enemy = buildFighter(enemyId, 'opponent-1');
  const activeSkills = [...new Set([...player.skillIds, ...enemy.skillIds])];
  return Object.freeze({
    battleFormat: {
      id: 'exploration-' + required(snapshot.encounterId, 'encounterId'),
      localActorId: 'local-1',
      teams: { 'local-team': ['local-1'], 'opponent-team': ['opponent-1'] },
      actors: [
        { actorId: 'local-1', teamId: 'local-team', creatureId: player.creatureId,
          displayName: player.name, fighterConfigId: player.creatureId, controllerId: 'human-local' },
        { actorId: 'opponent-1', teamId: 'opponent-team', creatureId: enemy.creatureId,
          displayName: enemy.name, fighterConfigId: enemy.creatureId, controllerId: 'ai-enemy' }
      ]
    },
    fighters: [player.fighter, enemy.fighter],
    skills: Object.fromEntries(activeSkills.map(id => [id, skills.get(id)])),
    skillIdsByActor: { 'local-1': player.skillIds, 'opponent-1': enemy.skillIds },
    skillSpeedMultiplier: 0.5,
    sourceCreatureIds: { player: playerId, opponent: enemyId }
  });
}
