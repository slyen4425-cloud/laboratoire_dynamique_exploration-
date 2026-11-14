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
 return proper(actor,ACTOR_KEYS)&&
  typeof actor.actorId==='string'&&ID.test(actor.actorId)&&
  actor.actorId!==ownActorId&&
  scoped(actor.areaId)&&number(actor.x)&&number(actor.y)&&
  positiveSeq(actor.seq);
}
// This core owns only an in-memory drawing projection of remote actors.
// A full snapshot replaces the previous visible set. The server-owned
// monotonic actor seq and client-snapshot revision block stale arrivals.
export function createExplorationPeerVisualProjectionV1({
 sessionId,worldId,worldFingerprint,ownActorId,maxActors=31
}={}){
 if(!scoped(sessionId)||!scoped(worldId)||!scoped(worldFingerprint)||
  (ownActorId!==undefined&&(!ID.test(ownActorId)))||
  !Number.isInteger(maxActors)||maxActors<1||maxActors>31)
  throw new TypeError('Invalid scoped Exploration peer viewport');
 let current=new Map(),revision=-1,disposed=false;
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
  const received=new Map();
  for(const raw of packet.actors){
   if(!validateActor(raw,ownActorId)||received.has(raw.actorId))
    return false;
   const old=current.get(raw.actorId);
   // An old actor seq can never roll back its displayed location.
   const actor=old&&old.seq>=raw.seq?old:Object.freeze({
    actorId:raw.actorId,areaId:raw.areaId,x:raw.x,y:raw.y,seq:raw.seq
   });
   received.set(raw.actorId,actor);
  }
  current=received;
  revision=packet.revision;
  return true;
 }
 function forArea(areaId){
  if(disposed||!scoped(areaId))return Object.freeze([]);
  return Object.freeze([...current.values()]
   .filter(actor=>actor.areaId===areaId)
   .sort((a,b)=>a.y-b.y||a.actorId.localeCompare(b.actorId)));
 }
 function dispose(){disposed=true;revision=-1;current.clear();}
 return Object.freeze({apply,forArea,dispose});
}
