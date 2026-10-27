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
        creatureId: opponentCreatureId
      })
    ]),
    rules: Object.freeze({
      rulesetId
    }),
    context: Object.freeze({
      areaId,
      terrainFamilyId,
      elementId
    }),
    returnToken
  });
}
