import {
  findTerrainFamilyEncounterProfile
} from './terrain-family-encounter-config.js?rev=terrain-family-encounters-v1';

// One global rarity policy for wild encounters. The creature rank itself
// belongs exclusively to the official Combat Capture creature definition.
// 50/20/10 are author weights (not percentages summing to 100): normalize
// within the available ranks to guarantee that a successful encounter
// actually yields a creature, including when a rank is absent from a biome.
export const GLOBAL_CREATURE_RARITY_WEIGHTS_V1=Object.freeze({
  rare:50,mythic:20,legendary:10
});
function boundedRandom(random){
 const value=Number(random());
 if(!Number.isFinite(value))return 0;
 return Math.max(0,Math.min(0.999999999999,value));
}

export function resolveTerrainFamilyEncounter({
  terrainFamilyId,config,captureCatalog,random=Math.random
}){
 const profile=findTerrainFamilyEncounterProfile(config,terrainFamilyId);
 if(!profile)return Object.freeze({triggered:false,reason:'missing-family',terrainFamilyId});

 // The texture's encounter probability is independent from the species rank.
 if(boundedRandom(random)*100>=profile.encounterChancePercent)
  return Object.freeze({triggered:false,reason:'chance',terrainFamilyId});

 // Historical element percentages in WorldDocument v1 represent only ON/OFF
 // checkboxes. A dual-element species appears once, never twice.
 const enabled=new Set((profile.elementChances??[])
  .filter(entry=>entry.chancePercent>0).map(entry=>entry.elementId));
 const candidates=captureCatalog.listCreatures().filter(creature=>
  creature.eligible!==false &&
  creature.elements.some(id=>enabled.has(id))
 );
 if(!candidates.length)
  return Object.freeze({triggered:false,reason:'no-element',terrainFamilyId});

 const ranks=Object.entries(GLOBAL_CREATURE_RARITY_WEIGHTS_V1)
  .map(([rarity,weight])=>({
   rarity,weight,creatures:candidates.filter(creature=>
    (creature.rarity??'rare')===rarity)
  }))
  .filter(entry=>entry.creatures.length>0);
 if(!ranks.length)
  return Object.freeze({triggered:false,reason:'no-rarity',terrainFamilyId});
 const total=ranks.reduce((sum,rank)=>sum+rank.weight,0);
 const roll=boundedRandom(random)*total;
 let offset=0,chosen=null;
 for(const rank of ranks){
  if(roll<offset+rank.weight){
   const relative=(roll-offset)/rank.weight;
   const index=Math.min(rank.creatures.length-1,
    Math.floor(relative*rank.creatures.length));
   chosen={creature:rank.creatures[index],rarity:rank.rarity};
   break;
  }
  offset+=rank.weight;
 }
 if(!chosen)throw new Error('Invalid canonical encounter rarity selection');
 const elementId=chosen.creature.elements.find(id=>enabled.has(id));
 return Object.freeze({
  triggered:true,reason:'selected',terrainFamilyId,
  elementId,creatureId:chosen.creature.id,rarity:chosen.rarity
 });
}
