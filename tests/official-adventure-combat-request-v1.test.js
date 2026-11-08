import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readScopedAdventurePublishedEncountersV1}
 from '../src/encounters/adventure-published-encounters-v1.js';

const currentSha='b'.repeat(40),staleSha='a'.repeat(40);
const storage={getItem:()=>JSON.stringify({
 schema:'gensrpg.capture.v2.published-encounters.v1',version:1,
 sessionId:'session-1',worldId:'world-1',combatSha:currentSha,allowedCreatureIds:['crea_one']
})};
test('Adventure grant must reject stale Combat even if original URL was cached',()=>{
 const verify=sha=>readScopedAdventurePublishedEncountersV1({
  storage,sessionId:'session-1',worldId:'world-1',authorSha:sha,engineSha:sha
 });
 assert.throws(()=>verify(staleSha),/does not match official Combat/);
 assert.deepEqual(verify(currentSha),['crea_one']);
});
test('every frozen preview already transports the single helper owner with its battle bridge',async()=>{
 const base=new URL('../integration/combat-bridge/',import.meta.url);
 const native=await readFile(new URL('exploration-native-source-v1.js',base),'utf8');
 const bridge=await readFile(new URL('exploration-encounter.js',base),'utf8');
 assert.match(native,/export function officialAdventureCombatRequestV1/);
 assert.match(bridge,/from '\.\/exploration-native-source-v1\.js'/);
 assert.match(bridge,/const scopedReleaseLoadId=encounterSessionId===undefined\?null:window\.crypto\.randomUUID\(\)/);
 assert.match(bridge,/async function readJson\(url\)\s*\{\s*const request=scopedRequest\(url\);/);
 assert.match(bridge,/const templateRequest=scopedRequest\('\.\/capture-editor-v2\.html'\)/);
 assert.doesNotMatch(bridge,/src\/encounters\/official-adventure-combat-request-v1\.js/,
  'an untransported extra module would silently freeze old PR318 encounter iframe');
 assert.match(bridge,/readScopedAdventurePublishedEncountersV1\(context\)/);
});
