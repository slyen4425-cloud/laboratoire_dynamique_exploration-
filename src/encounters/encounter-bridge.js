import {
  createCaptureEncounterSnapshot
} from './capture-encounter-contract.js?rev=phase7-snapshot-v1';

export function snapshotFromEncounterIntent(intent, {combatArenaIds} = {}) {
  if (!intent || typeof intent !== 'object') {
    throw new TypeError('Encounter Intent is required');
  }

  return createCaptureEncounterSnapshot({
    encounterId: intent.encounterId,
    source: intent.source,
    playerPartyRef: intent.playerPartyRef,
    opponentCreatureId: intent.opponentCreatureId,
    opponentLevel: intent.opponentLevel,
    wildStatProfile: intent.wildStatProfile,
    rulesetId: intent.rulesetId,
    areaId: intent.areaId,
    terrainFamilyId: intent.terrainFamilyId,
    elementId: intent.elementId,
    combatArenaIds,
    returnToken: intent.returnToken
  });
}
