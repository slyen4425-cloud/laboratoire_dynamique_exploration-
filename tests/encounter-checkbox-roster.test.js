import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTerrainFamilyEncounterConfig
} from '../src/encounters/terrain-family-encounter-config.js';
import {resolveTerrainFamilyEncounter} from '../src/encounters/terrain-family-encounter-resolver.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {
  createBlankWorldBuilderDraft, setTerrainFamilyEncounterElementEnabled,
  updateTerrainFamilyEncounterProfile, validateWorldBuilderDraft,
  serializeWorldBuilderDraft, importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';
import {readFile} from 'node:fs/promises';

const pool = createCaptureCreatureCatalogProvider({
  schema:'capture-database-v1',version:1,creatures:[
    {draft:{id:'common-fire',displayName:'A commun feu',elements:['fire'],capture:{spawnChance:30}}},
    {draft:{id:'both',displayName:'B feu eau',elements:['fire','water'],capture:{spawnChance:10}}},
    {draft:{id:'rare-water',displayName:'C rare eau',elements:['water'],capture:{spawnChance:1}}}
  ]
});
const config = (ids) => normalizeTerrainFamilyEncounterConfig({
  families:[{terrainFamilyId:'forest',encounterChancePercent:100,
    elementChances:ids.map((id,i)=>({elementId:id,chancePercent:i===0?80:20}))}]
});

test('selected elements filter one combined creature pool: no weighted element lottery',()=>{
  const roll=resolveTerrainFamilyEncounter({terrainFamilyId:'forest',config:config(['fire','water']),
    captureCatalog:pool,random:((a)=>()=>a.shift())([0,0.975])});
  assert.equal(roll.triggered,true);
  assert.equal(roll.creatureId,'rare-water'); // total rarity weight 41; 0.975 selects last 1
  assert.equal(roll.spawnChance,1);
  assert.equal(roll.elementId,'water');
});

test('multielement creature is not counted twice when two matching elements selected',()=>{
  const roll=resolveTerrainFamilyEncounter({terrainFamilyId:'forest',config:config(['fire','water']),
    captureCatalog:pool,random:((a)=>()=>a.shift())([0,0.80])});
  // total rarity 41; at 0.80 the duplicated both would change the winner.
  assert.equal(roll.creatureId,'both');
});

test('checkbox setter keeps exactly the selected ids and no sum-to-100 validation',()=>{
  let world=createBlankWorldBuilderDraft({terrainFamilyId:'forest',materialId:'grass.forest'});
  world=updateTerrainFamilyEncounterProfile(world,'forest',{encounterChancePercent:100});
  assert.equal(validateWorldBuilderDraft(world).valid,false);
  world=setTerrainFamilyEncounterElementEnabled(world,'forest','fire',true);
  assert.equal(validateWorldBuilderDraft(world).valid,true);
  world=setTerrainFamilyEncounterElementEnabled(world,'forest','water',true);
  assert.equal(validateWorldBuilderDraft(world).valid,true);
  const profile=world.encounterConfig.families.find(p=>p.terrainFamilyId==='forest');
  assert.deepEqual(profile.elementChances.map(x=>x.elementId),['fire','water']);
  const copy=importWorldBuilderDocument(serializeWorldBuilderDraft(world));
  assert.deepEqual(copy.encounterConfig.families.find(p=>p.terrainFamilyId==='forest').elementChances,profile.elementChances);
  world=setTerrainFamilyEncounterElementEnabled(world,'forest','fire',false);
  assert.deepEqual(world.encounterConfig.families.find(p=>p.terrainFamilyId==='forest').elementChances.map(x=>x.elementId),['water']);
});

test('Builder has element checkboxes but no element percentage editing controls or exclusive button',async()=>{
  const html=await readFile(new URL('../builder.html',import.meta.url),'utf8');
  const js=await readFile(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
  assert.match(html,/Choisir les éléments possibles/);
  assert.doesNotMatch(html,/id="family-encounter-sole-apply"|id="family-encounter-total"/);
  assert.match(js,/input.type = 'checkbox'/);
  assert.match(js,/setTerrainFamilyEncounterElementEnabled/);
  assert.doesNotMatch(js,/\$\('family-encounter-sole-apply'\)/);
});
