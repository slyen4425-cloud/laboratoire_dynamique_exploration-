import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readScopedAdventurePlayingPartyV1,ADVENTURE_PLAYING_PARTY_SCHEMA_V1,adventurePlayingPartyStorageKeyV1} from '../src/encounters/adventure-playing-party-v1.js';

const sha='a'.repeat(40),sessionId='game-1',worldId='world-1';
const storage=new Map();
const adapter={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
const grant=(combatHpMultiplier)=>({
 schema:ADVENTURE_PLAYING_PARTY_SCHEMA_V1,version:1,sessionId,worldId,combatSha:sha,
 partyRef:'adventure-party:'+sessionId,
 active:{instanceId:'member-1',speciesId:'crea_nature',level:1,hp:null},
 ...(combatHpMultiplier===undefined?{}:{combatHpMultiplier})
});
function read(value){
 storage.clear();adapter.setItem(adventurePlayingPartyStorageKeyV1(sessionId),JSON.stringify(value));
 return readScopedAdventurePlayingPartyV1({
  storage:adapter,sessionId,worldId,authorSha:sha,engineSha:sha,
  allowedCreatureIds:['crea_nature','crea_ice']
 });
}

test('RED: Exploration validates the game policy 25% without modifying real saved member HP',()=>{
 const result=read(grant(0.25));
 assert.equal(result.combatHpMultiplier,0.25);
 assert.deepEqual(result.active,{instanceId:'member-1',speciesId:'crea_nature',level:1,hp:null});
 const saved=grant(0.25);saved.active.hp=33.47000000000003;
 assert.equal(read(saved).active.hp,33.47000000000003);
});

test('RED: old parties are full-strength; forged or incorrect coefficients rejected',()=>{
 assert.equal(read(grant()).combatHpMultiplier,1);
 for(const v of [0,-2,1.3,NaN,'0.25',null]){
  assert.throws(()=>read(grant(v)),/combatHpMultiplier|fields/i);
 }
 assert.throws(()=>read({...grant(0.25),other:'unsupported'}),/fields/);
});

test('RED: only true Adventure encounters pass global policy to Combat builder, standalone Tester untouched',()=>{
 const bridge=readFileSync(new URL('../integration/combat-bridge/exploration-native-source-v1.js',import.meta.url),'utf8');
 assert.match(bridge,/hpMultiplier:\s*adventureParty\.combatHpMultiplier/);
 assert.match(bridge,/buildCaptureEditorCombatTestV1/);
});
