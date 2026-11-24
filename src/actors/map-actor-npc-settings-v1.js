// A placed NPC's local interaction policy. Creature stats, drops, equipment,
// quests, merchant inventory and combat state remain in their own modules.
import {normalizeNpcCombatInstanceTransportV1} from './npc-combat-instance-transport-v1.js';
export const MAP_ACTOR_NPC_SCHEMA_V1='gensrpg.map-actor-npc.v1';
export const MAP_ACTOR_NPC_KINDS=Object.freeze([
  'dialogue','quest','trainer','wild','merchant'
]);
export const NPC_TRAINER_ROSTER_LIMIT_V1=6;
const NPC_INTERACTION_RANGE_V1=65;
export function normalizeCreatureSlot(raw,label){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
     typeof raw.creatureId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(raw.creatureId))
    throw new TypeError(label+' needs a valid canonical Capture creature reference');
  if(!Number.isSafeInteger(raw.level)||raw.level<1||raw.level>9999)
    throw new RangeError(label+' level must be an integer from 1 to 9999');
  // The snapshot carries a scoped override contract only. Combat validates
  // all registry IDs, actually unlocked skills and effects at encounter time.
  const npcInstance=raw.npcInstance==null?null:
    normalizeNpcCombatInstanceTransportV1(raw.npcInstance);
  return Object.freeze({creatureId:raw.creatureId,level:raw.level,
    ...(npcInstance?{npcInstance}:{})});
}
export function normalizeNpcTrainerRosterV1(raw){
  if(!Array.isArray(raw)||raw.length>NPC_TRAINER_ROSTER_LIMIT_V1)
    throw new RangeError('NPC trainer roster must contain at most six slots');
  return Object.freeze(raw.map((slot,index)=>
    normalizeCreatureSlot(slot,'Trainer slot '+(index+1))));
}
// Transport de scénario uniquement. L'inventaire officiel Capture
// valide et attribue ces références au résultat du Combat.
export function normalizeNpcTrainerRewardV1(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    !Number.isSafeInteger(raw.currency)||raw.currency<0||raw.currency>100000000||
    !Array.isArray(raw.items)||raw.items.length>24||
    Object.keys(raw).some(key=>!['currency','items'].includes(key)))
   throw new RangeError('NPC reward must contain currency and up to 24 canonical item references');
 const ids=new Set();
 const items=raw.items.map(entry=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry)||
     Object.keys(entry).some(key=>!['itemId','quantity'].includes(key))||
     typeof entry.itemId!=='string'||!(/^[a-z0-9][a-z0-9_:.-]{0,129}$/i).test(entry.itemId)||
     !Number.isSafeInteger(entry.quantity)||entry.quantity<1||entry.quantity>9999||
     ids.has(entry.itemId))
   throw new RangeError('Invalid or duplicate NPC reward item');
  ids.add(entry.itemId);
  return Object.freeze({itemId:entry.itemId,quantity:entry.quantity});
 });
 return Object.freeze({currency:raw.currency,items:Object.freeze(items)});
}
function line(value,max,label){
  if(value===undefined||value===null||value==='')return '';
  if(typeof value!=='string'||value.length>max)
    throw new RangeError(label+' must contain at most '+max+' characters');
  return value.trim();
}
export const NPC_PATROL_MODES_V1=Object.freeze(['once','loop','pingpong']);
export function normalizeNpcMovementV1(raw={}){
  const mode=raw?.mode??'static';
  const speed=raw?.speed??38,waitSeconds=raw?.waitSeconds??.6;
  if(!Number.isFinite(speed)||speed<1||speed>200||
     !Number.isFinite(waitSeconds)||waitSeconds<0||waitSeconds>60)
    throw new RangeError('Vitesse ou attente du trajet hors limites');
  if(mode==='static'||mode==='wander'){
    const radius=raw?.radius??90;
    if(!Number.isFinite(radius)||radius<16||radius>600)
      throw new RangeError('NPC wander radius must be 16–600 world units');
    return Object.freeze({mode,radius,
      ...(raw?.speed!==undefined?{speed}:{}),...(raw?.waitSeconds!==undefined?{waitSeconds}:{})});
  }
  if(!NPC_PATROL_MODES_V1.includes(mode)||!Array.isArray(raw.points)||
     raw.points.length<1||raw.points.length>128)
    throw new RangeError('Un trajet doit compter entre 1 et 128 points après le départ');
  const points=raw.points.map(point=>{
    if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||
       Math.abs(point.x)>100000||Math.abs(point.y)>100000)
      throw new RangeError('Point du trajet hors limites');
    return Object.freeze({x:point.x,y:point.y});
  });
  return Object.freeze({mode,speed,waitSeconds,points:Object.freeze(points)});
}
export function normalizeMapActorNpcSettingsV1(raw){
  if(raw===undefined||raw===null)return null;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))
    throw new TypeError('NPC settings must be an object');
  if(!MAP_ACTOR_NPC_KINDS.includes(raw.kind))
    throw new RangeError('Unknown NPC kind');
  const movement=normalizeNpcMovementV1(raw.movement);
  const hasAllowFlee=Object.hasOwn(raw,'allowFlee');
  if(hasAllowFlee&&typeof raw.allowFlee!=='boolean')
    throw new TypeError('NPC allowFlee must be a boolean');
  const hasTrainerEngagement=Object.hasOwn(raw,'trainerEngagement');
  if(hasTrainerEngagement&&raw.trainerEngagement!=='offer'&&raw.trainerEngagement!=='aggressive')
    throw new RangeError('NPC trainer engagement must be offer or aggressive');
  return Object.freeze({
    schema:MAP_ACTOR_NPC_SCHEMA_V1,version:1,kind:raw.kind,
    name:line(raw.name,80,'NPC name'),
    movement,
    // Line breaks separate text screens; HTML is never interpreted.
    dialogue:line(raw.dialogue,2000,'NPC dialogue'),
    questId:line(raw.questId,120,'Quest reference'),
    trainerTeamId:line(raw.trainerTeamId,120,'Trainer team reference'),
    merchantId:line(raw.merchantId,120,'Merchant reference'),
    // NPC-specific scenario composition, not a new reusable Combat/GenSRPG
    // team library. The canonical Combat bestiary owns all creature data.
    ...(Object.hasOwn(raw,'trainerRoster')?
      {trainerRoster:normalizeNpcTrainerRosterV1(raw.trainerRoster)}:{}),
    ...(hasTrainerEngagement?{trainerEngagement:raw.trainerEngagement}:{}),
    ...(hasAllowFlee?{allowFlee:raw.allowFlee}:{}),
    ...(Object.hasOwn(raw,'trainerReward')?
      {trainerReward:normalizeNpcTrainerRewardV1(raw.trainerReward)}:{}),
    ...(raw.wildCreature!=null?
      {wildCreature:normalizeCreatureSlot(raw.wildCreature,'Wild creature')}:{})
  });
}
function isMapPosition(position){
  return Number.isFinite(position?.x)&&Number.isFinite(position?.y);
}
function mapDistance(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y);
}
export function nearestDialogNpcV1(actors,position,range=NPC_INTERACTION_RANGE_V1,canChallengeTrainer,canChallengeWild){
  if(!Array.isArray(actors)||!isMapPosition(position))return null;
  let closest=null,distance=Infinity;
  for(const actor of actors){
    if(!actor?.npc)continue;
    const d=mapDistance(actor,position);
    if(!(d<=range&&d<distance))continue;
    const {npc}=actor;
    const canChallenge=npc.kind==='trainer'&&canChallengeTrainer?.(actor);
    if(canChallenge&&npc.trainerEngagement==='aggressive')continue;
    const canWild=npc.kind==='wild'&&canChallengeWild?.(actor);
    if(!npc.dialogue&&npc.kind!=='merchant'&&!canChallenge&&!canWild)continue;
    closest=actor;distance=d;
  }
  return closest;
}
export function nearestAggressiveTrainerV1(actors,previous,position,canChallengeTrainer){
  if(!Array.isArray(actors)||!isMapPosition(position)||
     (previous!==null&&!isMapPosition(previous)))return null;
  let closest=null,distance=Infinity;
  for(const actor of actors){
    if(actor?.npc?.kind!=='trainer'||actor.npc.trainerEngagement!=='aggressive')continue;
    const d=mapDistance(actor,position);
    if(!(d<=NPC_INTERACTION_RANGE_V1&&d<distance&&
         (previous===null||mapDistance(actor,previous)>NPC_INTERACTION_RANGE_V1)))continue;
    if(!canChallengeTrainer(actor))continue;
    closest=actor;distance=d;
  }
  return closest;
}
