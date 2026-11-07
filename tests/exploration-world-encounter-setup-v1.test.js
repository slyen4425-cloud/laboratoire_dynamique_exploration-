import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createBlankWorldBuilderDraft,createWorldBuilderDraft,initializeWorldPresetEncounters,
 serializeWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import {encounterConfigNeedsExplicitInitialization}
 from '../src/builder/preset-encounter-defaults.js';

test('blank official WorldDocument is playable but has no random encounter chance until author opt-in',()=>{
 const blank=createBlankWorldBuilderDraft({id:'carte-vierge',width:36*28,height:24*21});
 assert.equal(blank.areas[0].encounters.randomEnabled,true);
 assert.equal(encounterConfigNeedsExplicitInitialization(blank.encounterConfig),true);
 const old=serializeWorldBuilderDraft(blank);
 const configured=initializeWorldPresetEncounters(blank);
 assert.ok(configured.encounterConfig.families.some(p=>
  p.encounterChancePercent>0&&p.elementChances?.some(e=>e.chancePercent>0)),
  'official default preset must actually contain a playable chance and elements');
 assert.equal(encounterConfigNeedsExplicitInitialization(configured.encounterConfig),false);
 assert.equal(serializeWorldBuilderDraft(blank),old,'opt-in must never mutate original unsaved world');
});
test('an already authored encounter profile remains authoritative and is never changed by initialization',()=>{
 const blank=createBlankWorldBuilderDraft({id:'author-world',width:36*28,height:24*21});
 const populated=initializeWorldPresetEncounters(blank);
 const profile=populated.encounterConfig.families.find(x=>x.encounterChancePercent>0);
 const changed=createWorldBuilderDraft({...populated,encounterConfig:{
  ...populated.encounterConfig,families:populated.encounterConfig.families.map(p=>
   p.terrainFamilyId===profile.terrainFamilyId?{
    ...p,encounterChancePercent:7
   }:p)
 }});
 const unchanged=serializeWorldBuilderDraft(changed);
 const again=initializeWorldPresetEncounters(changed);
 assert.equal(serializeWorldBuilderDraft(again),unchanged);
 assert.equal(again.encounterConfig.families.find(p=>p.terrainFamilyId===profile.terrainFamilyId).encounterChancePercent,7);
});
test('World Builder offers explicit encounter setup and visible 0% warning without changing play navigation',()=>{
 const ui=readFileSync(new URL('../src/builder/world-assembler-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../world-assembler.html',import.meta.url),'utf8');
 assert.match(html,/id="world-encounters-initialize"/);
 assert.match(html,/id="world-encounters-status"/);
 assert.match(ui,/encounterConfigNeedsExplicitInitialization/);
 assert.match(ui,/initializeWorldPresetEncounters/);
 assert.match(ui,/window\.confirm\(/);
 const begin=ui.indexOf("on(byId('world-encounters-initialize'),'click'");
 const end=ui.indexOf("on(byId('world-library-save'),'click'",begin);
 assert.ok(begin>0&&end>begin);
 const body=ui.slice(begin,end);
 assert.doesNotMatch(body,/z40k|Math\.random|spawnChance|localStorage\.setItem\(/);
});
