// Adapt Encounter v1 to the SAME Capture authoring/export pipeline as Combat Editor.
// Official Combat owns statistics, skill definitions, loadouts, tactical rules and
// roster semantics. This file does not read the September historical catalog.
import { importCaptureTransferJsonV1 } from '../../src/adapters/input/capture/capture-entity-transfer-v1.js';
import { buildCaptureEditorCombatTestV1 } from '../../src/ui/capture-editor-combat-test-v1.js';
import { adaptCaptureCombatExportStackV1 } from '../../src/adapters/input/capture/capture-export-adapter-stack-v1.js';
import { normalizeCaptureSkillEditorDraftV1 } from '../../src/contracts/capture-skill-editor-draft-v1.js';
import { normalizeSkillDefinition } from '../../src/contracts/skill-definition.js';
import { capturePortableNativeSkillDraftsV1 } from '../../src/catalogs/capture-portable-native-skill-catalog-v1.js';
import { captureComplexNativeSkillDraftsV1 } from '../../src/catalogs/capture-complex-native-skill-catalog-v1.js';
import { CAPTURE_SHOWCASE_RETIRED_NATIVE_SKILL_IDS_V1 } from '../../src/catalogs/capture-showcase-skill-presets-v1.js';

export const EXPLORATION_NATIVE_COMBAT_BRIDGE_VERSION = 1;

function required(value, field) {
  if(typeof value!=='string'||!value.trim())throw new TypeError(field+' missing');
  return value;
}

export function buildExplorationNativeCombatSourceV1({
  snapshot, party, showcaseCreatureTransfers, showcaseSkillTransfers,
  nativeSkillCatalog, statRegistry, progressionRules, baseFighterRules,
  previewLevel = 20, arenaId = 'forest'
}) {
  if(snapshot?.schema!=='capture-encounter-snapshot-v1'||snapshot.version!==1||
     !Array.isArray(snapshot.opponents)||snapshot.opponents.length!==1)
    throw new RangeError('Unsupported CaptureEncounterSnapshot contract');
  if(required(party?.id,'party.id')!==snapshot.player?.partyRef)
    throw new RangeError('Capture player partyRef not resolved');
  const playerId=required(party.activeCreatureId,'party.activeCreatureId');
  const enemyId=required(snapshot.opponents[0]?.creatureId,'opponent.creatureId');
  if(!Array.isArray(showcaseCreatureTransfers)||!showcaseCreatureTransfers.length)
    throw new TypeError('Official Capture author creature transfers required');
  if(!Array.isArray(showcaseSkillTransfers)||!showcaseSkillTransfers.length)
    throw new TypeError('Official Capture author skill transfers required');
  if(!Array.isArray(nativeSkillCatalog?.entries))
    throw new TypeError('Official Combat skill catalog missing');

  const configuredCreatures=new Map();
  for(const raw of showcaseCreatureTransfers){
    const result=importCaptureTransferJsonV1(JSON.stringify(raw),{statRegistry});
    if(result.kind!=='creature')throw new TypeError('Unexpected creature transfer');
    const record=result.value;
    if(configuredCreatures.has(record.draft.id))throw new RangeError('Duplicate Capture creature '+record.draft.id);
    configuredCreatures.set(record.draft.id,record);
  }
  for(const id of [playerId,enemyId]){
    if(!configuredCreatures.has(id))
      throw new RangeError('Encounter creature not present in current official Showcase: '+id);
  }

  const configuredSkills=new Map();
  const retired=new Set(CAPTURE_SHOWCASE_RETIRED_NATIVE_SKILL_IDS_V1);
  for(const entry of nativeSkillCatalog.entries){
    if(retired.has(entry.definition.id))continue;
    const definition=normalizeSkillDefinition(entry.definition);
    const draft=normalizeCaptureSkillEditorDraftV1({
      schema:'capture-skill-editor-draft-v1',id:definition.id,description:'Native Capture',
      requiredLevel:1,usageScopes:['capture','combat'],definition,presentation:null
    });
    configuredSkills.set(draft.id,draft);
  }
  for(const draft of [...capturePortableNativeSkillDraftsV1(),...captureComplexNativeSkillDraftsV1()]){
    if(!retired.has(draft.id)&&!configuredSkills.has(draft.id))configuredSkills.set(draft.id,draft);
  }
  for(const raw of showcaseSkillTransfers){
    const result=importCaptureTransferJsonV1(JSON.stringify(raw));
    if(result.kind!=='skill')throw new TypeError('Unexpected skill transfer');
    configuredSkills.set(result.value.draft.id,result.value.draft);
  }

  // Validate complete author loadouts, rather than silently truncating an
  // unknown skill or replacing it with a historical ability.
  for(const creatureId of [playerId,enemyId]){
    const record=configuredCreatures.get(creatureId);
    const ids=record.loadout.slots.map(slot=>slot.skillId).filter(Boolean);
    if(!ids.length)throw new RangeError('Creature has no authored abilities: '+creatureId);
    for(const id of ids)if(!configuredSkills.has(id))
      throw new RangeError('Authored Capture skill absent: '+creatureId+' / '+id);
  }
  const combatRules={
    schema:'capture-combat-rules-editor-draft-v1',
    maxEnergy:Number(baseFighterRules?.maxEnergy),
    initialEnergy:Number(baseFighterRules?.initialEnergy),
    energyChargeAmount:Number(baseFighterRules?.energyChargeAmount),
    energyChargeIntervalMs:Number(baseFighterRules?.energyChargeIntervalMs),
    movementEnergyPerStep:Number(baseFighterRules?.movementEnergyPerStep),
    chargeTimeModifierPct:Number(baseFighterRules?.chargeTimeModifierPct)
  };
  const exported=buildCaptureEditorCombatTestV1({
    configuredCreatures,configuredSkills,
    localCreatureIds:[playerId],opponentCreatureIds:[enemyId],
    activePerTeam:1,arenaId,combatRules,
    statRegistry,progressionRules,previewLevel,
    skillSpeedMultiplier:0.5
  });
  return Object.freeze({
    ...adaptCaptureCombatExportStackV1(exported),
    exported,
    sourceCreatureIds:Object.freeze({player:playerId,opponent:enemyId})
  });
}
