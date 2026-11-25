import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectDefeatedPlacedWildV1} from '../src/actors/npc-wild-defeat-projection-v1.js';
import {readScopedAdventurePlayingPartyV1,adventurePlayingPartyStorageKeyV1,
 ADVENTURE_PLAYING_PARTY_SCHEMA_V1} from '../src/encounters/adventure-playing-party-v1.js';

const area='area-forest',sessionId='session-wild-20261125',worldId='world-main',sha='a'.repeat(40);
const actors=Object.freeze([
 Object.freeze({id:'gorice-trainer',npc:{kind:'trainer'}}),
 Object.freeze({id:'wild-1',npc:{kind:'wild',wildCreature:{creatureId:'crea_water'}}}),
 Object.freeze({id:'wild-2',npc:{kind:'wild',wildCreature:{creatureId:'crea_fire'}}}),
 Object.freeze({id:'merchant-1',npc:{kind:'merchant'}})
]);
const victories=[{areaId:area,actorId:'wild-1'}];
test('one defeated wild disappears in Jouer but trainers, shops and other wild remain',()=>{
 const filtered=projectDefeatedPlacedWildV1(actors,victories,area);
 assert.deepEqual(filtered.map(x=>x.id),['gorice-trainer','wild-2','merchant-1']);
 assert.equal(actors.length,4,'WorldArea author placements are immutable');
 assert.equal(projectDefeatedPlacedWildV1(actors,victories,'area-other'),actors,
  'Victory in another area cannot remove this actor');
 assert.equal(projectDefeatedPlacedWildV1(actors,[],area),actors,
  'Tester / old save without victories keeps its original NPCs');
});
test('strict session-scoped projection rejects forged or duplicate defeated actor receipts',()=>{
 const values=new Map();
 const storage={setItem:(key,value)=>values.set(key,String(value)),getItem:key=>values.get(key)??null};
 const key=adventurePlayingPartyStorageKeyV1(sessionId);
 const sample=()=>({
  schema:ADVENTURE_PLAYING_PARTY_SCHEMA_V1,version:1,sessionId,worldId,
  combatSha:sha,partyRef:'adventure-party:'+sessionId,
  active:{instanceId:'player-1',speciesId:'crea_water',level:10,hp:20},
  wildVictories:victories
 });
 const read=()=>readScopedAdventurePlayingPartyV1({
  storage,sessionId,worldId,authorSha:sha,engineSha:sha,
  allowedCreatureIds:['crea_water']
 });
 storage.setItem(key,JSON.stringify(sample()));
 assert.deepEqual(read().wildVictories,victories);
 storage.setItem(key,JSON.stringify({...sample(),wildVictories:[...victories,...victories]}));
 assert.throws(read,/Duplicate/);
 storage.setItem(key,JSON.stringify({...sample(),wildVictories:[{areaId:area,actorId:'../invalid'}]}));
 assert.throws(read,/wild victory actor/);
});
test('the same projection feeds drawn actors, dialog selection, wild contact and combat checks',()=>{
 const sculpt=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(sculpt,/function npcActorsWithDefinitions\(\)[\s\S]*?projectDefeatedPlacedWildV1\(authored,/);
 assert.match(sculpt,/function gameplayPlacedActors\(\)[\s\S]*?npcActorsWithDefinitions\(\)/);
 assert.match(sculpt,/nearestWildContact\(\{actors:npcActorsWithDefinitions\(\)/);
});
