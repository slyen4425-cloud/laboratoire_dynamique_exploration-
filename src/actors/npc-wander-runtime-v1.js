// Ephemeral NPC behaviour for the ONE native Exploration navigation loop.
// WorldArea.actors[] is author-owned and never updated by this runtime.
// Every accepted step is delegated to the same core Movement/Collision World
// that moves the hero. No independent map coordinates, collision or save.
import {NPC_PATROL_MODES_V1,NPC_WILD_CONTACT_RANGE_V1,normalizeNpcWildBehaviorV1} from './map-actor-npc-settings-v1.js';
import {sculptNavigationFrameSteps} from '../core/sculpt-navigation-frame-clock.js';
const WANDER_SPEED=38;
const WANDER_RADIUS=5;
const AVOID_HERO_DISTANCE=24;
const TAU=Math.PI*2;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const walking=actor=>finite(actor?.x)&&finite(actor?.y)&&
  (actor.npc?.movement?.mode==='wander'||NPC_PATROL_MODES_V1.includes(actor.npc?.movement?.mode));
const wild=actor=>actor?.npc?.kind==='wild'&&!!actor.npc.wildCreature;
const tracked=actor=>walking(actor)||wild(actor)&&finite(actor.x)&&finite(actor.y);
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
    wildBehavior:wild(actor)?normalizeNpcWildBehaviorV1(actor.npc.wildBehavior):null,
    cooldown:0,awaitLeave:false,chasing:false,fleeing:false,returning:false,
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
      if(!tracked(actor))continue;
      alive.add(actor.id);
      const old=entries.get(actor.id);
      if(!old||old.anchorX!==actor.x||old.anchorY!==actor.y||
          (old.movement!==actor.npc.movement&&
           JSON.stringify(old.movement)!==JSON.stringify(actor.npc.movement))||
          JSON.stringify(old.wildBehavior)!==JSON.stringify(wild(actor)?normalizeNpcWildBehaviorV1(actor.npc.wildBehavior):null))
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
    paused=false,canEngageWild=()=>true}={}){
    sync(actors);
    if(paused||!world||!finite(elapsedSeconds)||elapsedSeconds<=0)return false;
    // A slow phone never makes an NPC teleport to catch up missed frames.
    const dt=Math.min(.14,elapsedSeconds);
    let updated=false;
    for(const state of entries.values()){
      const oldMoving=state.moving;
      state.moving=false;
      const policy=state.wildBehavior;
      const previousReady=state.cooldown<=0&&!state.awaitLeave;
      state.cooldown=Math.max(0,state.cooldown-dt);
      const heroDistance=player?Math.hypot(player.x-state.x,player.y-state.y):Infinity;
      const heroHomeDistance=player?Math.hypot(player.x-state.anchorX,player.y-state.anchorY):Infinity;
      if(state.awaitLeave&&heroDistance>(policy?.mode==='aggressive'?policy.detectionRadius:NPC_WILD_CONTACT_RANGE_V1))
        state.awaitLeave=false;
      updated ||=previousReady!==(state.cooldown<=0&&!state.awaitLeave);
      if(policy?.mode==='aggressive'){
        const allowed=player&&canEngageWild(state.id)&&state.cooldown<=0&&!state.awaitLeave;
        if(state.chasing&&(!allowed||heroHomeDistance>policy.disengageRadius||heroDistance>policy.disengageRadius)){
          state.chasing=false;state.returning=policy.returnHome;
        }
        if(!state.chasing&&!state.returning&&allowed&&heroDistance<=policy.detectionRadius&&heroHomeDistance<=policy.disengageRadius)
          state.chasing=true;
      }
      if(policy?.mode==='flee'){
        if(state.fleeing&&(!player||heroDistance>policy.disengageRadius||heroHomeDistance>policy.disengageRadius)){
          state.fleeing=false;state.returning=policy.returnHome;
        }
        if(player&&heroDistance<=policy.detectionRadius&&heroHomeDistance<=policy.disengageRadius){
          state.fleeing=true;state.returning=false;
        }
      }
      const special=state.chasing||state.fleeing||state.returning;
      if(!special&&(state.done||state.movement.mode==='static')){updated ||=oldMoving;continue;}
      if(!special&&state.pause>0){
        state.pause=Math.max(0,state.pause-dt);
        updated ||=oldMoving;
        continue;
      }
      if(!special&&player&&heroDistance<AVOID_HERO_DISTANCE){
        state.pause=.18;updated ||=oldMoving;continue;
      }
      if(!special&&!state.goal)nextDestination(state);
      // Escape uses the same native movement step and the same territory.
      // At coincident positions choose the actor's existing facing, not a teleport.
      const awayX=state.fleeing?(state.x-player.x||(!heroDistance?state.facingX:0)):0;
      const awayY=state.fleeing?state.y-player.y:0;
      const awayLength=Math.hypot(awayX,awayY)||1;
      const goal=state.chasing?player:state.fleeing?{
        x:state.x+awayX/awayLength*policy.disengageRadius,
        y:state.y+awayY/awayLength*policy.disengageRadius
      }:state.returning?{x:state.anchorX,y:state.anchorY}:state.goal;
      const dx=goal.x-state.x,dy=goal.y-state.y;
      const remaining=Math.hypot(dx,dy);
      const stopDistance=state.chasing?NPC_WILD_CONTACT_RANGE_V1-1:3;
      if(remaining<=stopDistance){
        if(state.returning){state.returning=false;state.goal=null;}
        else if(!state.chasing)reachDestination(state);
        updated ||=oldMoving;continue;
      }
      const x=state.x,y=state.y;
      const bridgeId=state.sculptBridgeId,stairId=state.sculptStairId;
      const travelTime=Math.min(dt,(state.chasing?remaining-stopDistance:remaining)/state.speed);
      const direction={x:dx,y:dy},config={maxSpeed:state.speed};
      for(const stepTime of sculptNavigationFrameSteps(travelTime*1000)){
        const startX=state.x,startY=state.y;
        move(world,state,direction,stepTime,config,undefined,collisionContext);
        if(state.x===startX&&state.y===startY)break;
      }
      const distanceFromAnchor=Math.hypot(state.x-state.anchorX,state.y-state.anchorY);
      const overlapsHero=player&&Math.hypot(player.x-state.x,player.y-state.y)<AVOID_HERO_DISTANCE;
      const distanceAfter=player?Math.hypot(player.x-state.x,player.y-state.y):Infinity;
      if(((state.chasing||state.fleeing)&&distanceFromAnchor>policy.disengageRadius+.001)||
         (!special&&!state.route&&distanceFromAnchor>state.leash+.001)||
         (!state.chasing&&overlapsHero&&(!state.fleeing||distanceAfter<=heroDistance))){
        state.x=x;state.y=y;
        state.sculptBridgeId=bridgeId;state.sculptStairId=stairId;
      }
      const progress=Math.hypot(state.x-x,state.y-y);
      if(progress<.05){
        // Retry the authored segment if a wall blocks it. Random wandering
        // may choose another direction within its leash.
        if(!special&&!state.route)state.goal=null;
        state.pause=.22;state.blocked++;
      }else{
        state.facingX=state.x<x?-1:state.x>x?1:state.facingX;
        state.moving=true;state.blocked=0;
        if(!special&&Math.hypot(goal.x-state.x,goal.y-state.y)<3)reachDestination(state);
      }
      updated ||=progress>.05||oldMoving!==state.moving;
    }
    return updated;
  }
  function wildReady(id){
    const state=entries.get(id);
    return !state?.wildBehavior||state.cooldown<=0&&!state.awaitLeave;
  }
  function markWildEncounter(id){
    const state=entries.get(id);
    if(!state?.wildBehavior)return;
    state.cooldown=state.wildBehavior.cooldownSeconds;
    state.awaitLeave=state.wildBehavior.mode!=='pacific';
    if(state.chasing){state.chasing=false;state.returning=state.wildBehavior.returnHome;}
  }
  function nearestWildContact({actors,player,world,collisionContext,canEngage=()=>true}){
    if(!player||!world)return null;
    let nearest=null,best=Infinity;
    for(const source of actors){
      const state=entries.get(source.id),policy=state?.wildBehavior;
      if(!policy)continue;
      const actor={...source,x:state.x,y:state.y};
      if(!['contact','aggressive'].includes(policy.mode)||!wildReady(actor.id)||!canEngage(actor)||state.returning)continue;
      const distance=Math.hypot(actor.x-player.x,actor.y-player.y);
      if(distance>NPC_WILD_CONTACT_RANGE_V1||distance>=best)continue;
      // Use the same official movement/collision on a disposable probe to
      // reject contact through a wall or cliff, without changing real XY.
      const probe={...state};
      const count=Math.max(1,Math.ceil(distance/3));
      for(let i=0;i<count;i++)move(world,probe,{x:player.x-probe.x,y:player.y-probe.y},
        distance/count/38,{maxSpeed:38},undefined,collisionContext);
      if(Math.hypot(probe.x-player.x,probe.y-player.y)>4)continue;
      nearest=actor;best=distance;
    }
    return nearest;
  }
  function snapshot(){
    return Object.freeze([...entries.values()].map(s=>Object.freeze({
      id:s.id,anchorX:s.anchorX,anchorY:s.anchorY,x:s.x,y:s.y,
      radius:s.leash,moving:s.moving,facingX:s.facingX,
      ...(s.route?{waypoint:s.index,complete:s.done}:{}),
      ...(s.wildBehavior?{chasing:s.chasing,fleeing:s.fleeing,returning:s.returning,cooldown:s.cooldown,awaitLeave:s.awaitLeave}:{}),
      blocked:s.blocked
    })));
  }
  return Object.freeze({reset,project,step,snapshot,wildReady,markWildEncounter,nearestWildContact,
    get count(){return entries.size}});
}
