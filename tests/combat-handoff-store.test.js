import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCombatHandoffEnvelope,
  saveCombatHandoff,
  readCombatHandoff,
  attachCombatResult,
  consumeCombatResult,
  COMBAT_HANDOFF_STORAGE_KEY
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


test('an unreadable pending CombatResult is NEVER deleted or acknowledged, even after refresh',()=>{
 const store=storage();
 for(const corrupted of ['{broken','',JSON.stringify({version:1,snapshot:{bad:1}})]){
  store.setItem(COMBAT_HANDOFF_STORAGE_KEY,corrupted);
  assert.throws(()=>readCombatHandoff(store),/Combat handoff|handoff|corrompu|invalid|incompatible/i);
  assert.equal(store.getItem(COMBAT_HANDOFF_STORAGE_KEY),corrupted,
   'The exact raw handoff must remain recoverable for diagnosis/export');
  assert.throws(()=>consumeCombatResult(store),/Combat handoff|handoff|corrompu|invalid|incompatible/i);
  assert.equal(store.getItem(COMBAT_HANDOFF_STORAGE_KEY),corrupted,
   'Failed result read cannot consume or erase a pending CombatResult');
 }
});

test('a future handoff schema version is refused, NEVER coerced to v1 or erased',()=>{
 const store=storage();
 saveCombatHandoff(store,{
  snapshot:snapshot(),
  returnState:{areaId:'forest-exterior',x:10,y:20,returnUrl:'/resume'}
 });
 const original=JSON.parse(store.getItem(COMBAT_HANDOFF_STORAGE_KEY));
 original.version=2;
 const exact=JSON.stringify(original);
 store.setItem(COMBAT_HANDOFF_STORAGE_KEY,exact);
 assert.throws(()=>readCombatHandoff(store),/version|incompatible/i);
 assert.equal(store.getItem(COMBAT_HANDOFF_STORAGE_KEY),exact);
 assert.throws(()=>consumeCombatResult(store),/version|incompatible/i);
 assert.equal(store.getItem(COMBAT_HANDOFF_STORAGE_KEY),exact);
});

test('valid pending CombatResult survives repeated reads until the one explicit consume',()=>{
 const store=storage();
 const envelope=createCombatHandoffEnvelope({
  snapshot:snapshot(),
  returnState:{areaId:'forest-exterior',x:10,y:20,returnUrl:'/resume'}
 });
 const withResult=attachCombatResult(envelope,createCaptureCombatResult({
  encounterId:'encounter-1',returnToken:'return-1',outcome:'victory'
 }));
 saveCombatHandoff(store,withResult);
 const exact=store.getItem(COMBAT_HANDOFF_STORAGE_KEY);
 assert.equal(readCombatHandoff(store).result.outcome,'victory');
 assert.equal(readCombatHandoff(store).result.outcome,'victory');
 assert.equal(store.getItem(COMBAT_HANDOFF_STORAGE_KEY),exact);
 assert.equal(consumeCombatResult(store).result.outcome,'victory');
 assert.equal(store.getItem(COMBAT_HANDOFF_STORAGE_KEY),null);
});
