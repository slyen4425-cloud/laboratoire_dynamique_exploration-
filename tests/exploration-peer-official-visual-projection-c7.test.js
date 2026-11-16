import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createExplorationPeerVisualProjectionV1,EXPLORATION_PEER_SNAPSHOT_EVENT_V1} from '../src/play/exploration-peer-visual-projection-v1.js';

const catalog=JSON.parse(readFileSync(new URL('../assets/exploration/actors/official/catalog.json',import.meta.url),'utf8'));
test('C7 peer snapshot accepts only validated official hero references and preserves names and NPC isolation',()=>{
 const actorId=randomUUID(), ownActorId=randomUUID();
 const projection=createExplorationPeerVisualProjectionV1({
  sessionId:'session',worldId:'world',worldFingerprint:'fingerprint',
  ownActorId,officialHeroCatalog:catalog
 });
 const packet=(revision,actors)=>({
  schema:EXPLORATION_PEER_SNAPSHOT_EVENT_V1,version:1,
  sessionId:'session',worldId:'world',worldFingerprint:'fingerprint',revision,actors
 });
 const actor={actorId,areaId:'area',x:12,y:24,seq:1,displayName:'Invité',
  officialPresetId:catalog.heroes[0].id};
 assert.equal(projection.apply(packet(1,[actor])),true);
 assert.equal(projection.forArea('area')[0].officialPresetId,catalog.heroes[0].id);
 assert.equal(projection.forArea('area')[0].displayName,'Invité');
 assert.equal(projection.apply(packet(2,[{...actor,seq:2,officialPresetId:'https://evil.example/skin.png'}])),false);
 assert.equal(projection.forArea('area')[0].officialPresetId,catalog.heroes[0].id);
 assert.equal(projection.apply(packet(3,[{...actor,seq:3,officialPresetId:'hero.user.custom'}])),false);
 assert.equal(projection.apply(packet(4,[{...actor,seq:4,officialPresetId:catalog.heroes[1].id}])),true);
 assert.equal(projection.forArea('area')[0].officialPresetId,catalog.heroes[1].id);
 assert.equal(projection.apply(packet(5,[])),true);
 assert.equal(projection.forArea('area').length,0);
 projection.dispose();
});
test('C7 no catalog means no remote official appearance grant',()=>{
 const actorId=randomUUID();
 const projection=createExplorationPeerVisualProjectionV1({
  sessionId:'session',worldId:'world',worldFingerprint:'fingerprint'
 });
 assert.equal(projection.apply({
  schema:EXPLORATION_PEER_SNAPSHOT_EVENT_V1,version:1,
  sessionId:'session',worldId:'world',worldFingerprint:'fingerprint',
  revision:1,actors:[{actorId,areaId:'area',x:1,y:2,seq:1,
   officialPresetId:catalog.heroes[0].id}]
 }),false);
});

test('C7 forged catalog cannot throw through a remote snapshot or mutate the viewport',()=>{
 const actorId=randomUUID();
 const forged=structuredClone(catalog);
 forged.heroes[0].thumbnail='https://evil.example/hero.png';
 const projection=createExplorationPeerVisualProjectionV1({
  sessionId:'session',worldId:'world',worldFingerprint:'fingerprint',
  officialHeroCatalog:forged
 });
 const packet={
  schema:EXPLORATION_PEER_SNAPSHOT_EVENT_V1,version:1,
  sessionId:'session',worldId:'world',worldFingerprint:'fingerprint',
  revision:1,actors:[{actorId,areaId:'area',x:1,y:2,seq:1,
   officialPresetId:catalog.heroes[0].id}]
 };
 assert.doesNotThrow(()=>assert.equal(projection.apply(packet),false));
 assert.equal(projection.forArea('area').length,0);
 projection.dispose();
});

test('C7 mixed snapshot rejects one forged peer atomically and retains prior valid peers',()=>{
 const first=randomUUID(),second=randomUUID();
 const projection=createExplorationPeerVisualProjectionV1({
  sessionId:'session',worldId:'world',worldFingerprint:'fingerprint',
  officialHeroCatalog:catalog
 });
 const packet=(revision,actors)=>({
  schema:EXPLORATION_PEER_SNAPSHOT_EVENT_V1,version:1,
  sessionId:'session',worldId:'world',worldFingerprint:'fingerprint',revision,actors
 });
 const valid={actorId:first,areaId:'area',x:1,y:2,seq:1,
  displayName:'Premier',officialPresetId:catalog.heroes[0].id};
 assert.equal(projection.apply(packet(1,[valid])),true);
 const invalid={actorId:second,areaId:'area',x:3,y:4,seq:1,
  displayName:'Intrus',officialPresetId:'https://evil.example/hero.png'};
 assert.equal(projection.apply(packet(2,[{...valid,x:100,seq:2},invalid])),false);
 assert.deepEqual(projection.forArea('area').map(peer=>peer.actorId),[first]);
 assert.equal(projection.forArea('area')[0].x,1);
 assert.equal(projection.apply(packet(3,[{...valid,x:5,seq:3}])),true);
 assert.equal(projection.forArea('area')[0].x,5);
 projection.dispose();
});
