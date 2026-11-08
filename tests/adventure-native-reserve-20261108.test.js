import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readScopedAdventurePlayingPartyV1,adventurePlayingPartyStorageKeyV1}
 from '../src/encounters/adventure-playing-party-v1.js';

const sessionId='adventure-real-six',worldId='Forêt 1',sha='a'.repeat(40);
const player=(instanceId,speciesId,hp=10)=>({
 instanceId,speciesId,level:1,hp,statAllocations:{health:2}
});
function read(record){
 const key=adventurePlayingPartyStorageKeyV1(sessionId),json=JSON.stringify(record);
 const storage={getItem:k=>k===key?json:null};
 const original=()=>storage.getItem(key);
 const result=()=>readScopedAdventurePlayingPartyV1({storage,sessionId,worldId,
  authorSha:sha,engineSha:sha,allowedCreatureIds:['a','b']});
 return {original,result,json};
}
const base=()=>({schema:'gensrpg.capture.v2.active-party.v1',version:1,
 sessionId,worldId,combatSha:sha,partyRef:'adventure-party:'+sessionId,
 active:player('i1','a'),reserve:[player('i2','b',0),player('i3','a',8)],
 combatHpMultiplier:0.25});
test('read-only Explorer preserves all 1–6 saved members, order, KO and independent stat wallets',()=>{
 const x=read(base()),value=x.result();
 assert.deepEqual(value.reserve,base().reserve);
 assert.deepEqual(value.active,base().active);
 assert.ok(Object.isFrozen(value.reserve));
 assert.ok(Object.isFrozen(value.reserve[0]));
 assert.ok(Object.isFrozen(value.reserve[1].statAllocations));
 assert.equal(x.original(),x.json,'never modify GenSRPG save or grant');
});
test('unknown species, duplicate instances, too many members and bad HP fail closed',()=>{
 const input=base();const invalid=[
 {...input,reserve:[...input.reserve,player('i1','a')]},
 {...input,reserve:[player('i2','ghost')]},
 {...input,reserve:Array.from({length:6},(_,i)=>player('fresh-'+i,'a'))},
 {...input,reserve:[player('i2','b',-1)]},
 {...input,reserve:[{...player('i2','b'),statAllocations:{health:-1}}]},
 {...input,reserve:'not an array'}
 ];
 for(const p of invalid){const x=read(p);
  assert.throws(()=>x.result(),/duplicate|reserve|published|creature|HP|point/i);
  assert.equal(x.original(),x.json);
 }
});
test('Explorer delegates native roster and returns member HP without editing result authority',()=>{
 const bridge=readFileSync(new URL('../integration/combat-bridge/exploration-native-source-v1.js',import.meta.url),'utf8');
 const host=readFileSync(new URL('../integration/combat-bridge/exploration-encounter.js',import.meta.url),'utf8');
 assert.match(bridge,/localReserve:adventureParty\.reserve\?\?\[\]/);
 assert.match(bridge,/Official Combat did not register all Adventure party members/);
 assert.match(host,/localInstanceIdsByMemberId/);
 assert.match(host,/recordCombatResult\(handoff,resolved,state\.fighters\['local-1'\]\.hp/);
 assert.doesNotMatch(host,/createCombatSession\s*\(/,'Explorer must not instantiate a rival CombatSession');
});
