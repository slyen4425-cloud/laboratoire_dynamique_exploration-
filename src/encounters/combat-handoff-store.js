import {
  createCaptureEncounterSnapshot
} from './capture-encounter-contract.js?rev=phase7-snapshot-v1';
import {
  createCaptureCombatResult
} from './capture-combat-result-contract.js?rev=phase7-combat-handoff-v1';

export const COMBAT_HANDOFF_STORAGE_KEY =
  'gensrpg.capture.combat-handoff.v1';
export const COMBAT_HANDOFF_VERSION = 1;

function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${field} must be finite`);
  }
  return number;
}

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}

function normalizeSnapshot(raw) {
  if (
    raw?.schema !== 'capture-encounter-snapshot-v1' ||
    raw?.version !== 1
  ) {
    throw new RangeError(
      'snapshot must be CaptureEncounterSnapshot v1'
    );
  }

  return createCaptureEncounterSnapshot({
    encounterId: raw.encounterId,
    source: raw.source,
    playerPartyRef: raw.player?.partyRef,
    opponentCreatureId:
      raw.opponents?.[0]?.creatureId,
    rulesetId: raw.rules?.rulesetId,
    areaId: raw.context?.areaId,
    terrainFamilyId:
      raw.context?.terrainFamilyId,
    elementId: raw.context?.elementId,
    returnToken: raw.returnToken
  });
}

function normalizeReturnState(raw = {}) {
  return Object.freeze({
    areaId: requiredText(raw.areaId, 'returnState.areaId'),
    x: finite(raw.x, 'returnState.x'),
    y: finite(raw.y, 'returnState.y'),
    returnUrl: requiredText(
      raw.returnUrl,
      'returnState.returnUrl'
    )
  });
}

export function createCombatHandoffEnvelope({
  snapshot,
  returnState,
  result = null
} = {}) {
  const normalizedSnapshot =
    normalizeSnapshot(snapshot);

  const normalizedResult =
    result === null
      ? null
      : createCaptureCombatResult(result);

  if (
    normalizedResult &&
    normalizedResult.encounterId !==
      normalizedSnapshot.encounterId
  ) {
    throw new RangeError(
      'result encounterId must match snapshot'
    );
  }

  if (
    normalizedResult &&
    normalizedResult.returnToken !==
      normalizedSnapshot.returnToken
  ) {
    throw new RangeError(
      'result returnToken must match snapshot'
    );
  }

  return Object.freeze({
    version: COMBAT_HANDOFF_VERSION,
    snapshot: normalizedSnapshot,
    returnState: normalizeReturnState(returnState),
    result: normalizedResult
  });
}

export function attachCombatResult(
  envelope,
  rawResult
) {
  const current = createCombatHandoffEnvelope(
    envelope
  );
  const result = createCaptureCombatResult(
    rawResult
  );

  if (
    result.encounterId !== current.snapshot.encounterId
  ) {
    throw new RangeError(
      'result encounterId must match snapshot'
    );
  }

  if (
    result.returnToken !== current.snapshot.returnToken
  ) {
    throw new RangeError(
      'result returnToken must match snapshot'
    );
  }

  return createCombatHandoffEnvelope({
    snapshot: current.snapshot,
    returnState: current.returnState,
    result
  });
}

export function saveCombatHandoff(
  storage,
  envelope
) {
  const value = createCombatHandoffEnvelope(
    envelope
  );

  storage.setItem(
    COMBAT_HANDOFF_STORAGE_KEY,
    JSON.stringify(value)
  );

  return value;
}

export function readCombatHandoff(storage) {
  const text = storage.getItem(
    COMBAT_HANDOFF_STORAGE_KEY
  );
  if (!text) return null;

  try {
    return createCombatHandoffEnvelope(
      JSON.parse(text)
    );
  } catch {
    storage.removeItem(
      COMBAT_HANDOFF_STORAGE_KEY
    );
    return null;
  }
}

export function consumeCombatResult(storage) {
  const envelope = readCombatHandoff(storage);

  if (!envelope?.result) return null;

  storage.removeItem(
    COMBAT_HANDOFF_STORAGE_KEY
  );

  return envelope;
}
