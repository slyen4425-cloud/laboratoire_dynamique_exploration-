import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertExplorationWorldDocumentIdV1}
 from '../src/world/world-document-identity-v1.js';
import {readScopedAdventureHeroSelectionV1}
 from '../src/actors/scoped-adventure-hero-v1.js';
import {readScopedAdventurePublishedEncountersV1}
 from '../src/encounters/adventure-published-encounters-v1.js';
import {readScopedAdventurePlayingPartyV1}
 from '../src/encounters/adventure-playing-party-v1.js';
import {projectAdventureInitialCombatHpV1}
 from '../src/encounters/adventure-initial-hp-v1.js';

const sessionId='existing-save-ailevent';
const heroDefinitionId='hero.user.00000000-0000-4000-8000-000000000001';
const sha='a'.repeat(40);
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),snap:()=>[...m.entries()]};};

test('the official WorldDocument identity owns printable authored names, without renaming user saves',()=>{
 for(const world of ['Test 1','Forêt 1','Neige 1','mondes château #2','world-main']){
  assert.equal(assertExplorationWorldDocumentIdV1(world),world);
 }
 for(const world of ['', ' ', '\n', 'bad\tworld', 'bad\u007fworld', 'x'.repeat(131)])
  assert.throws(()=>assertExplorationWorldDocumentIdV1(world));
});

test('real Hero, Bestiary and playing-party scopes all accept the same named WorldDocument',()=>{
 for(const worldId of ['Test 1','Forêt 1']){
  const disk=storage();
  disk.setItem('gensrpg.capture.v2.hero-selection.v1:'+sessionId,
   JSON.stringify({schema:'gensrpg.capture.v2.hero-selection.v1',version:1,
    sessionId,worldId,heroDefinitionId}));
  disk.setItem('gensrpg.capture.v2.published-encounters.v1:'+sessionId,
   JSON.stringify({schema:'gensrpg.capture.v2.published-encounters.v1',version:1,
    sessionId,worldId,combatSha:sha,allowedCreatureIds:['crea_ailevent']}));
  disk.setItem('gensrpg.capture.v2.active-party.v1:'+sessionId,
   JSON.stringify({schema:'gensrpg.capture.v2.active-party.v1',version:1,
    sessionId,worldId,combatSha:sha,partyRef:'adventure-party:'+sessionId,
    active:{instanceId:'bird-1',speciesId:'crea_ailevent',level:1,hp:46},
    combatHpMultiplier:0.25}));
  const before=disk.snap();
  const hero=readScopedAdventureHeroSelectionV1({storage:disk,sessionId,worldId});
  const allowed=readScopedAdventurePublishedEncountersV1({storage:disk,sessionId,worldId,
   authorSha:sha,engineSha:sha});
  const party=readScopedAdventurePlayingPartyV1({storage:disk,sessionId,worldId,
   authorSha:sha,engineSha:sha,allowedCreatureIds:allowed});
  assert.equal(hero,heroDefinitionId);assert.deepEqual(allowed,['crea_ailevent']);
  assert.equal(party.worldId,worldId);assert.equal(party.active.hp,46);
  assert.deepEqual(disk.snap(),before,'the historical save/permissions must not be rewritten');
  assert.throws(()=>readScopedAdventureHeroSelectionV1({storage:disk,sessionId,
    worldId:'Autre monde'}),/world|monde|session/i);
 }
});

test('native Combat bounds a legacy saved 46 HP to the authoritative scaled maximum 35 without rewrites',()=>{
 assert.equal(projectAdventureInitialCombatHpV1({savedHp:46,maxHp:35}),35);
 assert.equal(projectAdventureInitialCombatHpV1({savedHp:18,maxHp:35}),18);
 assert.equal(projectAdventureInitialCombatHpV1({savedHp:null,maxHp:35}),35);
 assert.equal(projectAdventureInitialCombatHpV1({savedHp:0,maxHp:35}),0);
 assert.throws(()=>projectAdventureInitialCombatHpV1({savedHp:-1,maxHp:35}));
 assert.throws(()=>projectAdventureInitialCombatHpV1({savedHp:20,maxHp:NaN}));
 const bridge=readFileSync(new URL('../integration/combat-bridge/exploration-encounter.js',import.meta.url),'utf8');
 assert.match(bridge,/projectAdventureInitialCombatHpV1/);
 assert.match(bridge,/fighter\.id==='local-1'\?initialAdventureHp:fighter\.maxHp/);
});
