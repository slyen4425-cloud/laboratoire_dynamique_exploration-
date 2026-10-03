import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCaptureCombatResult,
  CAPTURE_COMBAT_RESULT_SCHEMA
} from '../src/encounters/capture-combat-result-contract.js';

test('CaptureCombatResult v1 keeps only the public return contract', () => {
  const result = createCaptureCombatResult({
    encounterId: 'encounter-4',
    returnToken: 'return-4',
    outcome: 'victory',
    partyState: null,
    rewards: [],
    capture: null,
    worldEffects: [],
    position: { x: 999, y: 999 },
    worldDocument: { forbidden: true }
  });

  assert.deepEqual(result, {
    schema: CAPTURE_COMBAT_RESULT_SCHEMA,
    version: 1,
    encounterId: 'encounter-4',
    returnToken: 'return-4',
    outcome: 'victory',
    partyState: null,
    rewards: [],
    capture: null,
    worldEffects: []
  });
  assert.equal('position' in result, false);
  assert.equal('worldDocument' in result, false);
});

test('CaptureCombatResult v1 accepts only declared outcomes', () => {
  for (const outcome of ['victory','defeat','fled']) {
    assert.equal(
      createCaptureCombatResult({
        encounterId: 'e',
        returnToken: 'r',
        outcome
      }).outcome,
      outcome
    );
  }

  assert.throws(
    () => createCaptureCombatResult({
      encounterId: 'e',
      returnToken: 'r',
      outcome: 'teleport-player'
    }),
    /outcome/
  );
});
