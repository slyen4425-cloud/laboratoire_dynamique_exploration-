// Ephemeral NPC behaviour for the ONE native Exploration navigation loop.
// WorldArea.actors[] is author-owned and never updated by this runtime.
// Every accepted step is delegated to the same core Movement/Collision World
// that moves the hero. No independent map coordinates, collision or save.
import {stepMovement} from '../core/movement.js';

const WANDER_SPEED=38;
const WANDER_RADIUS=5;
const AVOID_HERO_DISTANCE=24;
const TAU=Math.PI*2;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const wandering=actor=>actor?.npc?.movement?.mode==='wander'&&
  finite(actor.x)&&finite(actor.y)&&
  finite(actor.npc.movement.radius)&&actor.npc.movement.radius>=16;
function hashWord(value){
  let result=2166136261;
  for(const ch of String(value)){result=Math.imul(result^ch.charCodeAt(0),16777619);}
  return result>>>0;
}
function nextDestination(state){
  // The authored anchor is the only leash. No path or coordinate is persisted.
  const seed=hashWord(state.id+':'+(++state.leg));
  const angle=(seed/4294967296)*TAU;
  const spread=.3+(hashWord(state.id+':distance:'+state.leg)%53)/100;
  state.goal={x:state.anchorX+Math.cos(angle)*state.radius*spread,
    y:state.anchorY+Math.sin(angle)*state.radius*spread};
}
function newState(actor){
  return {id:actor.id,anchorX:actor.x,anchorY:actor.y,
    radius:actor.npc.movement.radius,x:actor.x,y:actor.y,
    facingX:actor.facingX===-1?-1:1,
    locomotion:{modes:['ground']},moving:false,
    sculptBridgeId:null,sculptStairId:null,
    goal:null,leg:hashWord(actor.id)%23,pause:.2,blocked:0};
}
export function createNpcWanderRuntimeV1(){
  let entries=new Map();
  function sync(actors){
    const alive=new Set();
    for(const actor of Array.isArray(actors)?actors:[]){
      if(!wandering(actor))continue;
      alive.add(actor.id);
      const old=entries.get(actor.id);
      if(!old||old.anchorX!==actor.x||old.anchorY!==actor.y||
          old.radius!==actor.npc.movement.radius)
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
        state.goal=null;state.pause=.55+(hashWord(state.id+':pause:'+state.leg)%100)/100;
        updated ||=oldMoving;continue;
      }
      const x=state.x,y=state.y;
      const bridgeId=state.sculptBridgeId,stairId=state.sculptStairId;
      stepMovement(world,state,{x:dx,y:dy},
        Math.min(dt,remaining/WANDER_SPEED),{maxSpeed:WANDER_SPEED},
        undefined,collisionContext);
      const moved=Math.hypot(state.x-x,state.y-y);
      const distanceFromAnchor=Math.hypot(state.x-state.anchorX,state.y-state.anchorY);
      const overlapsHero=player&&Math.hypot(player.x-state.x,player.y-state.y)<AVOID_HERO_DISTANCE;
      if(distanceFromAnchor>state.radius+.001||overlapsHero){
        state.x=x;state.y=y;
        state.sculptBridgeId=bridgeId;state.sculptStairId=stairId;
      }
      const progress=Math.hypot(state.x-x,state.y-y);
      if(progress<.05){
        state.goal=null;
        state.pause=.22;state.blocked++;
      }else{
        state.facingX=state.x<x?-1:state.x>x?1:state.facingX;
        state.moving=true;state.blocked=0;
        if(Math.hypot(state.goal.x-state.x,state.goal.y-state.y)<3){
          state.goal=null;state.pause=.6;
        }
      }
      updated ||=progress>.05||oldMoving!==state.moving;
    }
    return updated;
  }
  function snapshot(){
    return Object.freeze([...entries.values()].map(s=>Object.freeze({
      id:s.id,anchorX:s.anchorX,anchorY:s.anchorY,x:s.x,y:s.y,
      radius:s.radius,moving:s.moving,facingX:s.facingX,
      blocked:s.blocked
    })));
  }
  return Object.freeze({reset,project,step,snapshot,
    get count(){return entries.size}});
}
