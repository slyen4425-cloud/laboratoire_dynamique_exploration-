import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {officialAdventureCombatRequestV1} from '../src/encounters/official-adventure-combat-request-v1.js';
import {readScopedAdventurePublishedEncountersV1} from '../src/encounters/adventure-published-encounters-v1.js';
const oldSha='a'.repeat(40),officialSha='b'.repeat(40);
const url='https://game.test/vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json';
const token='e8f9fe1f-9ec7-4c9c-9510-617fb0b73435';
const storage={getItem:()=>JSON.stringify({
 schema:'gensrpg.capture.v2.published-encounters.v1',version:1,
 sessionId:'session-1',worldId:'world-1',combatSha:officialSha,allowedCreatureIds:['crea_one']
})};
test('stale Android worker must not be able to reintroduce an old author SHA at battle entry',()=>{
 const old=officialAdventureCombatRequestV1(url);
 const fresh=officialAdventureCombatRequestV1(url,{sessionId:'session-1',loadId:token});
 const obsoleteStorageHit=old.url===url?oldSha:officialSha;
 const liveData=fresh.url===url?oldSha:officialSha;
 const grant=(authorSha,engineSha)=>readScopedAdventurePublishedEncountersV1({
  storage,sessionId:'session-1',worldId:'world-1',authorSha,engineSha
 });
 assert.equal(obsoleteStorageHit,oldSha);
 assert.throws(()=>grant(obsoleteStorageHit,obsoleteStorageHit),/official Combat/);
 assert.deepEqual(grant(liveData,liveData),['crea_one']);
 assert.equal(old.url,url);
 assert.equal(old.init,undefined);
 assert.equal(new URL(fresh.url).searchParams.get('_gens_capture_release'),token);
 assert.equal(fresh.init.cache,'no-store');
 assert.throws(()=>officialAdventureCombatRequestV1(url,{sessionId:'session-1',loadId:'../broken'}),/boot UUID/);
 assert.throws(()=>officialAdventureCombatRequestV1(url,{sessionId:null,loadId:token}),/outside Aventure/);
});
test('real nested Combat bridge uses the same isolated request for official bundle AND template',async()=>{
 const src=await readFile(new URL('../integration/combat-bridge/exploration-encounter.js',import.meta.url),'utf8');
 assert.match(src,/const scopedReleaseLoadId=encounterSessionId===undefined\?null:window\.crypto\.randomUUID\(\)/);
 assert.match(src,/async function readJson\(url\)\s*\{\s*const request=scopedRequest\(url\);/);
 assert.match(src,/const templateRequest=scopedRequest\('\.\/capture-editor-v2\.html'\)/);
 assert.match(src,/readJson\(resource\('data\/capture\/showcase\/encounter-bundle\.v1\.json'\)\)/);
 assert.match(src,/readScopedAdventurePublishedEncountersV1\(context\)/,
  'do not weaken SHA equivalence in native Combat launch');
});
