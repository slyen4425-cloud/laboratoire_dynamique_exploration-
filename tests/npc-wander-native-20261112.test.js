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
