import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 readScopedAdventurePlayingPartyV1,adventurePlayingPartyStorageKeyV1
} from '../src/encounters/adventure-playing-party-v1.js';

const sha='a'.repeat(40),sessionId='owned-stats-game',worldId='authored-world';
const base=()=>({
 schema:'gensrpg.capture.v2.active-party.v1',version:1,sessionId,worldId,combatSha:sha,
 partyRef:'adventure-party:'+sessionId,
 active:{instanceId:'owned-1',speciesId:'lumilo',level:250,hp:33.47000000000003},
 combatHpMultiplier:0.25
});
function read(value){
 const raw=JSON.stringify(value),map=new Map([[adventurePlayingPartyStorageKeyV1(sessionId),raw]]);
 const storage={getItem:key=>map.get(key)??null};
 const readResult=()=>readScopedAdventurePlayingPartyV1({
  storage,sessionId,worldId,authorSha:sha,engineSha:sha,
  allowedCreatureIds:['lumilo','venombre']
 });
 return {readResult,raw:()=>map.get(adventurePlayingPartyStorageKeyV1(sessionId))};
}
test('RED: native Jouer reads the exact individual stat wallet beside level 250 and preserved fractional HP',()=>{
 const input=base();input.active.statAllocations={health:7,fire:5,custom_focus:8};
 const v=read(input);
 const result=v.readResult();
 assert.deepEqual(result.active.statAllocations,{health:7,fire:5,custom_focus:8});
 assert.equal(result.active.level,250);
 assert.equal(result.active.hp,33.47000000000003);
 assert.equal(result.combatHpMultiplier,0.25);
 assert.deepEqual(JSON.parse(v.raw()),input,'read-only Explorer never rewrites Core save');
 assert.equal(Object.isFrozen(result.active.statAllocations),true);
});
test('RED: absent wallet is an old game, not an invented bonus or default',()=>{
 const v=read(base());
 const out=v.readResult();
 assert.equal(Object.hasOwn(out.active,'statAllocations'),false);
 assert.equal(out.combatHpMultiplier,0.25);
});
test('RED: invalid wallet shape and points fail closed, preserve exact original grant bytes',()=>{
 for(const allocation of [
  null,[],3,'2',{fire:-1},{fire:1.5},{health:'7'},
  {health:Number.MAX_SAFE_INTEGER+1},{'not safe/key':1},
  {health:NaN},{health:null}
 ]){
  const p=base();p.active.statAllocations=allocation;
  const v=read(p),before=v.raw();
  assert.throws(v.readResult,/stat|allocation|point|field|safe/i);
  assert.equal(v.raw(),before,'no mutation on unsafe input');
 }
 const extra=base();extra.active.unapprovedStatAuthority={health:100};
 assert.throws(read(extra).readResult,/field/i);
});
test('real native bridge forwards only the Combat-owned active instance and never adds stats in standalone Tester',()=>{
 const bridge=readFileSync(new URL('../integration/combat-bridge/exploration-native-source-v1.js',import.meta.url),'utf8');
 assert.match(bridge,/local:adventureParty\.active/,'one direct instance projection into official Combat');
 assert.match(bridge,/buildCaptureEncounterCombatSourceV1/);
 assert.match(bridge,/buildCaptureEditorCombatTestV1/,'Tester stays official but disconnected from Aventure');
 assert.doesNotMatch(bridge,/statValuesById\s*[:=]|projectCaptureStatEffectsV1/,
  'Exploration never owns or computes Combat stat effects');
});
