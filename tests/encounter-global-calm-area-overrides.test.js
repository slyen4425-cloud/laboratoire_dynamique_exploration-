import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {createBlankWorldBuilderDraft,updateAreaEncounterLocalRules,serializeWorldBuilderDraft,importWorldBuilderDocument}
  from '../src/builder/world-builder-draft.js';
import {resolveTerrainFamilyEncounter} from '../src/encounters/terrain-family-encounter-resolver.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('areas inherit global calm settings by default; opt-in modifiers normalize and serialize without duplicate profiles',()=>{
 const area=normalizeWorldArea({id:'forest',kind:'exterior',width:1008,height:504});
 assert.deepEqual(area.encounters,{randomEnabled:true},'no local override unless user explicitly adds one');
 const local=normalizeWorldArea({...area,encounters:{randomEnabled:true,checkDistance:620,chanceMultiplierPercent:175}});
 assert.equal(local.encounters.checkDistance,620);
 assert.equal(local.encounters.chanceMultiplierPercent,175);
 assert.deepEqual(normalizeWorldArea({...area,encounters:{randomEnabled:true,checkDistance:null,chanceMultiplierPercent:null}}).encounters,{randomEnabled:true});
});

test('area authoring affects only selected WorldArea, reset returns to global and export/import keeps same WorldDocument',()=>{
 const draft=createBlankWorldBuilderDraft({id:'calm-area',width:1008,height:504});
 const id=draft.areas[0].id;
 const before=JSON.stringify(draft.encounterConfig);
 const modified=updateAreaEncounterLocalRules(draft,id,{checkDistance:850,chanceMultiplierPercent:200});
 assert.equal(modified.areas[0].encounters.checkDistance,850);
 assert.equal(modified.areas[0].encounters.chanceMultiplierPercent,200);
 assert.equal(JSON.stringify(modified.encounterConfig),before);
 const imported=importWorldBuilderDocument(serializeWorldBuilderDraft(modified));
 assert.equal(imported.areas[0].encounters.checkDistance,850);
 assert.equal(imported.areas[0].encounters.chanceMultiplierPercent,200);
 const inherited=updateAreaEncounterLocalRules(modified,id,{checkDistance:null,chanceMultiplierPercent:null});
 assert.deepEqual(inherited.areas[0].encounters,{randomEnabled:true});
});

test('one encounter lottery accepts optional per-area chance multiplier, preserving global element and rarity owners',()=>{
 const catalog={listCreatures:()=>[{id:'nature-1',elements:['nature'],spawnChance:100}]};
 const config={families:[{terrainFamilyId:'forest',encounterChancePercent:10,elementChances:[{elementId:'nature',chancePercent:100}]}]};
 const base={terrainFamilyId:'forest',config,captureCatalog:catalog};
 assert.equal(resolveTerrainFamilyEncounter({...base,random:()=>0.15}).triggered,false);
 assert.equal(resolveTerrainFamilyEncounter({...base,chanceMultiplierPercent:200,random:()=>0.15}).triggered,true);
 assert.equal(resolveTerrainFamilyEncounter({...base,chanceMultiplierPercent:0,random:()=>0}).triggered,false);
 assert.equal(config.families[0].encounterChancePercent,10,'do not mutate global family');
});

test('Builder and Sculpt expose editable local controls and encounter runtime uses area-owned override',()=>{
 for(const html of ['builder.html','sculpt-lab.html']){
   const s=read(html);
   assert.match(s,/id="(?:family|sculpt)-encounter-area-chance-multiplier"/);
   assert.match(s,/id="(?:family|sculpt)-encounter-area-distance"/);
   assert.match(s,/id="(?:family|sculpt)-encounter-area-inherit"/);
 }
 const controller=read('src/encounters/encounter-controller.js');
 assert.match(controller,/area\.encounters\?\.checkDistance/);
 assert.match(controller,/chanceMultiplierPercent:\s*area\.encounters\?\.chanceMultiplierPercent/);
});
