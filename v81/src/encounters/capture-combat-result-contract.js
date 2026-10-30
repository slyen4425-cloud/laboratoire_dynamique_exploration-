export const CAPTURE_COMBAT_RESULT_SCHEMA =
  'capture-combat-result-v1';
export const CAPTURE_COMBAT_RESULT_VERSION = 1;

const OUTCOMES = new Set([
  'victory',
  'defeat',
  'fled'
]);

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}

function jsonValue(value, fallback) {
  return value === undefined
    ? fallback
    : structuredClone(value);
}

export function createCaptureCombatResult(raw = {}) {
  const outcome = requiredText(raw.outcome, 'outcome');

  if (!OUTCOMES.has(outcome)) {
    throw new RangeError(
      'outcome must be victory, defeat or fled'
    );
  }

  return Object.freeze({
    schema: CAPTURE_COMBAT_RESULT_SCHEMA,
    version: CAPTURE_COMBAT_RESULT_VERSION,
    encounterId: requiredText(
      raw.encounterId,
      'encounterId'
    ),
    returnToken: requiredText(
      raw.returnToken,
      'returnToken'
    ),
    outcome,
    partyState: jsonValue(raw.partyState, null),
    rewards: Object.freeze(
      Array.isArray(raw.rewards)
        ? structuredClone(raw.rewards)
        : []
    ),
    capture: jsonValue(raw.capture, null),
    worldEffects: Object.freeze(
      Array.isArray(raw.worldEffects)
        ? structuredClone(raw.worldEffects)
        : []
    )
  });
}
