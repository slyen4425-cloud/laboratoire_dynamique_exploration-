// Read-only projection of official Combat showcase transfers. The source
// defines the creature stats and the native authored skill slots. This module
// never creates skill definitions, derives combat effects, or writes catalogs.
import {normalizeCaptureAuthorEncounterBundleV1} from '../capture/capture-showcase-encounter-source-v1.js';

export const NPC_COMBAT_STAT_LABELS_V1=Object.freeze({
 health:'PV',speed:'Vitesse',physical:'Physique',defense:'Défense',
 fire:'Feu',water:'Eau',earth:'Terre',air:'Air',electric:'Électricité',
 light:'Lumière',shadow:'Ombre',poison:'Poison',nature:'Nature',
 ice:'Glace',acier:'Acier',steel:'Acier',psy:'Psychique',spirit:'Esprit'
});
export function projectNpcCombatAuthoringCatalogV1(raw){
 const bundle=normalizeCaptureAuthorEncounterBundleV1(raw);
 const skills=new Map(bundle.skillTransfers.map(rawSkill=>{
  const draft=rawSkill?.draft??{};
  return [draft.id,draft.definition?.name??draft.displayName??draft.id];
 }).filter(([id,name])=>typeof id==='string'&&
  typeof name==='string'&&id&&name));
 const templates=new Map();
 for(const transfer of bundle.creatureTransfers){
  const id=transfer.draft?.id;
  if(typeof id!=='string'||!id||templates.has(id))
   throw new RangeError('Référence d’espèce dupliquée dans la source Combat');
  const record=transfer.statValues?.values??{};
  const stats=Object.entries(record).filter(([statId,n])=>
   /^[a-z0-9_.:-]+$/i.test(statId)&&Number.isFinite(n)&&n>=0)
   .map(([statId,n])=>Object.freeze({
    id:statId,label:NPC_COMBAT_STAT_LABELS_V1[statId]??statId,base:n
   }));
  const entries=transfer.loadout?.slots??[];
  const offered=[];
  for(const slot of entries){
   const skillId=slot?.skillId;
   if(!skillId||!skills.has(skillId)||offered.some(s=>s.id===skillId))continue;
   offered.push(Object.freeze({id:skillId,name:skills.get(skillId)}));
  }
  templates.set(id,Object.freeze({speciesId:id,
   name:transfer.draft.displayName,stats:Object.freeze(stats),
   skills:Object.freeze(offered)}));
 }
 return templates;
}
