import test from 'node:test';
import assert from 'node:assert/strict';
import {readScopedAdventurePlayingPartyV1} from '../src/encounters/adventure-playing-party-v1.js';

const sha='c'.repeat(40);
function saved(level){
 const sessionId='session-capped-test',worldId='world-42';
 const data={schema:'gensrpg.capture.v2.active-party.v1',version:1,
  sessionId,worldId,combatSha:sha,partyRef:'adventure-party:'+sessionId,
  active:{instanceId:'instance-1',speciesId:'lumilo',level,hp:9.25}};
 const raw=JSON.stringify(data);
 const storage={getItem:()=>raw};
 return {read:()=>readScopedAdventurePlayingPartyV1({
  storage,sessionId,worldId,authorSha:sha,engineSha:sha,allowedCreatureIds:['lumilo']
 }),raw};
}
test('native Exploration reads the exact authorised high level, without inventing a 100 cap',()=>{
 for(const n of [101,250,1500,1_000_000])
  assert.equal(saved(n).read().active.level,n);
 assert.equal(saved(1).read().active.level,1);
});
test('native Exploration rejects invalid gameplay level without destroying a pending projection',()=>{
 for(const n of [0,-1,1.5,NaN,Number.MAX_SAFE_INTEGER+1]){
  const x=saved(n);
  assert.throws(x.read,/level/i);
  assert.equal(JSON.parse(x.raw).active.level,n,
   'transport data stays untouched on a rejected grant');
 }
});
