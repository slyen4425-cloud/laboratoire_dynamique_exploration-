// A placed NPC's local interaction policy. Creature stats, drops, equipment,
// quests, merchant inventory and combat state remain in their own modules.
export const MAP_ACTOR_NPC_SCHEMA_V1='gensrpg.map-actor-npc.v1';
export const MAP_ACTOR_NPC_KINDS=Object.freeze([
  'dialogue','quest','trainer','wild','merchant'
]);
export const NPC_TRAINER_ROSTER_LIMIT_V1=6;
const NPC_INTERACTION_RANGE_V1=65;
function normalizeCreatureSlot(raw,label){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
     typeof raw.creatureId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(raw.creatureId))
    throw new TypeError(label+' needs a valid canonical Capture creature reference');
  if(!Number.isSafeInteger(raw.level)||raw.level<1||raw.level>9999)
    throw new RangeError(label+' level must be an integer from 1 to 9999');
  // Do not copy any creature stats, abilities, visuals or species definitions.
  return Object.freeze({creatureId:raw.creatureId,level:raw.level});
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
export function normalizeMapActorNpcSettingsV1(raw){
  if(raw===undefined||raw===null)return null;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))
    throw new TypeError('NPC settings must be an object');
  if(!MAP_ACTOR_NPC_KINDS.includes(raw.kind))
    throw new RangeError('Unknown NPC kind');
  const mode=raw.movement?.mode??'static';
  if(mode!=='static'&&mode!=='wander')
    throw new RangeError('NPC movement mode must be static or wander');
  const radius=raw.movement?.radius??90;
  if(!Number.isFinite(radius)||radius<16||radius>600)
    throw new RangeError('NPC wander radius must be 16–600 world units');
  const hasTrainerEngagement=Object.hasOwn(raw,'trainerEngagement');
  if(hasTrainerEngagement&&raw.trainerEngagement!=='offer'&&raw.trainerEngagement!=='aggressive')
    throw new RangeError('NPC trainer engagement must be offer or aggressive');
  return Object.freeze({
    schema:MAP_ACTOR_NPC_SCHEMA_V1,version:1,kind:raw.kind,
    name:line(raw.name,80,'NPC name'),
    movement:Object.freeze({mode,radius}),
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
export function nearestDialogNpcV1(actors,position,range=NPC_INTERACTION_RANGE_V1,canChallengeTrainer){
  if(!Array.isArray(actors)||!isMapPosition(position))return null;
  let closest=null,distance=Infinity;
  for(const actor of actors){
    if(!actor?.npc)continue;
    const d=mapDistance(actor,position);
    if(!(d<=range&&d<distance))continue;
    const {npc}=actor;
    const canChallenge=npc.kind==='trainer'&&canChallengeTrainer?.(actor);
    if(canChallenge&&npc.trainerEngagement==='aggressive')continue;
    if(!npc.dialogue&&!(npc.kind==='merchant'&&npc.merchantId)&&!canChallenge)continue;
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
