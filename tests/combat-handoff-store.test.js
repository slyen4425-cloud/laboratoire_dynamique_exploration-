import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCombatHandoffEnvelope,
  saveCombatHandoff,
  readCombatHandoff,
  attachCombatResult,
  consumeCombatResult
} from '../src/encounters/combat-handoff-store.js';
import {
  createCaptureEncounterSnapshot
} from '../src/encounters/capture-encounter-contract.js';
import {
  createCaptureCombatResult
} from '../src/encounters/capture-combat-result-contract.js';

function storage() {
  const map = new Map();
  return {
    getItem(key) { return map.get(key) ?? null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

function snapshot() {
  return createCaptureEncounterSnapshot({
    encounterId: 'encounter-1',
    playerPartyRef: 'capture-party-preview',
    opponentCreatureId: 'crea_nat_3',
    rulesetId: 'capture.standard.1v1',
    areaId: 'forest-exterior',
    terrainFamilyId: 'forest',
    elementId: 'nature',
    returnToken: 'return-1'
  });
}

test('combat handoff keeps Exploration return state outside the combat snapshot', () => {
  const envelope = createCombatHandoffEnvelope({
    snapshot: snapshot(),
    returnState: {
      areaId: 'forest-exterior',
      x: 526.8,
      y: 898.6,
      returnUrl: '/laboratoire_dynamique_exploration-/index.html?combatReturn=1'
    }
  });

  assert.equal(envelope.snapshot.context.areaId, 'forest-exterior');
  assert.deepEqual(envelope.returnState, {
    areaId: 'forest-exterior',
    x: 526.8,
    y: 898.6,
    returnUrl: '/laboratoire_dynamique_exploration-/index.html?combatReturn=1'
  });
  assert.equal('x' in envelope.snapshot, false);
  assert.equal(envelope.result, null);
});

test('result must match encounterId and returnToken before attachment', () => {
  const envelope = createCombatHandoffEnvelope({
    snapshot: snapshot(),
    returnState: {
      areaId: 'forest-exterior',
      x: 10,
      y: 20,
      returnUrl: '/return'
    }
  });

  assert.throws(
    () => attachCombatResult(
      envelope,
      createCaptureCombatResult({
        encounterId: 'wrong',
        returnToken: 'return-1',
        outcome: 'victory'
      })
    ),
    /encounterId/
  );
});

test('combat result is consumed exactly once', () => {
  const store = storage();
  const envelope = createCombatHandoffEnvelope({
    snapshot: snapshot(),
    returnState: {
      areaId: 'forest-exterior',
      x: 10,
      y: 20,
      returnUrl: '/return'
    }
  });

  saveCombatHandoff(store, envelope);
  const loaded = readCombatHandoff(store);

  const withResult = attachCombatResult(
    loaded,
    createCaptureCombatResult({
      encounterId: 'encounter-1',
      returnToken: 'return-1',
      outcome: 'victory'
    })
  );
  saveCombatHandoff(store, withResult);

  const consumed = consumeCombatResult(store);
  assert.equal(consumed.result.outcome, 'victory');
  assert.equal(readCombatHandoff(store), null);
  assert.equal(consumeCombatResult(store), null);
});
