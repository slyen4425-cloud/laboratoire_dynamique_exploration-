// Sculpt editor adapter: delegates every encounter edit to the existing Builder commands.
// This module owns no encounter rules, odds, or creature catalogue.
import {normalizeTerrainFamilyEncounterConfig} from '../encounters/terrain-family-encounter-config.js';
import {updateTerrainFamilyEncounterProfile,setTerrainFamilyEncounterElementEnabled} from '../builder/world-builder-draft.js';

export function editSculptEncounterChance(config,familyId,percent){
  const draft={encounterConfig:normalizeTerrainFamilyEncounterConfig(config)};
  return normalizeTerrainFamilyEncounterConfig(
    updateTerrainFamilyEncounterProfile(draft,familyId,{encounterChancePercent:percent}).encounterConfig
  );
}
export function editSculptEncounterElement(config,familyId,elementId,enabled){
  const draft={encounterConfig:normalizeTerrainFamilyEncounterConfig(config)};
  return normalizeTerrainFamilyEncounterConfig(
    setTerrainFamilyEncounterElementEnabled(draft,familyId,elementId,enabled).encounterConfig
  );
}
