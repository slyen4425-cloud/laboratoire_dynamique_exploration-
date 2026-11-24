// Ephemeral NPC behaviour for the ONE native Exploration navigation loop.
// WorldArea.actors[] is author-owned and never updated by this runtime.
// Every accepted step is delegated to the same core Movement/Collision World
// that moves the hero. No independent map coordinates, collision or save.
import {NPC_PATROL_MODES_V1} from './map-actor-npc-settings-v1.js';
const WANDER_SPEED=38;
const WANDER_RADIUS=5;
const AVOID_HERO_DISTANCE=24;
const TAU=Math.PI*2;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const walking=actor=>finite(actor?.x)&&finite(actor?.y)&&
  (actor.npc?.movement?.mode==='wander'||NPC_PATROL_MODES_V1.includes(actor.npc?.movement?.mode));
function hashWord(value){
  let result=2166136261;
  for(const ch of String(value)){result=Math.imul(result^ch.charCodeAt(0),16777619);}
  return result>>>0;
}
function nextDestination(state){
  if(state.route){
    const point=state.route[state.index];
    state.goal={x:state.anchorX+point.x,y:state.anchorY+point.y};
    return;
  }
  // Random destinations are relative to the authored anchor.
  const seed=hashWord(state.id+':'+(++state.leg));
  const angle=(seed/4294967296)*TAU;
  const spread=.3+(hashWord(state.id+':distance:'+state.leg)%53)/100;
  state.goal={x:state.anchorX+Math.cos(angle)*state.leash*spread,
    y:state.anchorY+Math.sin(angle)*state.leash*spread};
}
function reachDestination(state){
  state.goal=null;
  state.pause=state.movement.waitSeconds??.6;
  if(!state.route)return;
  const last=state.route.length-1;
  if(state.movement.mode==='once'&&state.index===last){state.done=true;return;}
  if(state.movement.mode==='pingpong'&&(state.index===last||state.index===0))
    state.direction=state.index===last?-1:1;
  state.index=(state.index+state.direction+state.route.length)%state.route.length;
}
function newState(actor){
  const movement=actor.npc.movement;
  return {id:actor.id,anchorX:actor.x,anchorY:actor.y,movement,
    route:movement.points?[{x:0,y:0},...movement.points]:null,index:1,direction:1,done:false,
    speed:movement.speed??WANDER_SPEED,leash:movement.radius,
    radius:WANDER_RADIUS,x:actor.x,y:actor.y,
    facingX:actor.facingX===-1?-1:1,
    locomotion:{modes:['ground']},moving:false,
    sculptBridgeId:null,sculptStairId:null,
    goal:null,leg:hashWord(actor.id)%23,pause:.2,blocked:0};
}
export function createNpcWanderRuntimeV1({move}={}){
  if(typeof move!=='function')throw new TypeError('Official Exploration movement callback required');
  let entries=new Map();
  function sync(actors){
    const alive=new Set();
    for(const actor of Array.isArray(actors)?actors:[]){
      if(!walking(actor))continue;
      alive.add(actor.id);
      const old=entries.get(actor.id);
      if(!old||old.anchorX!==actor.x||old.anchorY!==actor.y||
          (old.movement!==actor.npc.movement&&
           JSON.stringify(old.movement)!==JSON.stringify(actor.npc.movement)))
        entries.set(actor.id,newState(actor));
    }
    for(const id of entries.keys())if(!alive.has(id))entries.delete(id);
  }
  function reset(actors=[]){
    entries=new Map();
    sync(actors);
  }
  function project(actors=[]){
    return actors.map(actor=>{
      const moving=entries.get(actor.id);
      return moving?{...actor,x:moving.x,y:moving.y,
        facingX:moving.facingX,moving:moving.moving}:actor;
    });
  }
  function step({actors=[],elapsedSeconds=0,world,collisionContext={},player=null,
    paused=false}={}){
    sync(actors);
    if(paused||!world||!finite(elapsedSeconds)||elapsedSeconds<=0)return false;
    // A slow phone never makes an NPC teleport to catch up missed frames.
    const dt=Math.min(.14,elapsedSeconds);
    let updated=false;
    for(const state of entries.values()){
      const oldMoving=state.moving;
      state.moving=false;
      if(state.done)continue;
      if(state.pause>0){
        state.pause=Math.max(0,state.pause-dt);
        updated ||=oldMoving;
        continue;
      }
      if(player&&Math.hypot(player.x-state.x,player.y-state.y)<AVOID_HERO_DISTANCE){
        state.pause=.18;updated ||=oldMoving;continue;
      }
      if(!state.goal)nextDestination(state);
      const dx=state.goal.x-state.x,dy=state.goal.y-state.y;
      const remaining=Math.hypot(dx,dy);
      if(remaining<=3){
        reachDestination(state);
        updated ||=oldMoving;continue;
      }
      const x=state.x,y=state.y;
      const bridgeId=state.sculptBridgeId,stairId=state.sculptStairId;
      move(world,state,{x:dx,y:dy},
        Math.min(dt,remaining/state.speed),{maxSpeed:state.speed},
        undefined,collisionContext);
      const distanceFromAnchor=Math.hypot(state.x-state.anchorX,state.y-state.anchorY);
      const overlapsHero=player&&Math.hypot(player.x-state.x,player.y-state.y)<AVOID_HERO_DISTANCE;
      if((!state.route&&distanceFromAnchor>state.leash+.001)||overlapsHero){
        state.x=x;state.y=y;
        state.sculptBridgeId=bridgeId;state.sculptStairId=stairId;
      }
      const progress=Math.hypot(state.x-x,state.y-y);
      if(progress<.05){
        // Retry the authored segment if a wall blocks it. Random wandering
        // may choose another direction within its leash.
        if(!state.route)state.goal=null;
        state.pause=.22;state.blocked++;
      }else{
        state.facingX=state.x<x?-1:state.x>x?1:state.facingX;
        state.moving=true;state.blocked=0;
        if(Math.hypot(state.goal.x-state.x,state.goal.y-state.y)<3){
          reachDestination(state);
        }
      }
      updated ||=progress>.05||oldMoving!==state.moving;
    }
    return updated;
  }
  function snapshot(){
    return Object.freeze([...entries.values()].map(s=>Object.freeze({
      id:s.id,anchorX:s.anchorX,anchorY:s.anchorY,x:s.x,y:s.y,
      radius:s.leash,moving:s.moving,facingX:s.facingX,
      ...(s.route?{waypoint:s.index,complete:s.done}:{}),
      blocked:s.blocked
    })));
  }
  return Object.freeze({reset,project,step,snapshot,
    get count(){return entries.size}});
}
