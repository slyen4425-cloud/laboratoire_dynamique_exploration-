// A placed NPC's local interaction policy. Creature stats, drops, equipment,
// quests, merchant inventory and combat state remain in their own modules.
export const MAP_ACTOR_NPC_SCHEMA_V1='gensrpg.map-actor-npc.v1';
export const MAP_ACTOR_NPC_KINDS=Object.freeze([
  'dialogue','quest','trainer','wild','merchant'
]);
export const NPC_TRAINER_ROSTER_LIMIT_V1=6;
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
    ...(raw.wildCreature!=null?
      {wildCreature:normalizeCreatureSlot(raw.wildCreature,'Wild creature')}:{})
  });
}
export function nearestDialogNpcV1(actors,position,range=65,canChallengeTrainer){
  if(!Array.isArray(actors)||!Number.isFinite(position?.x)||
     !Number.isFinite(position?.y))return null;
  let closest=null,distance=Infinity;
  for(const actor of actors){
    if(!actor?.npc)continue;
    const d=Math.hypot(actor.x-position.x,actor.y-position.y);
    if(!(d<=range&&d<distance))continue;
    const {npc}=actor;
    if(!npc.dialogue&&!(npc.kind==='merchant'&&npc.merchantId)&&
       !(npc.kind==='trainer'&&canChallengeTrainer?.(actor)))continue;
    closest=actor;distance=d;
  }
  return closest;
}
