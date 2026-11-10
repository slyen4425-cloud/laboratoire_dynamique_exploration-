import {normalizeWorldEncounterStatProfileV1} from './wild-stat-profile-contract-v1.js';
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
  const opponentCreatureId = requiredText(
    raw.opponentCreatureId,
    'opponentCreatureId'
  );
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

  return Object.freeze({
    schema: CAPTURE_ENCOUNTER_SNAPSHOT_SCHEMA,
    version: CAPTURE_ENCOUNTER_SNAPSHOT_VERSION,
    encounterId,
    source,
    player: Object.freeze({
      partyRef: playerPartyRef
    }),
    opponents: Object.freeze([
      Object.freeze({
        creatureId: opponentCreatureId,
        ...(raw.opponentLevel===undefined?{}:{level:raw.opponentLevel})
      })
    ]),
    rules: Object.freeze({
      rulesetId,
      ...(raw.wildStatProfile===undefined?{}:{wildStatProfile:normalizeWorldEncounterStatProfileV1(raw.wildStatProfile)})
    }),
    context: Object.freeze({
      areaId,
      terrainFamilyId,
      elementId
    }),
    returnToken
  });
}
