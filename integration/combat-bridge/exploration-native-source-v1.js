// Adapt Encounter v1 to the SAME Capture authoring/export pipeline as Combat Editor.
// Official Combat owns statistics, skill definitions, loadouts, tactical rules and
// roster semantics. This file does not read the September historical catalog.
import { importCaptureTransferJsonV1 } from '../../src/adapters/input/capture/capture-entity-transfer-v1.js';
import { buildCaptureEncounterCombatSourceV1 } from '../../src/ui/capture-encounter-combat-source-v1.js';
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
  snapshot, party, adventureParty, showcaseCreatureTransfers, showcaseSkillTransfers,
  nativeSkillCatalog, statRegistry, progressionRules, baseFighterRules,
  previewLevel = 20, arenaId = 'forest'
}) {
  const trainer=snapshot?.source==='npc-trainer';
  if(snapshot?.schema!=='capture-encounter-snapshot-v1'||snapshot.version!==1||
     !Array.isArray(snapshot.opponents)||snapshot.opponents.length<1||
     snapshot.opponents.length>(trainer?6:1))
    throw new RangeError('Unsupported CaptureEncounterSnapshot contract');
  if(required(party?.id,'party.id')!==snapshot.player?.partyRef)
    throw new RangeError('Capture player partyRef not resolved');
  const playerId=required(party.activeCreatureId,'party.activeCreatureId');
  const scoped=party.id.startsWith('adventure-party:');
  if(scoped&&(!adventureParty||adventureParty.partyRef!==party.id||adventureParty.active?.speciesId!==playerId))
    throw new RangeError('Aventure exige le combattant actif de la partie autorisée');
  if(!scoped&&adventureParty!==undefined)
    throw new RangeError('Aventure et Tester ont des équipes distinctes');
  const rivals=snapshot.opponents.map(member=>{
    const speciesId=required(member?.creatureId,'opponent.creatureId');
    const level=member.level;
    if((trainer||level!==undefined)&&(!Number.isSafeInteger(level)||level<1||level>9999))
      throw new RangeError('Encounter opponent.level must be a valid authored WorldArea level');
    return {speciesId,level};
  });
  const [{speciesId:enemyId,level:authoredEnemyLevel},...opponentReserve]=rivals;
  const participants=new Set([playerId,...rivals.map(member=>member.speciesId)]);
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
  for(const id of participants){
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
  for(const creatureId of participants){
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
  const options={
    configuredCreatures,configuredSkills,arenaId,combatRules,
    statRegistry,progressionRules,skillSpeedMultiplier:0.5
  };
  const sourceCreatureIds=Object.freeze({player:playerId,opponent:enemyId});
  if(trainer&&!scoped){
    const source=buildCaptureEncounterCombatSourceV1({
      ...options,wildStatProfile:snapshot.rules?.wildStatProfile??{},
      local:{speciesId:playerId,level:previewLevel,instanceId:party.id},
      opponent:{speciesId:enemyId,level:authoredEnemyLevel},opponentReserve
    });
    return Object.freeze({...source,sourceCreatureIds});
  }
  if(scoped){
    const source=buildCaptureEncounterCombatSourceV1({
      // Global real-game HP rule is applied by Combat's one authoritative
      // encounter builder, after official stat projection. No creature edits.
      ...options,hpMultiplier:adventureParty.combatHpMultiplier,
      // Only an explicitly authored WorldArea level activates NPC growth.
      ...(authoredEnemyLevel===undefined?{}:{wildStatProfile:snapshot.rules?.wildStatProfile??{}}),
      local:adventureParty.active,
      // Keep the saved order and identities. Combat alone builds the
      // rechargeable native bench, individual stats and KO rules.
      localReserve:adventureParty.reserve??[],
      opponent:{speciesId:enemyId,level:authoredEnemyLevel??configuredCreatures.get(enemyId).draft.level},
      ...(trainer?{opponentReserve}:{})
    });
    const expected=1+(adventureParty.reserve?.length??0);
    const bench=source.roster?.teams?.['local-1']?.members;
    if(!Array.isArray(bench)||bench.length!==expected)
      throw new Error('Official Combat did not register all Adventure party members');
    if(trainer&&source.roster?.teams?.['opponent-1']?.members?.length!==rivals.length)
      throw new Error('Official Combat did not register all trainer party members');
    return Object.freeze({...source,sourceCreatureIds});
  }
  const exported=buildCaptureEditorCombatTestV1({
    ...options,localCreatureIds:[playerId],opponentCreatureIds:[enemyId],
    activePerTeam:1,previewLevel
  });
  return Object.freeze({...adaptCaptureCombatExportStackV1(exported),exported,sourceCreatureIds});
}

// This bridge file is already byte-transported by EVERY certified Exploration
// preview, including older frozen worlds. No extra module import is allowed.
export function officialAdventureCombatRequestV1(url,{
  sessionId=null,loadId=null
}={}){
 const source=new URL(url);
 if(sessionId===null){
  if(loadId!==null)throw new TypeError('No cache isolation token outside Aventure');
  return Object.freeze({url:source.href,init:undefined});
 }
 if(typeof sessionId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(sessionId))
  throw new RangeError('Invalid Adventure session for official Combat transport');
 if(typeof loadId!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(loadId))
  throw new RangeError('Scoped Adventure requires a valid boot UUID');
 source.searchParams.set('_gens_capture_release',loadId);
 return Object.freeze({url:source.href,init:Object.freeze({cache:'no-store'})});
}
