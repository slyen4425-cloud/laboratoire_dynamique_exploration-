import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADVENTURE_PUBLISHED_ENCOUNTER_SCHEMA_V1,
  adventurePublishedEncounterStorageKeyV1,
  readScopedAdventurePublishedEncountersV1
} from '../src/encounters/adventure-published-encounters-v1.js';

const sha='a'.repeat(40);
const worldId='world-main';
const sessionId='session-2026-11-04';
const grant=(ids=['crea_fire_common','crea_water'])=>({
 schema:ADVENTURE_PUBLISHED_ENCOUNTER_SCHEMA_V1,
 version:1,sessionId,worldId,combatSha:sha,allowedCreatureIds:ids
});
const storage=()=>{
 const m=new Map();
 return {
  getItem:k=>m.get(k)??null,
  setItem:(k,v)=>m.set(k,String(v)),
  snapshot:()=>m
 };
};
const read=(s,extras={})=>readScopedAdventurePublishedEncountersV1({
 storage:s,sessionId,worldId,authorSha:sha,engineSha:sha,...extras
});

test('published encounter grant is strictly tied to the REAL GenSRPG session, World and official Combat source',()=>{
 const s=storage(),g=grant();
 s.setItem(adventurePublishedEncounterStorageKeyV1(sessionId),JSON.stringify(g));
 const ids=read(s);
 assert.deepEqual(ids,['crea_fire_common','crea_water']);
 assert.equal(Object.isFrozen(ids),true);
 assert.equal(s.snapshot().size,1);
 assert.deepEqual(JSON.parse(s.getItem(adventurePublishedEncounterStorageKeyV1(sessionId))),g,
  'gate never mutates the published authority');
 assert.equal(read(s,{sessionId:'another'}),null, 'another session sees no grant and no fallback');
 assert.throws(()=>read(s,{worldId:'different-world'}),/world/i);
 assert.throws(()=>read(s,{authorSha:'b'.repeat(40)}),/Combat|sha|source/i);
 assert.throws(()=>read(s,{engineSha:'b'.repeat(40)}),/Combat|sha|source/i);
});

test('missing grant yields no allowed species, never falls back to the authored Showcase or Tester',()=>{
 const s=storage();
 assert.equal(read(s),null);
 assert.equal(s.getItem('gensrpg.exploration.play.navigation.v1'),null);
});

test('invalid and ambiguous grants are rejected and preserved for diagnosis',()=>{
 const broken=[
  {...grant(),schema:'old-schema'},
  {...grant(),version:2},
  {...grant(),allowedCreatureIds:['crea_water','crea_water']},
  {...grant(),allowedCreatureIds:['bad/path']},
  {...grant(),allowedCreatureIds:'crea_water'},
  {...grant(),allowedCreatureIds:['crea_fire_common'],combatSha:'garbage'},
  {...grant(),extraAuthority:{creatureData:[{fake:true}]}},
  {...grant(),sessionId:'another'},
  {...grant(),worldId:'another'},
 ];
 for(const raw of broken){
  const s=storage(),key=adventurePublishedEncounterStorageKeyV1(sessionId);
  s.setItem(key,JSON.stringify(raw));
  assert.throws(()=>read(s));
  assert.equal(JSON.parse(s.getItem(key)).schema,raw.schema,'save must not be deleted');
 }
 const s=storage(),key=adventurePublishedEncounterStorageKeyV1(sessionId);
 s.setItem(key,'{broken');
 assert.throws(()=>read(s),/JSON|illisi|invalid|parse/i);
 assert.equal(s.getItem(key),'{broken');
});
