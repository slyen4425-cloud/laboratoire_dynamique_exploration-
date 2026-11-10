import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {setAreaEncounterWildStatProfile} from '../src/builder/world-builder-draft.js';
import {createCaptureEncounterSnapshot} from '../src/encounters/capture-encounter-contract.js';
import {snapshotFromEncounterIntent} from '../src/encounters/encounter-bridge.js';
import {createCombatHandoffEnvelope} from '../src/encounters/combat-handoff-store.js';
import {createEncounterController} from '../src/encounters/encounter-controller.js';
import {normalizeWorldSurface} from '../src/world/surface-model.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';
const base={id:'a1',kind:'exterior',width:1000,height:800};
const profile={pointsPerLevel:20,healthMinimumPct:20,defenseMinimumPct:15,speedMinimumPct:15,specialtyMultiplier:2};
const input={encounterId:'e1',returnToken:'r1',source:'terrain-random',
 playerPartyRef:'adventure-party:s1',opponentCreatureId:'fire-1',opponentLevel:10,
 rulesetId:'standard',areaId:'a1',terrainFamilyId:'forest',elementId:'fire'};
test('legacy WorldArea and snapshot keep exact original keys',()=>{
 const area=normalizeWorldArea({...base,encounters:{randomEnabled:true}});
 assert.deepEqual(Object.keys(area.encounters),['randomEnabled']);
 const plain=createCaptureEncounterSnapshot(input);
 assert.deepEqual(Object.keys(plain.rules),['rulesetId']);
});
test('author edits only the real WorldDocument selected Area',()=>{
 const draft={areas:[{...base,encounters:{minLevel:5,maxLevel:10}},{...base,id:'a2'}]};
 const next=setAreaEncounterWildStatProfile(draft,'a1',profile);
 assert.equal(draft.areas[0].encounters.wildStatProfile,undefined);
 assert.equal(next.areas[1].encounters,undefined);
 const area=normalizeWorldArea(next.areas[0]);
 assert.deepEqual(area.encounters.wildStatProfile,profile);
 assert.equal(Object.isFrozen(area.encounters.wildStatProfile),true);
});
test('profile survives snapshot and strict return handoff',()=>{
 const snapshot=snapshotFromEncounterIntent({...input,wildStatProfile:profile});
 assert.deepEqual(snapshot.rules.wildStatProfile,profile);
 const handoff=createCombatHandoffEnvelope({snapshot,
  returnState:{areaId:'a1',x:1,y:2,returnUrl:'https://game.test/play.html'}});
 assert.deepEqual(handoff.snapshot.rules.wildStatProfile,profile);
});
test('invalid profiles fail closed without touching the document',()=>{
 const draft={areas:[base]};
 for(const bad of [{healthMinimumPct:80,defenseMinimumPct:80},
  {pointsPerLevel:Infinity},{specialtyMultiplier:-1},{mystery:9}]){
  assert.throws(()=>setAreaEncounterWildStatProfile(draft,'a1',bad));
  assert.throws(()=>createCaptureEncounterSnapshot({...input,wildStatProfile:bad}));
 }
});
test('runtime encounter controller forwards profile with the authored opponent level',()=>{
 const config=normalizeTerrainFamilyEncounterConfig({families:[{
  terrainFamilyId:'forest',encounterChancePercent:100,
  elementChances:[{elementId:'fire',chancePercent:100}]
 }]});
 const catalog=createCaptureCreatureCatalogProvider({schema:'capture-database-v1',version:1,
  creatures:[{draft:{id:'fire-1',displayName:'Fire',elements:['fire'],
    capture:{spawnChance:100},presentation:null}}]});
 const area={...base,surface:normalizeWorldSurface({
  baseTerrainFamilyId:'forest',baseMaterialId:'grass.forest'
 }),encounters:{randomEnabled:true,minLevel:10,maxLevel:10,wildStatProfile:profile}};
 const controller=createEncounterController({checkDistance:20});
 const step=x=>controller.step({area,player:{currentAreaId:'a1',x,y:100},
  encounterConfig:config,captureCatalog:catalog,playerPartyRef:'adventure-party:s1',
  rulesetId:'standard',random:()=>0});
 assert.equal(step(10),null);
 const intent=step(40);
 assert.equal(intent.opponentLevel,10);
 assert.deepEqual(intent.wildStatProfile,profile);
 assert.deepEqual(snapshotFromEncounterIntent(intent).rules.wildStatProfile,profile);
});
test('World Builder has real controls; native bridge alone forwards to Combat',()=>{
 const html=readFileSync(new URL('../world-assembler.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/builder/world-assembler-main.js',import.meta.url),'utf8');
 const native=readFileSync(new URL('../integration/combat-bridge/exploration-native-source-v1.js',import.meta.url),'utf8');
 for(const id of ['world-area-wild-stat-profile','wild-points-per-level','wild-health-minimum','wild-defense-minimum','wild-speed-minimum','wild-specialty-multiplier'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(main.includes('setAreaEncounterWildStatProfile(draft,area.id,profile)'));
 assert.ok(native.includes('wildStatProfile:snapshot.rules?.wildStatProfile??{}'));
 assert.ok(native.includes('buildCaptureEncounterCombatSourceV1'));
});
