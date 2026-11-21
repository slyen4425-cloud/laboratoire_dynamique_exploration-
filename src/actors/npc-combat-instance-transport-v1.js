// Strict TRANSPORT contract only. Combat is the sole authority that validates
// stat IDs against its registry, skill unlocks and actual battle effects.
export const NPC_COMBAT_INSTANCE_SCHEMA_V1='capture-npc-opponent-instance-v1';
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,129}$/;
export function normalizeNpcCombatInstanceTransportV1(raw){
 if(raw==null)return null;
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    Object.getPrototypeOf(raw)!==Object.prototype||
    raw.schema!==NPC_COMBAT_INSTANCE_SCHEMA_V1||
    Object.keys(raw).some(k=>!['schema','displayName','statAllocations','skillIds'].includes(k)))
  throw new RangeError('Réglage de combattant PNJ non compatible avec Combat');
 const result={schema:NPC_COMBAT_INSTANCE_SCHEMA_V1};
 if(raw.displayName!==undefined){
  if(typeof raw.displayName!=='string'||!raw.displayName.trim()||
     raw.displayName.trim().length>80)throw RangeError('Nom de combattant invalide');
  result.displayName=raw.displayName.trim();
 }
 if(raw.statAllocations!==undefined){
  const points=raw.statAllocations;
  if(!points||typeof points!=='object'||Array.isArray(points)||
     Object.getPrototypeOf(points)!==Object.prototype||Object.keys(points).length>32)
   throw RangeError('Bonus statistiques PNJ invalides');
  const values={};let sum=0;
  for(const [id,n] of Object.entries(points)){
   if(!ID.test(id)||!Number.isSafeInteger(n)||n<0||n>100000)
    throw RangeError('Bonus statistiques PNJ invalides');
   sum+=n;
   if(sum>1000000)throw RangeError('Budget total de bonus PNJ trop élevé');
   values[id]=n;
  }
  result.statAllocations=Object.freeze(values);
 }
 if(raw.skillIds!==undefined){
  if(!Array.isArray(raw.skillIds)||raw.skillIds.length<1||raw.skillIds.length>5||
     new Set(raw.skillIds).size!==raw.skillIds.length||
     raw.skillIds.some(id=>typeof id!=='string'||!ID.test(id)))
   throw RangeError('Compétences PNJ : 1 à 5 capacités officielles distinctes');
  result.skillIds=Object.freeze([...raw.skillIds]);
 }
 if(Object.keys(result).length<2)throw RangeError('Aucun réglage de combattant PNJ');
 return Object.freeze(result);
}
