// Must run after assembling combat-preview from current official Combat main.
// Tests the real Combat adapters and Combat Session; intentionally does NOT
// compare engine files or an immutable SHA to the last Exploration build.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildExplorationNativeCombatSourceV1} from '../combat-preview/examples/dom-demo/exploration-native-source-v1.js';
import {loadCoop2v2CombatSource} from '../combat-preview/src/ui/combat-2v2-test-ui.js';
import {createCombatSession} from '../combat-preview/src/core/combat/combat-session.js';

const json = path => JSON.parse(readFileSync(new URL('../combat-preview/' + path, import.meta.url), 'utf8'));
const creatures = json('data/capture/monster-capture-creatures.v1.json');
const party = json('examples/dom-demo/party.preview.v1.json');
const nativeSkillCatalog = json('data/combat/skills/catalog.v1.json');
const baseFighterRules = json('data/combat/fighters/maraileron.combat.json');
assert.ok(creatures.entries.length > 10, 'Official Capture creature catalog not loaded');
for (const [opponentId,name] of [['crea_nat_3','Ancêtronc'],['crea_ombre_1','Ombrelot']]) {
  const snapshot = {
    schema:'capture-encounter-snapshot-v1',version:1,
    encounterId:'native-smoke-' + opponentId, returnToken:'return-' + opponentId,
    source:'terrain-random', player:{partyRef:party.id},
    opponents:[{creatureId:opponentId}],
    rules:{rulesetId:'capture.standard.1v1'},
    context:{areaId:'forest',terrainFamilyId:'forest',elementId:'nature'},
    futureOptionalFields:{compatible:true}
  };
  const source = buildExplorationNativeCombatSourceV1({
    snapshot, creatureRecords:creatures.entries, party,
    nativeSkillCatalog, baseFighterRules
  });
  assert.equal(source.battleFormat.actors[1].creatureId,opponentId);
  assert.equal(source.battleFormat.actors[1].displayName,name);
  const official = await loadCoop2v2CombatSource({nativeCombatSource:source});
  assert.equal(official.format.actors.length,2);
  assert.ok(official.skillsById[source.skillIdsByActor['opponent-1'][0]]);
  const session = createCombatSession({
    distance:'medium',battleFormat:official.format,
    fighters:official.fighters,skillSpeedMultiplier:official.skillSpeedMultiplier
  });
  const before = session.snapshot();
  assert.ok(before.fighters['local-1'].hp > 0);
  assert.ok(before.fighters['opponent-1'].hp > 0);
  session.advanceMs(30000);
  const ability = official.skillsById[source.skillIdsByActor['local-1'][0]];
  const hit = session.useSkill({actorId:'local-1',targetId:'opponent-1',skill:ability});
  assert.equal(hit.ok,true,'Real Combat Session must accept a Capture ability: ' + hit.outcome);
  assert.ok(session.snapshot().fighters['opponent-1'].hp <= before.fighters['opponent-1'].hp);
  console.log('GREEN official Combat Session / Encounter ' + opponentId + ' / ' + name);
}
