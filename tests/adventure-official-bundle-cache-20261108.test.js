import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCaptureAuthorEncounterBundleV1} from '../src/capture/capture-showcase-encounter-source-v1.js';
import {readScopedAdventurePublishedEncountersV1} from '../src/encounters/adventure-published-encounters-v1.js';

const oldSha='a'.repeat(40),liveSha='b'.repeat(40);
const bundle=sha=>({
  schema:'capture-author-encounter-bundle-v1',version:1,
  authorSha:sha,engineSha:sha,
  creatureTransfers:[{draft:{id:'crea_earth'}}],
  skillTransfers:[{draft:{id:'skill_earth'}}]
});
test('old Android CacheStorage cannot poison a scoped Adventure Combat author SHA',async()=>{
  const requests=[];
  const fetchImpl=async(url,init)=>{
    requests.push({url:url.href,cache:init.cache});
    // Reproduce the old service worker's cache hit on the unversioned URL.
    return {ok:true,json:async()=>bundle(
      url.searchParams.has('_gens_capture_release')?liveSha:oldSha)};
  };
  const stale=await loadCaptureAuthorEncounterBundleV1({fetchImpl});
  assert.equal(stale.authorSha,oldSha);
  const storage={getItem:()=>JSON.stringify({
    schema:'gensrpg.capture.v2.published-encounters.v1',version:1,
    sessionId:'test-session',worldId:'test-world',
    combatSha:liveSha,allowedCreatureIds:['crea_earth']
  })};
  const validate=data=>readScopedAdventurePublishedEncountersV1({
    storage,sessionId:'test-session',worldId:'test-world',
    authorSha:data.authorSha,engineSha:data.engineSha
  });
  assert.throws(()=>validate(stale),/does not match official Combat/);
  const fresh=await loadCaptureAuthorEncounterBundleV1({
    fetchImpl,releaseLoadId:'12345678-1234-4234-8234-1234567890ab'});
  assert.equal(fresh.authorSha,liveSha);
  assert.deepEqual(validate(fresh),['crea_earth']);
  assert.equal(requests[0].cache,'force-cache');
  assert.equal(requests[1].cache,'no-store');
  assert.notEqual(requests[0].url,requests[1].url);
  assert.equal(new URL(requests[1].url).searchParams.get('_gens_capture_release'),
    '12345678-1234-4234-8234-1234567890ab');
  await assert.rejects(loadCaptureAuthorEncounterBundleV1({
    fetchImpl,releaseLoadId:'../../bad'}),/release load ID/);
  assert.equal(requests.length,2);
});

test('only scoped Jouer supplies a fresh URL to Exploration official owner',async()=>{
  const src=await readFile(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.ok(src.includes('sculptPlayRequested&&playOptions'));
  assert.ok(src.includes('releaseLoadId:window.crypto.randomUUID()'));
});
