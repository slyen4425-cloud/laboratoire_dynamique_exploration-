// GitHub Actions checks out the official Combat source before this smoke.
// The same author Showcase manifests and transfers feed Encounter & Combat.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildExplorationNativeCombatSourceV1} from '../combat-preview/examples/dom-demo/exploration-native-source-v1.js';
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from '../combat-preview/src/catalogs/capture-showcase-creature-presets-v1.js';
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from '../combat-preview/src/catalogs/capture-showcase-skill-presets-v1.js';
import {loadCoop2v2CombatSource} from '../combat-preview/src/ui/combat-2v2-test-ui.js';
import {createCombatSession} from '../combat-preview/src/core/combat/combat-session.js';
import {projectCaptureShowcaseEncounterSourceV1} from '../src/capture/capture-showcase-encounter-source-v1.js';

const json = path => JSON.parse(readFileSync(new URL('../combat-preview/'+path,import.meta.url),'utf8'));
const creatureTransfers=CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.map(json);
const skillTransfers=CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.map(json);
const encounterCatalog=projectCaptureShowcaseEncounterSourceV1(creatureTransfers);
const party=json('examples/dom-demo/party.preview.v1.json');
const nativeSkillCatalog=json('data/combat/skills/catalog.v1.json');
const statRegistry=json('data/capture/monster-capture-stat-registry.v1.json');
const progressionRules=json('data/capture/monster-capture-progression-rules.v1.json');
const baseFighterRules=json('data/combat/fighters/maraileron.combat.json');
assert.equal(encounterCatalog.creatures.length,creatureTransfers.length,
 'every officially configured creature must appear in encounters');
const byId=new Map(creatureTransfers.map(x=>[x.draft.id,x]));
assert.equal(new Set(byId.keys()).size,creatureTransfers.length,'no duplicate author ID');
for(const id of byId.keys()){
  assert.ok(encounterCatalog.creatures.some(x=>x.id===id),'Missing Encounter '+id);
}
for(const [opponentId,name] of [
  ['crea_nat_1','Grainou'],
  ['crea_tox_2','Venombre'],
  ['crea_ombre_2','Noctigriffe'],
  ['kitsune_lunaire','Kitsune Lunaire'],
  ['crea-loup','Loup volcanique']
]){
  const snapshot={
    schema:'capture-encounter-snapshot-v1',version:1,
    encounterId:'native-smoke-'+opponentId,returnToken:'return-'+opponentId,
    source:'terrain-random',player:{partyRef:party.id},
    opponents:[{creatureId:opponentId}],rules:{rulesetId:'capture.standard.1v1'},
    context:{areaId:'forest',terrainFamilyId:'forest',elementId:byId.get(opponentId).draft.elements[0]}
  };
  const source=buildExplorationNativeCombatSourceV1({
    snapshot,party,showcaseCreatureTransfers:creatureTransfers,showcaseSkillTransfers:skillTransfers,
    nativeSkillCatalog,statRegistry,progressionRules,baseFighterRules,previewLevel:20
  });
  assert.equal(source.battleFormat.actors[1].creatureId,opponentId);
  assert.equal(source.battleFormat.actors[1].displayName,name);
  assert.ok(source.exported.creatures.some(x=>x.id===opponentId),
    'must be projected by Combat Editor exporter');
  const configuredSlots=byId.get(opponentId).loadout.slots.map(x=>x.skillId).filter(Boolean);
  for(const id of configuredSlots){
    assert.ok(source.skills[id],'Author skill absent in Combat: '+opponentId+'/'+id);
    assert.ok(source.skillPresentations[id]!==undefined,
      'Skill presentation not forwarded: '+id);
  }
  const official=await loadCoop2v2CombatSource({nativeCombatSource:source});
  assert.equal(official.format.actors.length,2);
  const session=createCombatSession({
    distance:'medium',battleFormat:official.format,
    fighters:official.fighters,skillSpeedMultiplier:official.skillSpeedMultiplier
  });
  const before=session.snapshot();
  assert.ok(before.fighters['local-1'].hp>0);
  assert.ok(before.fighters['opponent-1'].hp>0);
  const enemySkills=source.skillIdsByActor['opponent-1'];
  assert.ok(enemySkills.length>0,'Native Combat must have author abilities');
  if(opponentId==='crea_nat_1'){
    for(const id of ['coupe_feuille','graine_sansue_cap','Spore_soporifique'])
      assert.ok(configuredSlots.includes(id),'Current Grainou author loadout absent: '+id);
  }
  console.log('GREEN official Combat author loadout '+opponentId+'/'+name+
    ' skills='+enemySkills.join(','));
}
console.log('GREEN Encounter and Combat consume '+creatureTransfers.length+
  ' identical current author creatures and '+skillTransfers.length+' authored skill transfers');
