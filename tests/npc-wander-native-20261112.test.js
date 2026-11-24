import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNpcWanderRuntimeV1} from '../src/actors/npc-wander-runtime-v1.js';
import {normalizeMapActorNpcSettingsV1} from '../src/actors/map-actor-npc-settings-v1.js';
import {stepMovement} from '../src/core/movement.js';

const world={width:610,height:455,objects:[],obstacles:[],walls:[]};
const npc=(id,mode='wander',x=260,y=195,radius=70)=>Object.freeze({
  id,actorDefinitionId:'exploration:npc:generic-v1',
  x,y,facingX:1,
  npc:normalizeMapActorNpcSettingsV1({
    kind:'dialogue',name:'PNJ de test',
    dialogue:'Bienvenue.',movement:{mode,radius}
  })
});
test('official Core Movement drives temporary NPC coordinates; original WorldArea actor never changes',()=>{
  const walking=npc('sculpt-actor-1','wander');
  const still=npc('sculpt-actor-2','static',310,195);
  const actors=Object.freeze([walking,still]);
  const original=JSON.stringify(actors);
  const runtime=createNpcWanderRuntimeV1({move:stepMovement});
  runtime.reset(actors);
  assert.equal(runtime.count,1);
  let moved=false,walked=false;
  for(let frame=0;frame<360;frame++){
    moved=runtime.step({actors,elapsedSeconds:.095,world})||moved;
    const now=runtime.project(actors);
    assert.strictEqual(now[1],still,'static actor must remain the exact canonical object');
    assert.strictEqual(now[0].npc,walking.npc,'no second NPC definition');
    assert.ok(Math.hypot(now[0].x-walking.x,now[0].y-walking.y)<=70.001,
      'runtime never escapes the authored radius');
    if(Math.hypot(now[0].x-walking.x,now[0].y-walking.y)>.1)walked=true;
  }
  assert.equal(moved,true,'real native movement must advance the NPC');
  assert.equal(walked,true);
  assert.equal(JSON.stringify(actors),original,'save/export coordinates are not changed');
  assert.equal(walking.x,260);
  assert.equal(walking.y,195);
  runtime.reset(actors);
  assert.equal(runtime.project(actors)[0].x,260,'reloading a scene recreates the original anchor');
  assert.equal(runtime.project(actors)[0].y,195);
});
test('native Collision World confines wandering NPCs to dry playable boundaries',()=>{
  const tiny={width:84,height:70,objects:[],obstacles:[],walls:[]};
  const one=npc('sculpt-actor-near-edge','wander',22,21,170);
  const runtime=createNpcWanderRuntimeV1({move:stepMovement});
  runtime.reset([one]);
  for(let frame=0;frame<450;frame++){
    runtime.step({actors:[one],elapsedSeconds:.11,world:tiny});
    const p=runtime.project([one])[0];
    assert.ok(p.x>=5&&p.x<=tiny.width-5,'native boundary X preserved');
    assert.ok(p.y>=5&&p.y<=tiny.height-5,'native boundary Y preserved');
    assert.ok(Math.hypot(p.x-one.x,p.y-one.y)<=one.npc.movement.radius+.001);
  }
});
test('dialogue, Combat pause and nearby hero keep NPCs still; no implicit save',()=>{
  const one=npc('sculpt-actor-dialogue','wander');
  const runtime=createNpcWanderRuntimeV1({move:stepMovement});
  runtime.reset([one]);
  for(let i=0;i<15;i++)runtime.step({actors:[one],elapsedSeconds:.1,world,paused:true});
  assert.equal(runtime.project([one])[0].x,one.x);
  assert.equal(runtime.project([one])[0].y,one.y);
  for(let i=0;i<35;i++)runtime.step({actors:[one],elapsedSeconds:.1,world,player:{x:one.x,y:one.y}});
  assert.equal(runtime.project([one])[0].x,one.x);
  assert.equal(runtime.project([one])[0].y,one.y);
  runtime.step({actors:[one],elapsedSeconds:.1,world});
  runtime.reset();
  assert.equal(runtime.count,0);
  assert.strictEqual(runtime.project([one])[0],one);
});
test('edited radius and removed placed actors resync the single ephemeral projection',()=>{
  const original=npc('sculpt-actor-edit','wander',190,180,120);
  const runtime=createNpcWanderRuntimeV1({move:stepMovement});
  runtime.reset([original]);
  for(let i=0;i<90;i++)runtime.step({actors:[original],elapsedSeconds:.1,world});
  const changed=npc(original.id,'wander',195,185,24);
  runtime.step({actors:[changed],elapsedSeconds:.1,world});
  const projected=runtime.project([changed])[0];
  assert.equal(projected.x,changed.x);
  assert.equal(projected.y,changed.y);
  assert.equal(runtime.snapshot()[0].radius,24);
  runtime.step({actors:[],elapsedSeconds:.1,world});
  assert.equal(runtime.count,0);
});
test('Sculpt reuses its existing renderer, navigation clock, trainer gate and unique NPC form',()=>{
  const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(js,/createNpcWanderRuntimeV1\(\{move:stepMovement\}\)/);
  assert.match(js,/npcWanderRuntime\.step\(\{/);
  assert.match(js,/gameplayPlacedActors\(\)\.filter/);
  assert.match(js,/nearestDialogNpcV1\(gameplayPlacedActors\(\)/);
  assert.match(js,/nearestAggressiveTrainerV1\(gameplayPlacedActors\(\)/);
  assert.match(js,/return view\?\{\.\.\.view,moving:p\.moving===true\}:null/);
  assert.match(html,/value="wander">Errance active en Tester \/ Jouer/);
  assert.equal((html.match(/id="actor-npc-settings"/g)||[]).length,1);
});

test('the collision footprint is independent of the authored wander radius',()=>{
 const actor=npc('sculpt-actor-1','wander',22,21,170);
 const runtime=createNpcWanderRuntimeV1({move:stepMovement});
 const narrow={width:84,height:70,objects:[],obstacles:[],walls:[]};
 runtime.reset([actor]);let farthest=0;
 for(let i=0;i<450;i++){
  runtime.step({actors:[actor],elapsedSeconds:.1,world:narrow});
  const [s]=runtime.snapshot();farthest=Math.max(farthest,Math.hypot(s.x-22,s.y-21));
 }
 assert.ok(farthest>6,'an actor can walk on a map narrower than its wander radius');
});
test('once, loop and ping-pong follow authored segments through official movement without moving the placement',()=>{
 for(const mode of ['once','loop','pingpong']){
  const movement={mode,speed:40,waitSeconds:.2,points:[{x:40,y:0},{x:40,y:40}]};
  const actor={...npc('sculpt-actor-route','static',150,100),
   npc:normalizeMapActorNpcSettingsV1({kind:'dialogue',movement})};
  const before=JSON.stringify(actor);const runtime=createNpcWanderRuntimeV1({move:stepMovement});
  runtime.reset([actor]);const targetChanges=[];let previous;
  for(let i=0;i<240;i++){
   runtime.step({actors:[actor],world,elapsedSeconds:.1});
   const [s]=runtime.snapshot();
   if(previous)assert.ok(Math.hypot(s.x-previous.x,s.y-previous.y)<=4.01);
   if(s.waypoint!==previous?.waypoint)targetChanges.push(s.waypoint);
   previous=s;
  }
  assert.equal(JSON.stringify(actor),before);
  if(mode==='once'){assert.equal(previous.complete,true);assert.ok(Math.hypot(previous.x-190,previous.y-140)<=3);}
  if(mode==='loop')assert.deepEqual(targetChanges.slice(0,5),[1,2,0,1,2]);
  if(mode==='pingpong')assert.deepEqual(targetChanges.slice(0,5),[1,2,1,0,1]);
 }
});
test('a blocked authored segment never jumps to its destination or persists transient positions',()=>{
 const movement={mode:'once',points:[{x:70,y:0}]};
 const actor={...npc('sculpt-actor-route'),npc:normalizeMapActorNpcSettingsV1({kind:'dialogue',movement})};
 const runtime=createNpcWanderRuntimeV1({move(){}});runtime.reset([actor]);
 for(let i=0;i<70;i++)runtime.step({actors:[actor],world,elapsedSeconds:.1});
 assert.deepEqual([runtime.snapshot()[0].x,runtime.snapshot()[0].y],[actor.x,actor.y]);
 assert.equal(runtime.snapshot()[0].complete,false);
 assert.ok(runtime.snapshot()[0].blocked>0);
});
