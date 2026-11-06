import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createExplorationPeerVisualProjectionV1,
 EXPLORATION_PEER_SNAPSHOT_EVENT_V1
} from '../src/play/exploration-peer-visual-projection-v1.js';

const host='93b5ba2f-07b4-4b01-9b94-5fbd0215e02a';
const guest='b55f72d4-1861-42f7-9804-d5ee774fc539';
const world='map-forest',fp='v1:map-hash',session='guest-local-session';
const position=(actorId=host,seq=1,x=24,y=30,areaId='area-1')=>({
 actorId,areaId,x,y,seq
});
const packet=(actors=[position()],revision=1,extra={})=>({
 schema:EXPLORATION_PEER_SNAPSHOT_EVENT_V1,version:1,
 sessionId:session,worldId:world,worldFingerprint:fp,
 revision,actors,...extra
});
function make(){return createExplorationPeerVisualProjectionV1({
 sessionId:session,worldId:world,worldFingerprint:fp,ownActorId:guest
});}
test('only the matching scoped full snapshot renders other actors in the current official area',()=>{
 const p=make();
 assert.equal(p.apply(packet([position(),position('a5b98a9a-e634-4fe6-aaf1-51b8c6a01b12',2,88,90,'area-2')])),true);
 assert.deepEqual(p.forArea('area-1').map(x=>[x.actorId,x.x,x.y]),[[host,24,30]]);
 assert.equal(p.forArea('area-2').length,1);
 assert.equal(p.forArea('unknown').length,0);
 assert.ok(Object.isFrozen(p.forArea('area-1')));
 assert.equal(p.apply(packet([position(host,2,29,31)],2)),true);
 assert.equal(p.forArea('area-1')[0].x,29);
 assert.equal(p.apply(packet([],3)),true,'departure removes remote actors');
 assert.equal(p.forArea('area-1').length,0);
});
test('refuse wrong session/world/fingerprint, self-as-peer, malformed and excessive actors',()=>{
 const p=make();
 for(const bad of [
  packet(undefined,1,{sessionId:'other-session'}),
  packet(undefined,1,{worldId:'another-world'}),
  packet(undefined,1,{worldFingerprint:'wrong-fingerprint'}),
  packet([position(guest)]),
  packet([position(host,1,-1)]),
  packet([position(host,1,NaN)]),
  packet([position(host,1,20,30,'')]),
  packet([{...position(),inventory:{gold:999}}]),
  packet([position(),position(host,2)]),
  packet(Array.from({length:33},(_,i)=>position(i.toString().padStart(8,'0')+
   '-0000-4000-8000-000000000000',1))),
  {...packet(),extra:'untrusted'},
  {...packet(),version:2},
 ]){
  assert.equal(p.apply(bad),false);
  assert.equal(p.forArea('area-1').length,0);
 }
});
test('packet and actor revisions protect against late network views and old movement',()=>{
 const p=make();
 assert.equal(p.apply(packet([position(host,4,60)],10)),true);
 assert.equal(p.apply(packet([position(host,5,80)],9)),false);
 assert.equal(p.apply(packet([position(host,3,80)],11)),true);
 assert.equal(p.forArea('area-1')[0].x,60,'stale actor update cannot roll back pose');
 assert.equal(p.apply(packet([],12)),true);
 assert.equal(p.forArea('area-1').length,0);
 p.dispose();
 assert.equal(p.apply(packet([position(host,7,70)],13)),false);
 assert.equal(p.forArea('area-1').length,0);
});
test('official Sculpt owner uses one Map Actor Renderer and never mutates player navigation',()=>{
 const s=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(s,/createExplorationPeerVisualProjectionV1/);
 assert.match(s,/EXPLORATION_PEER_SNAPSHOT_EVENT_V1/);
 assert.match(s,/function drawExplorationPeerActors\(/);
 assert.match(s,/demoNavigationActorPreparer/);
 assert.match(s,/navigationActorRenderer\.draw\(/);
 const peer=s.slice(s.indexOf('function drawExplorationPeerActors('),
  s.indexOf('function navigationSpawn('));
 assert.doesNotMatch(peer,/stepMovement|localStorage|sessionStorage|save|write|new Image\(/);
 assert.doesNotMatch(s,/window\.addEventListener\(EXPLORATION_PEER_SNAPSHOT_EVENT_V1\s*,\s*[^)]+\)/);
 assert.match(s,/window\.addEventListener\(EXPLORATION_PEER_SNAPSHOT_EVENT_V1/);
 assert.match(s,/window\.removeEventListener\(EXPLORATION_PEER_SNAPSHOT_EVENT_V1/);
});
