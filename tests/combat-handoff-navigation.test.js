import test from 'node:test';
import assert from 'node:assert/strict';

import {
  launchCombatHandoffNavigation
} from '../src/encounters/combat-handoff-navigation.js';
import {
  readCombatHandoff
} from '../src/encounters/combat-handoff-store.js';

function storage() {
  const map = new Map();
  return {
    getItem(key) { return map.get(key) ?? null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

const snapshot = {
  schema: 'capture-encounter-snapshot-v1',
  version: 1,
  encounterId: 'e1',
  source: 'terrain-random',
  player: { partyRef: 'capture-party-preview' },
  opponents: [{ creatureId: 'crea_nat_3' }],
  rules: { rulesetId: 'capture.standard.1v1' },
  context: {
    areaId: 'forest-exterior',
    terrainFamilyId: 'forest',
    elementId: 'nature'
  },
  returnToken: 'r1'
};

test('combat navigation adapter owns page navigation outside Exploration bootstrap', () => {
  const store = storage();
  let target = null;

  const launched =
    launchCombatHandoffNavigation({
      snapshot,
      player: {
        currentAreaId: 'forest-exterior',
        x: 12,
        y: 34
      },
      storage: store,
      documentUrl:
        'https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/index.html?encounterTest=1',
      navigate(url) {
        target = url;
      }
    });

  assert.equal(launched, true);
  assert.equal(
    target,
    'https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/examples/dom-demo/exploration-encounter.html'
  );

  const handoff = readCombatHandoff(store);
  assert.equal(handoff.returnState.x, 12);
  assert.equal(
    new URL(handoff.returnState.returnUrl)
      .searchParams.get('combatReturn'),
    '1'
  );
  assert.equal(
    new URL(handoff.returnState.returnUrl)
      .searchParams.get('encounterTest'),
    '1'
  );
});
