import test from 'node:test';
import assert from 'node:assert/strict';
import {
 readScopedAdventurePlayingPartyV1,
 adventurePlayingPartyStorageKeyV1,
 ADVENTURE_PLAYING_PARTY_SCHEMA_V1
} from '../src/encounters/adventure-playing-party-v1.js';
import {
 readScopedAdventurePublishedEncountersV1,
 adventurePublishedEncounterStorageKeyV1
} from '../src/encounters/adventure-published-encounters-v1.js';
const sessionId='session-2026-11-04',worldId='world-main',combatSha='a'.repeat(40);
function storage(){
 const values=new Map();
 return {getItem:k=>values.get(k)??null,
  setItem:(k,v)=>values.set(k,String(v)),dump:()=>[...values.entries()]};
}
const sample=()=>({schema:ADVENTURE_PLAYING_PARTY_SCHEMA_V1,version:1,
 sessionId,worldId,combatSha,partyRef:'adventure-party:'+sessionId,
 active:{instanceId:'capture-instance-1',speciesId:'crea_water',level:8,hp:35}});
function authorised(storage){
 storage.setItem(adventurePublishedEncounterStorageKeyV1(sessionId),
  JSON.stringify({schema:'gensrpg.capture.v2.published-encounters.v1',
   version:1,sessionId,worldId,combatSha,
   allowedCreatureIds:['crea_water','crea_fire']}));
 return readScopedAdventurePublishedEncountersV1({
  storage,sessionId,worldId,authorSha:combatSha,engineSha:combatSha
 });
}
function read(storage,allowedCreatureIds,extra={}){
 return readScopedAdventurePlayingPartyV1({storage,sessionId,worldId,
  authorSha:combatSha,engineSha:combatSha,allowedCreatureIds,...extra});
}
test('official Combat grant authorises ONLY the true same-origin Adventure party species, level and HP',()=>{
 const s=storage(),allowed=authorised(s),party=sample(),key=adventurePlayingPartyStorageKeyV1(sessionId);
 s.setItem(key,JSON.stringify(party));
 const result=read(s,allowed);
 assert.deepEqual(result,{...party,combatHpMultiplier:1},'historical party keeps full battle HP');
 assert.equal(Object.isFrozen(result),true);
 assert.equal(Object.isFrozen(result.active),true);
 assert.deepEqual(JSON.parse(s.getItem(key)),party,'Exploration must not rewrite GenSRPG party authority');
});
test('reads the exact fractional HP from the previous native fight',()=>{
 const s=storage(),allowed=authorised(s),party=sample();
 party.active.hp=33.47000000000003;
 s.setItem(adventurePlayingPartyStorageKeyV1(sessionId),JSON.stringify(party));
 assert.equal(read(s,allowed).active.hp,party.active.hp);
});
test('missing party is never replaced by fixed preview creature or default lv20',()=>{
 const s=storage(),allowed=authorised(s);
 assert.equal(read(s,allowed),null);
 assert.equal(read(s,allowed,{sessionId:'another-session'}),null);
 assert.equal(s.getItem('gensrpg.exploration.play.navigation.v1'),null);
});
test('reject fake species, wrong partyRef, different world, stale Combat main or unsupported member',()=>{
 const invalid=[
  {...sample(),partyRef:'capture-party-player-v1'},
  {...sample(),partyRef:'adventure-party:other'},
  {...sample(),sessionId:'other-session'},
  {...sample(),worldId:'other-world'},
  {...sample(),combatSha:'b'.repeat(40)},
  {...sample(),active:{...sample().active,speciesId:'unpublished'}},
  {...sample(),active:{...sample().active,level:0}},
  {...sample(),active:{...sample().active,level:101}},
  {...sample(),active:{...sample().active,hp:-1}},
  {...sample(),active:{...sample().active,instanceId:'illegal/path'}},
  {...sample(),extra:'another authority'}
 ];
 for(const entry of invalid){
  const s=storage(),allowed=authorised(s),key=adventurePlayingPartyStorageKeyV1(sessionId);
  s.setItem(key,JSON.stringify(entry));
  assert.throws(()=>read(s,allowed),/party|session|world|Combat|species|creature|level|HP|field|instance/i);
  assert.deepEqual(JSON.parse(s.getItem(key)),entry,'invalid input preserved for diagnosis');
 }
});
test('missing or corrupt publication grant does not authorize an unknown party',()=>{
 const s=storage(),key=adventurePlayingPartyStorageKeyV1(sessionId);
 s.setItem(key,JSON.stringify(sample()));
 assert.throws(()=>read(s,null),/Bestiaire|allowed|published|publication/i);
 assert.throws(()=>read(s,['crea_fire']),/published|creature|Bestiaire/i);
 const allowed=authorised(s);
 s.setItem(key,'{garbage');
 assert.throws(()=>read(s,allowed),/JSON|illisi|parse/i);
 assert.equal(s.getItem(key),'{garbage');
});
