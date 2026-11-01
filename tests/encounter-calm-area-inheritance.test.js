import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument,
  setAreaEncounterIntensity,setAreaEncounterCheckDistance,clearAreaEncounterOverrides}
  from '../src/builder/world-builder-draft.js';
import {resolveTerrainFamilyEncounter} from '../src/encounters/terrain-family-encounter-resolver.js';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';

const area=(id='forest-zone')=>normalizeWorldArea({id,kind:'exterior',width:1008,height:504,
  surface:{baseTerrainFamilyId:'forest'}});
const config=normalizeTerrainFamilyEncounterConfig({checkDistance:300,families:[
  {terrainFamilyId:'forest',encounterChancePercent:6,
   elementChances:[{elementId:'nature',chancePercent:100}]},
  {terrainFamilyId:'road',encounterChancePercent:0,
   elementChances:[{elementId:'nature',chancePercent:100}]}
]});
const catalog={listCreatures:()=>[{id:'test-plant',elements:['nature'],spawnChance:1}]};
function triggered(terrainFamilyId,scale,random=()=>0.10){
 return resolveTerrainFamilyEncounter({terrainFamilyId,config,captureCatalog:catalog,random,
   chanceScalePercent:scale}).triggered;
}

test('unconfigured WorldAreas inherit one world calm config without any stored zone overrides',()=>{
 const base=area();
 assert.deepEqual(base.encounters,{randomEnabled:true});
 assert.equal(config.checkDistance,300);
 assert.equal(config.families.find(x=>x.terrainFamilyId==='forest').encounterChancePercent,6);
 assert.equal(triggered('forest',undefined),false);
 assert.equal(triggered('road',300),false,'zero-chance global road remains zero even in a dense zone');
});

test('opt-in WorldArea overrides are isolated, normalized and can explicitly revert to world inheritance',()=>{
 const first=createBlankWorldBuilderDraft();
 const areaId=first.areas[0].id;
 const second=setAreaEncounterIntensity(first,areaId,250);
 const third=setAreaEncounterCheckDistance(second,areaId,620);
 assert.equal(first.areas[0].encounters.intensityPercent,undefined,'original world must be immutable');
 assert.equal(third.areas[0].encounters.intensityPercent,250);
 assert.equal(third.areas[0].encounters.checkDistance,620);
 assert.equal(third.encounterConfig.checkDistance,300,'world default untouched');
 assert.ok(triggered('forest',250),'zone increases only its chance, not catalog authority');
 assert.ok(!triggered('forest',undefined),'another zone still inherits calm');
 const imported=importWorldBuilderDocument(serializeWorldBuilderDraft(third));
 assert.equal(imported.areas[0].encounters.intensityPercent,250);
 assert.equal(imported.areas[0].encounters.checkDistance,620);
 const reset=clearAreaEncounterOverrides(imported,areaId);
 assert.deepEqual(reset.areas[0].encounters,{randomEnabled:true});
 assert.equal(reset.encounterConfig.checkDistance,300);
 assert.equal(createWorldBuilderDraft(first).areas[0].encounters.intensityPercent,undefined);
});

test('override bounds and explicit disable do not invent encounter authority',()=>{
 const a=normalizeWorldArea({id:'a',encounters:{randomEnabled:false,intensityPercent:9999,checkDistance:-100}});
 assert.deepEqual(a.encounters,{randomEnabled:false,intensityPercent:300,checkDistance:80});
 assert.ok(!triggered('forest',0));
 assert.equal(triggered('road',300,()=>0),false);
});

test('Builder and native Sculpt provide opt-in zone controls and inheritance reset',()=>{
 const builder=readFileSync(new URL('../builder.html',import.meta.url),'utf8');
 const sculpt=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
 const sculptMain=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 for(const [html,js,prefix] of [[builder,main,'area'],[sculpt,sculptMain,'sculpt']]){
   assert.match(html,new RegExp('id="'+prefix+'-encounter-custom"'));
   assert.match(html,new RegExp('id="'+prefix+'-encounter-intensity"'));
   assert.match(html,new RegExp('id="'+prefix+'-encounter-local-distance"'));
   assert.match(js,/clearAreaEncounterOverrides/);
   assert.match(js,/setAreaEncounterIntensity/);
   assert.match(js,/setAreaEncounterCheckDistance/);
 }
});
