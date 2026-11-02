import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {createBlankWorldBuilderDraft,createNewWorldBuilderDraft,updateAreaEncounterLocalRules,serializeWorldBuilderDraft,importWorldBuilderDocument,
  updateTerrainFamilyEncounterProfile,setTerrainFamilyExclusiveEncounterElement}
  from '../src/builder/world-builder-draft.js';
import {resolveTerrainFamilyEncounter} from '../src/encounters/terrain-family-encounter-resolver.js';
import {createEncounterController} from '../src/encounters/encounter-controller.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {CAPTURE_CREATURE_CATALOG_PREVIEW_V1} from '../src/capture/capture-creature-catalog-preview-v1.js';
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


test('physical encounter controller respects local distance and 0%-override, with inherited world unchanged',()=>{
 const initial=createBlankWorldBuilderDraft({id:'local-policy-test',terrainFamilyId:'forest',materialId:'grass.forest'});
 const world=setTerrainFamilyExclusiveEncounterElement(
   updateTerrainFamilyEncounterProfile(initial,'forest',{encounterChancePercent:100}),'forest','earth');
 const id=world.areas[0].id;
 const catalog=createCaptureCreatureCatalogProvider(CAPTURE_CREATURE_CATALOG_PREVIEW_V1);
 const stepWorld=(document)=>{
   const controller=createEncounterController({checkDistance:160});
   const area=document.areas[0];
   const input=(x)=>({
     area,player:{currentAreaId:id,x,y:800},
     encounterConfig:document.encounterConfig,
     checkDistance:document.encounterConfig.checkDistance,
     captureCatalog:catalog,random:()=>0,
     playerPartyRef:'capture-party-player-v1',rulesetId:'capture.standard.1v1'
   });
   controller.step(input(1200));
   return controller.step(input(1380));
 };
 assert.equal(stepWorld(world),null,'180 units remains below inherited 300');
 const muted=updateAreaEncounterLocalRules(world,id,{checkDistance:80,chanceMultiplierPercent:0});
 assert.equal(stepWorld(muted),null,'local zero frequency suppresses even certain global chance');
 const active=updateAreaEncounterLocalRules(muted,id,{chanceMultiplierPercent:100});
 assert.ok(stepWorld(active)?.opponentCreatureId,'local 80-unit rule must trigger real Capture intent');
 assert.equal(world.areas[0].encounters.checkDistance,undefined,'world stays unchanged');
 assert.equal(world.encounterConfig.checkDistance,300);
});


test('user-created worlds receive calm global defaults while deliberate blank fixtures and old saves remain unchanged',()=>{
 const fresh=createNewWorldBuilderDraft({id:'calm-default'});
 const forest=fresh.encounterConfig.families.find(p=>p.terrainFamilyId==='forest');
 const road=fresh.encounterConfig.families.find(p=>p.terrainFamilyId==='road');
 assert.equal(fresh.encounterConfig.checkDistance,300);
 assert.equal(forest.encounterChancePercent,6);
 assert.equal(road.encounterChancePercent,0);
 assert.equal(fresh.areas[0].encounters.checkDistance,undefined);
 assert.equal(fresh.areas[0].encounters.chanceMultiplierPercent,undefined);
 const blank=createBlankWorldBuilderDraft({id:'explicit-blank'});
 assert.ok(blank.encounterConfig.families.every(p=>p.encounterChancePercent===0));
 assert.equal(importWorldBuilderDocument(serializeWorldBuilderDraft(blank)).encounterConfig.families[0].encounterChancePercent,0);
 assert.match(read('src/builder/world-assembler-main.js'),/createNewWorldBuilderDraft/);
 assert.match(read('src/builder/world-builder-main.js'),/draft = createNewWorldBuilderDraft\(\)/);
});
