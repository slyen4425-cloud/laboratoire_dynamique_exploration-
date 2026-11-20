// Official Exploration visual-only guest projection. The host application
// supplies RLS-protected, read-only peer poses. No navigation, collision,
// checkpoint or avatar artwork is authoritative outside Exploration.
export const EXPLORATION_PEER_SNAPSHOT_EVENT_V1=
 'gensrpg.exploration.play.peer-snapshot.v1';
export const EXPLORATION_PEER_RECEIVER_READY_EVENT_V1=
 'gensrpg.exploration.play.peer-receiver-ready.v1';
const PACKET_KEYS=['schema','version','sessionId','worldId',
 'worldFingerprint','revision','actors'];
const ACTOR_KEYS=['actorId','areaId','x','y','seq'];
const NAME_LIMIT=48;
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const proper=(obj,fields)=>obj!==null&&typeof obj==='object'&&
 !Array.isArray(obj)&&Object.keys(obj).length===fields.length&&
 Object.keys(obj).every(key=>fields.includes(key));
const scoped=value=>typeof value==='string'&&value.length>0&&value.length<=130&&
 !/[\u0000-\u001f\u007f]/.test(value);
const number=value=>typeof value==='number'&&Number.isFinite(value)&&
 value>=0&&value<=1000000;
const positiveSeq=value=>Number.isSafeInteger(value)&&value>=1;
function validateActor(actor,ownActorId){
 return proper(actor,[...ACTOR_KEYS,
  ...(Object.hasOwn(actor??{},'displayName')?['displayName']:[])])&&
  (actor.displayName===undefined||(typeof actor.displayName==='string'&&
   !!actor.displayName.trim()&&actor.displayName.trim().length<=NAME_LIMIT&&
   !/[\u0000-\u001f\u007f]/.test(actor.displayName)))&&
  typeof actor.actorId==='string'&&ID.test(actor.actorId)&&
  actor.actorId!==ownActorId&&
  scoped(actor.areaId)&&number(actor.x)&&number(actor.y)&&
  positiveSeq(actor.seq);
}
// This core owns only an in-memory drawing projection of remote actors.
// A full snapshot replaces the previous visible set. The server-owned
// monotonic actor seq and client-snapshot revision block stale arrivals.
export function createExplorationPeerVisualProjectionV1({
 sessionId,worldId,worldFingerprint,ownActorId,maxActors=31,
 clock=()=>performance.now()
}={}){
 if(!scoped(sessionId)||!scoped(worldId)||!scoped(worldFingerprint)||
  (ownActorId!==undefined&&(!ID.test(ownActorId)))||
  !Number.isInteger(maxActors)||maxActors<1||maxActors>31||
  typeof clock!=='function')
  throw new TypeError('Invalid scoped Exploration peer viewport');
 // Received rows stay canonical. Only these ephemeral in-memory segments
 // interpolate the pixels drawn by the existing official MapActorRenderer.
 const MIN_BLEND_MS=140,MAX_BLEND_MS=340,MAX_CONTINUOUS_STEP=240;
 let current=new Map(),segments=new Map(),lastReceivedAt=new Map();
 let revision=-1,disposed=false;
 const validArea=areaId=>!disposed&&scoped(areaId);
 function visual(actor,at){
  const segment=segments.get(actor.actorId);
  if(!segment||segment.seq!==actor.seq||segment.areaId!==actor.areaId)
   return Object.freeze({...actor,moving:false,directionX:0,directionY:0,facingX:1});
  const fraction=Math.max(0,Math.min(1,(at-segment.startedAt)/segment.durationMs));
  const x=segment.fromX+(actor.x-segment.fromX)*fraction;
  const y=segment.fromY+(actor.y-segment.fromY)*fraction;
  return Object.freeze({...actor,x,y,moving:fraction<1,
   directionX:segment.dx,directionY:segment.dy,
   facingX:segment.dx<0?-1:1});
 }
 function apply(packet){
  if(disposed||!proper(packet,PACKET_KEYS)||
   packet.schema!==EXPLORATION_PEER_SNAPSHOT_EVENT_V1||
   packet.version!==1||packet.sessionId!==sessionId||
   packet.worldId!==worldId||
   packet.worldFingerprint!==worldFingerprint||
   !Number.isSafeInteger(packet.revision)||packet.revision<0||
   packet.revision<=revision||
   !Array.isArray(packet.actors)||packet.actors.length>maxActors)
   return false;
  const received=new Map(),nextSegments=new Map(),nextReceivedAt=new Map(),at=clock();
  for(const raw of packet.actors){
   if(!validateActor(raw,ownActorId)||received.has(raw.actorId))
    return false;
   const old=current.get(raw.actorId);
   let actor;
   if(old&&old.seq>=raw.seq){
    // A membership-verified name may change without a new pose revision.
    const name=raw.displayName?.trim();
    actor=old.seq===raw.seq&&name!==old.displayName
     ?Object.freeze({...old,...(name===undefined?{}:{displayName:name})}):old;
   }else{
    actor=Object.freeze({
     actorId:raw.actorId,areaId:raw.areaId,x:raw.x,y:raw.y,seq:raw.seq,
     ...(raw.displayName===undefined?{}:{displayName:raw.displayName.trim()})
    });
   }
   received.set(raw.actorId,actor);
   nextReceivedAt.set(raw.actorId,old&&actor.seq===old.seq
    ?lastReceivedAt.get(raw.actorId)??at:at);
   if(old&&actor.seq===old.seq){
    if(segments.has(actor.actorId))
     nextSegments.set(actor.actorId,segments.get(actor.actorId));
   }else if(old&&old.areaId===actor.areaId){
    const previous=visual(old,at),dx=actor.x-previous.x,dy=actor.y-previous.y;
    const distance=Math.hypot(dx,dy);
    // A portal/respawn or a large network gap must not glide through terrain.
    if(distance>.001&&distance<=MAX_CONTINUOUS_STEP){
     const gap=at-(lastReceivedAt.get(raw.actorId)??at);
     // Adapt only the draw duration to the measured server delivery interval.
     // No prediction/extrapolation: the authoritative accepted pose stays exact.
     const durationMs=Math.min(MAX_BLEND_MS,Math.max(MIN_BLEND_MS,gap*1.1));
     nextSegments.set(actor.actorId,Object.freeze({
      areaId:actor.areaId,seq:actor.seq,fromX:previous.x,fromY:previous.y,
      startedAt:at,durationMs,dx,dy
     }));
    }
   }
  }
  current=received;segments=nextSegments;lastReceivedAt=nextReceivedAt;
  revision=packet.revision;
  return true;
 }
 function forArea(areaId){
  if(!validArea(areaId))return Object.freeze([]);
  return Object.freeze([...current.values()]
   .filter(actor=>actor.areaId===areaId)
   .sort((a,b)=>a.y-b.y||a.actorId.localeCompare(b.actorId)));
 }
 function sampleForArea(areaId,at=clock()){
  if(!validArea(areaId))return Object.freeze([]);
  return Object.freeze([...current.values()]
   .filter(actor=>actor.areaId===areaId)
   .map(actor=>visual(actor,at))
   .sort((a,b)=>a.y-b.y||a.actorId.localeCompare(b.actorId)));
 }
 function isAnimating(areaId,at=clock()){
  return validArea(areaId)&&[...current.values()].some(actor=>{
   const segment=segments.get(actor.actorId);
   return actor.areaId===areaId&&segment?.seq===actor.seq&&
    at>=segment.startedAt&&at<segment.startedAt+segment.durationMs;
  });
 }
 function dispose(){disposed=true;revision=-1;current.clear();segments.clear();lastReceivedAt.clear();}
 return Object.freeze({apply,forArea,sampleForArea,isAnimating,dispose});
}
