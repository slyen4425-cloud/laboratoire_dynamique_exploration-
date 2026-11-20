import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createExplorationPeerVisualProjectionV1,
 EXPLORATION_PEER_SNAPSHOT_EVENT_V1
} from '../src/play/exploration-peer-visual-projection-v1.js';

const host='93b5ba2f-07b4-4b01-9b94-5fbd0215e02a';
const guest='b55f72d4-1861-42f7-9804-d5ee774fc539';
const area='area-1';
const packet=(revision,seq,x,y=50,areaId=area)=>({
 schema:EXPLORATION_PEER_SNAPSHOT_EVENT_V1,version:1,
 sessionId:'session-local',worldId:'forest',worldFingerprint:'123:test',
 revision,actors:[{actorId:host,areaId,x,y,seq,displayName:'Autre héros'}]
});
test('issue #553: a moving remote actor is interpolated using only a visual read model',()=>{
 let now=0;
 const p=createExplorationPeerVisualProjectionV1({
  sessionId:'session-local',worldId:'forest',worldFingerprint:'123:test',
  ownActorId:guest,clock:()=>now
 });
 assert.equal(p.apply(packet(1,1,0)),true);
 now=100;
 assert.equal(p.apply(packet(2,2,30)),true);
 assert.equal(p.forArea(area)[0].x,30,'authoritative received position remains untouched');
 const start=p.sampleForArea(area)[0];
 assert.equal(start.x,0,'begin from the previous drawn position');
 assert.equal(start.moving,true);
 assert.equal(start.directionX>0,true);
 assert.equal(p.isAnimating(area),true);
 now=170;
 const between=p.sampleForArea(area)[0];
 assert.ok(between.x>0&&between.x<30,'no teleport between movement updates');
 now=270;
 const end=p.sampleForArea(area)[0];
 assert.equal(end.x,30);
 assert.equal(end.moving,false,'idle after the interpolation window');
 assert.equal(p.isAnimating(area),false);
 assert.equal(end.displayName,'Autre héros');
 p.dispose();
 assert.equal(p.sampleForArea(area).length,0);
});
test('issue #553: rapid turns, late packets, area changes and departures stay scoped',()=>{
 let now=0;
 const p=createExplorationPeerVisualProjectionV1({
  sessionId:'session-local',worldId:'forest',worldFingerprint:'123:test',
  ownActorId:guest,clock:()=>now
 });
 p.apply(packet(1,1,50,50));
 now=100;p.apply(packet(2,2,80,50));
 now=150;
 const advancing=p.sampleForArea(area)[0];
 assert.ok(advancing.x>50&&advancing.x<80);
 p.apply(packet(3,3,60,70)); // reversal during an active segment
 assert.equal(p.sampleForArea(area)[0].x,advancing.x,'turn cannot jump to a past target');
 now=185;
 const turning=p.sampleForArea(area)[0];
 assert.ok(turning.x<advancing.x&&turning.y>50);
 assert.equal(p.apply(packet(2,4,1000)),false,'older full snapshot refused');
 assert.equal(p.apply(packet(4,2,999)),true,'stale actor sequence cannot undo latest');
 assert.equal(p.forArea(area)[0].seq,3);
 now=300;p.apply(packet(5,4,20,20,'area-2'));
 assert.equal(p.sampleForArea(area).length,0);
 assert.equal(p.sampleForArea('area-2')[0].x,20,'cross-area portal snaps; no interpolation through walls');
 const empty={...packet(6,5,20),actors:[]};
 assert.equal(p.apply(empty),true);
 assert.equal(p.sampleForArea('area-2').length,0);
});
test('issue #553: native engine emits official checkpoints more frequently online only and paints peers via existing RAF',()=>{
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(source,/time-playLastCheckpointAt>\(playOptions\?\.sessionId\?120:1500\)/);
 assert.match(source,/sculptPeerProjection\.sampleForArea\(sculptWorldAreaId/);
 assert.match(source,/sculptPeerProjection\?\.isAnimating\(sculptWorldAreaId,time\)/);
 assert.match(source,/moving:peer\.moving/);
 assert.match(source,/directionX:peer\.directionX/);
 // No new clock owns navigation, physics, storage, or a second sprite renderer.
 assert.match(source,/navigationActorRenderer=createMapActorRenderer/);
 assert.match(source,/explorationPeerRenderer=createMapActorRenderer/);
});

test('issue #553: uneven Android packets blend until latest exact server point without dead reckoning',()=>{
 let now=0;
 const p=createExplorationPeerVisualProjectionV1({
  sessionId:'session-local',worldId:'forest',worldFingerprint:'123:test',
  ownActorId:guest,clock:()=>now
 });
 p.apply(packet(1,1,10));
 now=320;p.apply(packet(2,2,110));
 now=500;
 assert.ok(p.isAnimating(area));
 const between=p.sampleForArea(area)[0];
 assert.ok(between.x>10&&between.x<110,'320ms packet spacing cannot force 140ms teleport/stop');
 assert.equal(p.forArea(area)[0].x,110,'read model keeps exact trusted server pose');
 now=670;
 assert.equal(p.sampleForArea(area)[0].x,110);
 assert.equal(p.isAnimating(area),false,'no ghost movement after packet loss');
 now=700;p.apply(packet(3,3,900));
 assert.equal(p.sampleForArea(area)[0].x,900,'large respawns snap rather than crossing obstacles');
 p.dispose();
});
