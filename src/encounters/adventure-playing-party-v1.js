import {assertExplorationWorldDocumentIdV1} from '../world/world-document-identity-v1.js';
// Read-only transport of the TRUE Capture-owned party. This is NOT a second
// roster, creature catalog, combat resolver, XP system or Adventure save.
// A scoped game must never fall back to the standalone Tester party or level.
export const ADVENTURE_PLAYING_PARTY_SCHEMA_V1='gensrpg.capture.v2.active-party.v1';
export const ADVENTURE_PLAYING_PARTY_STORAGE_PREFIX_V1=
 ADVENTURE_PLAYING_PARTY_SCHEMA_V1+':';

function safeId(value,field){
 if(typeof value!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(value))
  throw new RangeError('Invalid '+field+' in Adventure playing party');
 return value;
}
function verifiedSha(value,field){
 if(typeof value!=='string'||!/^[a-f0-9]{40}$/.test(value))
  throw new TypeError('Invalid Combat '+field+' sha for Adventure playing party');
 return value;
}
function exactFields(value,keys,field){
 if(!value||typeof value!=='object'||Array.isArray(value)||
    Object.keys(value).length!==keys.length||
    keys.some(key=>!Object.hasOwn(value,key)))
  throw new TypeError('Invalid '+field+' fields');
 return value;
}
// Validates transport syntax only. Combat's official stat registry is solely
// responsible for whether a stat exists and what its points change.
function scopedStatAllocations(input){
 if(!input || typeof input!=='object' || Array.isArray(input) ||
    Object.getPrototypeOf(input)!==Object.prototype)
  throw new TypeError('Adventure statAllocations must be a plain object');
 const entries=Object.entries(input);
 for(const [id,points] of entries){
  if(!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(id))
   throw new RangeError('Invalid Adventure stat allocation ID');
  if(typeof points!=='number'||!Number.isSafeInteger(points)||points<0)
   throw new RangeError('Adventure stat allocation points must be nonnegative safe integers');
 }
 return Object.freeze(Object.fromEntries(entries));
}

export function adventurePlayingPartyStorageKeyV1(sessionId){
 return ADVENTURE_PLAYING_PARTY_STORAGE_PREFIX_V1+safeId(sessionId,'sessionId');
}
export function readScopedAdventurePlayingPartyV1({
 storage,sessionId,worldId,authorSha,engineSha,allowedCreatureIds
}={}){
 if(typeof storage?.getItem!=='function')
  throw new TypeError('Same-origin sessionStorage reader required');
 const key=adventurePlayingPartyStorageKeyV1(sessionId);
 assertExplorationWorldDocumentIdV1(worldId);
 verifiedSha(authorSha,'author');verifiedSha(engineSha,'engine');
 const raw=storage.getItem(key);
 if(raw===null)return null;
 if(!Array.isArray(allowedCreatureIds))
  throw new TypeError('Official published Bestiaire allowedCreatureIds required');
 let value;
 try{value=JSON.parse(raw);}
 catch{throw new Error('Adventure playing party JSON illisible; preserved for diagnosis');}
 const hasHpPolicy=Object.hasOwn(value,'combatHpMultiplier');
 const hasReserve=Object.hasOwn(value,'reserve');
 const hasTrainerVictories=Object.hasOwn(value,'trainerVictories');
 exactFields(value,['schema','version','sessionId','worldId','combatSha','partyRef','active',
  ...(hasReserve?['reserve']:[]),...(hasHpPolicy?['combatHpMultiplier']:[]),
  ...(hasTrainerVictories?['trainerVictories']:[])],
  'Adventure playing party');
 // Legacy games without the field still use 100% HP; never infer game
 // rules from an author's species, level, or the standalone Tester.
 const combatHpMultiplier=hasHpPolicy?value.combatHpMultiplier:1;
 if(typeof combatHpMultiplier!=='number'||!Number.isFinite(combatHpMultiplier)||
    combatHpMultiplier<=0||combatHpMultiplier>1)
  throw new RangeError('Invalid Adventure combatHpMultiplier in (0,1]');
 if(value.schema!==ADVENTURE_PLAYING_PARTY_SCHEMA_V1||value.version!==1)
  throw new RangeError('Invalid versioned Adventure playing party schema');
 if(value.sessionId!==sessionId)
  throw new Error('Adventure playing party session mismatch');
 if(value.worldId!==worldId)
  throw new Error('Adventure playing party world mismatch');
 if(verifiedSha(value.combatSha,'playing-party')!==authorSha||value.combatSha!==engineSha)
  throw new Error('Adventure playing party Combat sha mismatch');
 if(value.partyRef!=='adventure-party:'+sessionId)
  throw new Error('Adventure partyRef must match saved AdventureSession; Tester forbidden');
 // The GenSRPG AdventureSession remains the sole roster owner. This
 // reader validates the bounded transport only; it never edits party order.
 function scopedMember(entry,label){
  const hasStats=Object.hasOwn(entry??{},'statAllocations');
  const actor=exactFields(entry,['instanceId','speciesId','level','hp',
   ...(hasStats?['statAllocations']:[])],label);
  const instanceId=safeId(actor.instanceId,'instanceId');
  const speciesId=safeId(actor.speciesId,'speciesId');
  if(!allowedCreatureIds.includes(speciesId))
   throw new RangeError('Playing creature is not in the official published Bestiaire');
  if(!Number.isSafeInteger(actor.level)||actor.level<1)
   throw new RangeError('Playing creature level must be a positive safe integer');
  if(actor.hp!==null&&(!Number.isFinite(actor.hp)||actor.hp<0||actor.hp>Number.MAX_SAFE_INTEGER))
   throw new RangeError('Playing creature HP must be null or a finite nonnegative number');
  return Object.freeze({instanceId,speciesId,level:actor.level,hp:actor.hp,
   ...(hasStats?{statAllocations:scopedStatAllocations(actor.statAllocations)}:{})});
 }
 const active=scopedMember(value.active,'Adventure playing party active creature');
 const reserve=hasReserve?value.reserve:null;
 if(reserve!==null&&(!Array.isArray(reserve)||reserve.length>5))
  throw new RangeError('Adventure playing party reserve must have 0 to 5 members');
 const reserveMembers=reserve?.map((member,index)=>scopedMember(member,'Adventure reserve '+index))??[];
 const all=[active,...reserveMembers];
 if(new Set(all.map(member=>member.instanceId)).size!==all.length)
  throw new RangeError('Duplicate Adventure party instanceId');
 let trainerVictories;
 if(hasTrainerVictories){
  if(!Array.isArray(value.trainerVictories))throw new TypeError('Adventure trainer victories must be an array');
  trainerVictories=Object.freeze(value.trainerVictories.map(raw=>{
   const entry=exactFields(raw,['areaId','actorId'],'Adventure trainer victory');
   if(typeof entry.areaId!=='string'||!entry.areaId.trim()||typeof entry.actorId!=='string'||!entry.actorId.trim())
    throw new TypeError('Adventure trainer victory requires an area and actor');
   return Object.freeze({areaId:entry.areaId,actorId:entry.actorId});
  }));
 }
 return Object.freeze({
  schema:ADVENTURE_PLAYING_PARTY_SCHEMA_V1,version:1,
  sessionId,worldId,combatSha:value.combatSha,partyRef:value.partyRef,
  active,...(hasReserve?{reserve:Object.freeze(reserveMembers)}:{}),
  ...(hasTrainerVictories?{trainerVictories}:{}),
  combatHpMultiplier
 });
}
