// Pure reader for a *derived*, temporary GenSRPG publication grant.
// Combat's real Bestiary is the ONLY publisher. Exploration still owns its
// Showcase catalog, terrain-family encounter resolver and spawn probabilities.
// This service does NOT decide creature publication or persist gameplay state.
export const ADVENTURE_PUBLISHED_ENCOUNTER_SCHEMA_V1=
  'gensrpg.capture.v2.published-encounters.v1';
export const ADVENTURE_PUBLISHED_ENCOUNTER_STORAGE_PREFIX_V1=
  'gensrpg.capture.v2.published-encounters.v1:';

function safeId(value,field){
 if(typeof value!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(value))
  throw new RangeError('Invalid '+field+' identifier in Adventure publication grant');
 return value;
}
function sha(value,field){
 if(typeof value!=='string'||!/^[a-f0-9]{40}$/.test(value))
  throw new TypeError('Invalid official Combat '+field+' sha');
 return value;
}
function exactFields(value,fields){
 if(!value||typeof value!=='object'||Array.isArray(value)||
   Object.keys(value).length!==fields.length||
   fields.some(field=>!Object.hasOwn(value,field)))
  throw new TypeError('Invalid versioned Adventure publication grant fields');
}

export function adventurePublishedEncounterStorageKeyV1(sessionId){
 return ADVENTURE_PUBLISHED_ENCOUNTER_STORAGE_PREFIX_V1+
  safeId(sessionId,'session');
}

export function readScopedAdventurePublishedEncountersV1({
 storage,sessionId,worldId,authorSha,engineSha
}={}){
 if(typeof storage?.getItem!=='function')
  throw new TypeError('Official same-origin sessionStorage adapter required');
 const key=adventurePublishedEncounterStorageKeyV1(sessionId);
 safeId(worldId,'world');
 sha(authorSha,'author');sha(engineSha,'engine');
 const raw=storage.getItem(key);
 if(raw===null)return null;
 let grant;
 try{grant=JSON.parse(raw);}
 catch{throw new Error('Adventure publication grant JSON illisible, conservé');}
 exactFields(grant,['schema','version','sessionId','worldId',
  'combatSha','allowedCreatureIds']);
 if(grant.schema!==ADVENTURE_PUBLISHED_ENCOUNTER_SCHEMA_V1||grant.version!==1)
  throw new RangeError('Unsupported Adventure publication grant schema/version');
 if(grant.sessionId!==sessionId)
  throw new Error('Adventure publication session identity mismatch');
 if(grant.worldId!==worldId)
  throw new Error('Adventure publication world mismatch; no encounters authorized');
 if(sha(grant.combatSha,'grant')!==authorSha||grant.combatSha!==engineSha)
  throw new Error('Adventure publication does not match official Combat author/engine sha');
 if(!Array.isArray(grant.allowedCreatureIds))
  throw new TypeError('Adventure publication allowedCreatureIds must be an array');
 const unique=new Set();
 for(const entry of grant.allowedCreatureIds){
  const id=safeId(entry,'published creature');
  if(unique.has(id))throw new RangeError('Duplicate published creature in Adventure grant: '+id);
  unique.add(id);
 }
 return Object.freeze([...unique]);
}
