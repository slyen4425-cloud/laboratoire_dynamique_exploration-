// Single authoring/transport data contract. Combat exclusively owns stat effects.
export const DEFAULT_WORLD_ENCOUNTER_STAT_PROFILE_V1=Object.freeze({
 pointsPerLevel:20,healthMinimumPct:15,defenseMinimumPct:15,
 speedMinimumPct:15,specialtyMultiplier:1
});
export function normalizeWorldEncounterStatProfileV1(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.getPrototypeOf(raw)!==Object.prototype)
  throw new TypeError('WorldArea wild stat profile must be a plain object');
 const allowed=new Set(Object.keys(DEFAULT_WORLD_ENCOUNTER_STAT_PROFILE_V1));
 for(const id of Object.keys(raw))if(!allowed.has(id))
  throw new RangeError('WorldArea wild stat profile unknown field: '+id);
 const p={...DEFAULT_WORLD_ENCOUNTER_STAT_PROFILE_V1,...raw};
 if(!Number.isSafeInteger(p.pointsPerLevel)||p.pointsPerLevel<0||p.pointsPerLevel>1000)
  throw new RangeError('WorldArea pointsPerLevel must be 0..1000');
 for(const id of ['healthMinimumPct','defenseMinimumPct','speedMinimumPct']){
  if(typeof p[id]!=='number'||!Number.isFinite(p[id])||p[id]<0||p[id]>100)
   throw new RangeError('WorldArea '+id+' must be 0..100');
 }
 if(p.healthMinimumPct+p.defenseMinimumPct+p.speedMinimumPct>100)
  throw new RangeError('WorldArea stat minimums cannot exceed 100%');
 if(typeof p.specialtyMultiplier!=='number'||!Number.isFinite(p.specialtyMultiplier)||
    p.specialtyMultiplier<0||p.specialtyMultiplier>10)
  throw new RangeError('WorldArea specialtyMultiplier must be 0..10');
 return Object.freeze(p);
}
