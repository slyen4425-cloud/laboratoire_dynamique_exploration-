import {normalizeWorldEncounterStatProfileV1} from './wild-stat-profile-contract-v1.js';
import {normalizeCombatArenaIdsV1} from '../world/world-combat-arena-v1.js';
import {normalizeNpcTrainerRosterV1,normalizeNpcTrainerRewardV1} from '../actors/map-actor-npc-settings-v1.js';
export const CAPTURE_ENCOUNTER_SNAPSHOT_SCHEMA =
  'capture-encounter-snapshot-v1';
export const CAPTURE_ENCOUNTER_SNAPSHOT_VERSION = 1;

function requiredText(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${name} is required`);
  }
  return value.trim();
}

export function createCaptureEncounterSnapshot(raw = {}) {
  const encounterId = requiredText(
    raw.encounterId,
    'encounterId'
  );
  const source = requiredText(
    raw.source ?? 'terrain-random',
    'source'
  );
  const playerPartyRef = requiredText(
    raw.playerPartyRef,
    'playerPartyRef'
  );
  const trainerActorId = source==='npc-trainer' ? requiredText(raw.trainerActorId,'trainerActorId') : null;
  const rulesetId = requiredText(
    raw.rulesetId,
    'rulesetId'
  );
  const areaId = requiredText(
    raw.areaId,
    'areaId'
  );
  const terrainFamilyId = requiredText(
    raw.terrainFamilyId,
    'terrainFamilyId'
  );
  const elementId = requiredText(
    raw.elementId,
    'elementId'
  );
  const returnToken = requiredText(
    raw.returnToken,
    'returnToken'
  );
  // Additive, optional v1 field: old snapshots and saved encounters retain
  // their exact shape. Only the WorldArea Encounter owner may select the level.
  if(raw.opponentLevel!==undefined&&
     (!Number.isSafeInteger(raw.opponentLevel)||
      raw.opponentLevel<1||raw.opponentLevel>9999))
    throw new RangeError('Encounter opponentLevel must be a positive integer');
  const opponents = trainerActorId ? normalizeNpcTrainerRosterV1(raw.opponents) : Object.freeze([
    Object.freeze({
      creatureId:requiredText(raw.opponentCreatureId,'opponentCreatureId'),
      ...(raw.opponentLevel===undefined?{}:{level:raw.opponentLevel})
    })
  ]);
  if(!opponents.length)throw new RangeError('Trainer encounter needs at least one published opponent');
  const combatArenaIds = normalizeCombatArenaIdsV1(raw.combatArenaIds);

  return Object.freeze({
    schema: CAPTURE_ENCOUNTER_SNAPSHOT_SCHEMA,
    version: CAPTURE_ENCOUNTER_SNAPSHOT_VERSION,
    encounterId,
    source,
    player: Object.freeze({
      partyRef: playerPartyRef
    }),
    opponents,
    rules: Object.freeze({
      rulesetId,
      ...(raw.wildStatProfile===undefined?{}:{wildStatProfile:normalizeWorldEncounterStatProfileV1(raw.wildStatProfile)})
    }),
    context: Object.freeze({
      areaId,
      terrainFamilyId,
      elementId,
      ...(trainerActorId ? {trainerActorId} : {}),
      ...(trainerActorId&&raw.trainerReward!==undefined?
        {trainerReward:normalizeNpcTrainerRewardV1(raw.trainerReward)}:{}),
      ...(combatArenaIds.length ? {combatArenaIds:Object.freeze(combatArenaIds)} : {})
    }),
    returnToken
  });
}
