import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {setAreaEncounterLevelRange} from '../src/builder/world-builder-draft.js';
import {rollAreaEncounterOpponentLevel} from '../src/encounters/encounter-controller.js';
import {snapshotFromEncounterIntent} from '../src/encounters/encounter-bridge.js';
import {createCombatHandoffEnvelope} from '../src/encounters/combat-handoff-store.js';

const base={id:'area-1',kind:'exterior',width:1200,height:800};
const fields={encounterId:'e1',returnToken:'r1',source:'terrain-random',
 playerPartyRef:'adventure-party:s1',opponentCreatureId:'creature-1',rulesetId:'capture.standard.1v1',
 areaId:'area-1',terrainFamilyId:'terrain.grass',elementId:'nature'};
test('old WorldAreas remain byte-compatible without an implicit level cap',()=>{
 const area=normalizeWorldArea({...base,encounters:{randomEnabled:true}});
 assert.deepEqual(Object.keys(area.encounters),['randomEnabled']);
 assert.equal(rollAreaEncounterOpponentLevel(area,()=>0.8),null);
 const snapshot=snapshotFromEncounterIntent(fields);
 assert.deepEqual(snapshot.opponents,[{creatureId:'creature-1'}]);
});
test('World Builder persists the authored per-Area range without mutating other Areas',()=>{
 const draft={areas:[{...base,encounters:{randomEnabled:true}},{...base,id:'area-2',encounters:{randomEnabled:false}}]};
 const next=setAreaEncounterLevelRange(draft,'area-1',{minLevel:1,maxLevel:5});
 assert.equal(draft.areas[0].encounters.minLevel,undefined);
 assert.equal(next.areas[1].encounters.minLevel,undefined);
 const result=normalizeWorldArea(next.areas[0]);
 assert.equal(result.encounters.minLevel,1);
 assert.equal(result.encounters.maxLevel,5);
 assert.equal(result.encounters.randomEnabled,true);
 assert.throws(()=>setAreaEncounterLevelRange(draft,'area-1',{minLevel:6,maxLevel:5}),/minimum/);
 assert.throws(()=>normalizeWorldArea({...base,encounters:{minLevel:2}}),/together/);
});
test('uniform wild level roll runs only inside the author range with boundary values',()=>{
 const area=normalizeWorldArea({...base,encounters:{randomEnabled:true,minLevel:1,maxLevel:5}});
 assert.deepEqual([0,.2,.4,.6,.8,.9999999999].map(r=>rollAreaEncounterOpponentLevel(area,()=>r)),
  [1,2,3,4,5,5]);
 for(const value of [null,NaN,-1,1,Infinity])
  assert.ok(rollAreaEncounterOpponentLevel(area,()=>value)>=1);
 const single=normalizeWorldArea({...base,encounters:{minLevel:17,maxLevel:17}});
 assert.equal(rollAreaEncounterOpponentLevel(single,()=>.99),17);
});
test('optional level reaches persisted Combat snapshot without changing legacy v1 schema',()=>{
 const snapshot=snapshotFromEncounterIntent({...fields,opponentLevel:4});
 assert.equal(snapshot.opponents[0].level,4);
 const envelope=createCombatHandoffEnvelope({
  snapshot,returnState:{areaId:'area-1',x:12,y:22,returnUrl:'https://game.test/play.html'},
 });
 assert.equal(envelope.snapshot.opponents[0].level,4);
 assert.equal(envelope.snapshot.version,1);
 assert.throws(()=>snapshotFromEncounterIntent({...fields,opponentLevel:0}),/positive integer/);
});
test('the native Combat adapter consumes the author level, without a second stats engine',()=>{
 const bridge=readFileSync(new URL('../integration/combat-bridge/exploration-native-source-v1.js',import.meta.url),'utf8');
 assert.match(bridge,/opponent:\{speciesId:enemyId,level:authoredEnemyLevel\?\?/);
 assert.match(bridge,/buildCaptureEncounterCombatSourceV1/);
 assert.doesNotMatch(bridge,/Math\.random\(/);
 const html=readFileSync(new URL('../world-assembler.html',import.meta.url),'utf8');
 assert.match(html,/id="world-area-encounter-levels"/);
 assert.match(html,/id="area-encounter-min-level"/);
 assert.match(html,/id="area-encounter-max-level"/);
});
