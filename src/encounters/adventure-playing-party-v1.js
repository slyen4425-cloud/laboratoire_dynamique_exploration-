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
export function adventurePlayingPartyStorageKeyV1(sessionId){
 return ADVENTURE_PLAYING_PARTY_STORAGE_PREFIX_V1+safeId(sessionId,'sessionId');
}
export function readScopedAdventurePlayingPartyV1({
 storage,sessionId,worldId,authorSha,engineSha,allowedCreatureIds
}={}){
 if(typeof storage?.getItem!=='function')
  throw new TypeError('Same-origin sessionStorage reader required');
 const key=adventurePlayingPartyStorageKeyV1(sessionId);
 safeId(worldId,'worldId');
 verifiedSha(authorSha,'author');verifiedSha(engineSha,'engine');
 const raw=storage.getItem(key);
 if(raw===null)return null;
 if(!Array.isArray(allowedCreatureIds))
  throw new TypeError('Official published Bestiaire allowedCreatureIds required');
 let value;
 try{value=JSON.parse(raw);}
 catch{throw new Error('Adventure playing party JSON illisible; preserved for diagnosis');}
 exactFields(value,['schema','version','sessionId','worldId','combatSha','partyRef','active'],
  'Adventure playing party');
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
 const active=exactFields(value.active,['instanceId','speciesId','level','hp'],
  'Adventure playing party active creature');
 const instanceId=safeId(active.instanceId,'instanceId');
 const speciesId=safeId(active.speciesId,'speciesId');
 if(!allowedCreatureIds.includes(speciesId))
  throw new RangeError('Playing creature is not in the official published Bestiaire');
 if(!Number.isSafeInteger(active.level)||active.level<1||active.level>100)
  throw new RangeError('Playing creature level must be an integer in 1..100');
 if(active.hp!==null&&(!Number.isFinite(active.hp)||active.hp<0||active.hp>Number.MAX_SAFE_INTEGER))
  throw new RangeError('Playing creature HP must be null or a finite nonnegative number');
 return Object.freeze({
  schema:ADVENTURE_PLAYING_PARTY_SCHEMA_V1,version:1,
  sessionId,worldId,combatSha:value.combatSha,partyRef:value.partyRef,
  active:Object.freeze({instanceId,speciesId,level:active.level,hp:active.hp})
 });
}
