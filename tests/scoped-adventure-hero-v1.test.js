import test from 'node:test';
import assert from 'node:assert/strict';
import {adventureHeroSelectionStorageKeyV1,readScopedAdventureHeroSelectionV1,ADVENTURE_HERO_SELECTION_SCHEMA_V1} from '../src/actors/scoped-adventure-hero-v1.js';

const sessionId='session-a',worldId='world-forest';
const heroDefinitionId='hero.user.00000000-0000-4000-8000-000000000001';
const key=()=>adventureHeroSelectionStorageKeyV1(sessionId);
const grant=()=>({schema:ADVENTURE_HERO_SELECTION_SCHEMA_V1,version:1,sessionId,worldId,heroDefinitionId});
const storage=raw=>({getItem(k){return k===key()?raw:null;}});
const read=raw=>readScopedAdventureHeroSelectionV1({storage:storage(raw),sessionId,worldId});
test('missing optional Hero grant keeps unchanged native standalone/demo rendering',()=>{
 assert.equal(read(null),null);
 assert.equal(key(),'gensrpg.capture.v2.hero-selection.v1:session-a');
});
test('valid exact session and world grant exposes only the official hero definition ID',()=>{
 assert.equal(read(JSON.stringify(grant())),heroDefinitionId);
});
test('hero selection rejects stale sessions, different worlds, schema/version, unknown fields and hand-entered file paths',()=>{
 const variants=[
  {...grant(),sessionId:'session-b'},
  {...grant(),worldId:'world-other'},
  {...grant(),version:2},
  {...grant(),schema:'unknown'},
  {...grant(),imageUrl:'https://arbitrary.example/hero.png'},
  {...grant(),heroDefinitionId:'../custom-hero.png'},
  {...grant(),heroDefinitionId:'hero.demo.uncertified'},
  {...grant(),heroDefinitionId:null}
 ];
 for(const variant of variants)assert.throws(()=>read(JSON.stringify(variant)));
 assert.throws(()=>read('{broken'));
});
test('scope arguments cannot be corrupted or used to read another session key',()=>{
 assert.throws(()=>adventureHeroSelectionStorageKeyV1('../other'));
 assert.throws(()=>readScopedAdventureHeroSelectionV1({
  storage:storage(JSON.stringify(grant())),sessionId,worldId:'../world'
 }));
 assert.throws(()=>readScopedAdventureHeroSelectionV1({
  sessionId,worldId
 }));
});
