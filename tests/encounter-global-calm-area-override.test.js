import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldDocument} from '../src/world/world-document-model.js';
import {createEncounterController} from '../src/encounters/encounter-controller.js';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft,
  applyCalmEncounterBaseline,updateWorldEncounterCheckDistance,
  setAreaEncounterOverrides} from '../src/builder/world-builder-draft.js';

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const family=(world,id)=>world.encounterConfig.families.find(x=>x.terrainFamilyId===id);
const catalog={listCreatures:()=>[{id:'creature-test',spawnChance:1,elements:['nature']}]};
const player=(area,x)=>({currentAreaId:area.id,x,y:120});

function intent(controller,world,area,x){
 return controller.step({area,player:player(area,x),
  encounterConfig:world.encounterConfig,captureCatalog:catalog,
  playerPartyRef:'party',rulesetId:'combat',random:()=>0});
}

test('new and historical worlds retain their authored probabilities until the global Calm command',()=>{
 const world=createBlankWorldBuilderDraft();
 assert.equal(world.encounterConfig.checkDistance,160);
 assert.equal(family(world,'forest').encounterChancePercent,0);
 assert.equal(family(world,'road').encounterChancePercent,0);
 const calm=applyCalmEncounterBaseline(world);
 assert.equal(calm.encounterConfig.checkDistance,300);
 assert.equal(family(calm,'forest').encounterChancePercent,6);
 assert.equal(family(calm,'road').encounterChancePercent,0);
 assert.ok(family(calm,'forest').elementChances.length>0,'calm must configure eligible elements once for the whole world');
 assert.equal(world.areas[0].encounters.chancePercentOverride,undefined);
 assert.equal(world.areas[0].encounters.checkDistanceOverride,undefined);
});

test('calm preset is an explicit global command and keeps family elements and rarity',()=>{
 const before=createBlankWorldBuilderDraft();
 const tuned=createWorldBuilderDraft({...before,encounterConfig:{
  ...before.encounterConfig,checkDistance:110,
  families:before.encounterConfig.families.map(f=>({...f,encounterChancePercent:74}))
 }});
 const calm=applyCalmEncounterBaseline(tuned);
 assert.equal(calm.encounterConfig.checkDistance,300);
 assert.equal(family(calm,'forest').encounterChancePercent,6);
 assert.equal(family(calm,'road').encounterChancePercent,0);
 assert.deepEqual(family(calm,'forest').elementChances,family(tuned,'forest').elementChances);
 assert.equal(family(tuned,'forest').encounterChancePercent,74);
 assert.equal(updateWorldEncounterCheckDistance(calm,520).encounterConfig.checkDistance,520);
});

test('per-zone opt-in override and reset inherit one shared world config through JSON',()=>{
 const initial=createBlankWorldBuilderDraft();
 const w={...initial,areas:[initial.areas[0],{
   ...initial.areas[0],id:'two',label:'Two'}]};
 const first=setAreaEncounterOverrides(w,'two',{
  checkDistanceOverride:80,chancePercentOverride:100
 });
 const normalized=normalizeWorldDocument(first);
 assert.equal(normalized.areas[0].encounters.checkDistanceOverride,undefined);
 assert.equal(normalized.areas[1].encounters.checkDistanceOverride,80);
 assert.equal(normalized.areas[1].encounters.chancePercentOverride,100);
 assert.equal(normalized.areas[1].encounters.randomEnabled,true);
 const second=setAreaEncounterOverrides(normalized,'two',{
  checkDistanceOverride:null,chancePercentOverride:null
 });
 assert.equal(second.areas[1].encounters.checkDistanceOverride,undefined);
 assert.equal(second.areas[1].encounters.chancePercentOverride,undefined);
 assert.equal(JSON.parse(JSON.stringify(normalizeWorldDocument(second))).areas[1].encounters.randomEnabled,true);
});

test('controller uses world cadence and a zone-specific override without second timer',()=>{
 const world=applyCalmEncounterBaseline(createBlankWorldBuilderDraft());
 world.encounterConfig.families.find(f=>f.terrainFamilyId==='plain').elementChances=[{
  elementId:'nature',chancePercent:100
 }];
 const area=world.areas[0];
 const regular=createEncounterController();
 assert.equal(intent(regular,world,area,0),null);
 assert.equal(intent(regular,world,area,150),null);
 assert.ok(intent(regular,world,area,305));
 const tuned=setAreaEncounterOverrides(world,area.id,{
  checkDistanceOverride:80,chancePercentOverride:0});
 const quiet=createEncounterController();
 assert.equal(intent(quiet,tuned,tuned.areas[0],0),null);
 assert.equal(intent(quiet,tuned,tuned.areas[0],90),null);
 const loud=setAreaEncounterOverrides(tuned,area.id,{chancePercentOverride:100});
 const active=createEncounterController();
 assert.equal(intent(active,loud,loud.areas[0],0),null);
 assert.ok(intent(active,loud,loud.areas[0],90));
});

test('existing customized documents are never silently replaced with calm',()=>{
 const source=createBlankWorldBuilderDraft();
 source.encounterConfig.families.find(f=>f.terrainFamilyId==='forest').encounterChancePercent=81;
 const old=createWorldBuilderDraft({...source,encounterConfig:{
  version:1,families:source.encounterConfig.families
 }});
 assert.equal(old.encounterConfig.checkDistance,160);
 assert.equal(family(old,'forest').encounterChancePercent,81);
 assert.equal(old.areas[0].encounters.chancePercentOverride,undefined);
});

test('real authoring interfaces expose global calm and explicit per-zone tuning',()=>{
 const builder=src('builder.html'),sculpt=src('sculpt-lab.html');
 const code=src('src/sculpt-lab-main.js');
 for(const id of ['family-encounter-calm-baseline','family-encounter-distance',
     'area-encounter-override-enabled','area-encounter-override-chance',
     'area-encounter-override-distance'])
  assert.match(builder,new RegExp('id="'+id+'"'));
 for(const id of ['sculpt-encounter-calm-baseline','sculpt-encounter-distance',
     'sculpt-encounter-override-enabled','sculpt-encounter-override-chance',
     'sculpt-encounter-override-distance'])
  assert.match(sculpt,new RegExp('id="'+id+'"'));
 assert.match(code,/setAreaEncounterOverrides/);
});
