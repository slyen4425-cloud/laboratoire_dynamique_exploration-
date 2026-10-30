// Exploration owns the trigger, Capture owns the creature catalogue and combat.
// Pure per-movement boundary: no global timers, no second hero position.
import {terrainFamilyAtWorldPosition} from '../world/sculpt-terrain-family-at-position.js';
import {resolveTerrainFamilyEncounter} from './terrain-family-encounter-resolver.js';

export function evaluateSculptEncounterAfterMovement({
  surface, position, distanceMoved, config, captureCatalog, random=Math.random
}){
  if(!Number.isFinite(distanceMoved)||distanceMoved<=0){
    return Object.freeze({triggered:false,reason:'no-movement'});
  }
  const terrainFamilyId=terrainFamilyAtWorldPosition(surface,position);
  return resolveTerrainFamilyEncounter({
    terrainFamilyId,config,captureCatalog,random
  });
}
