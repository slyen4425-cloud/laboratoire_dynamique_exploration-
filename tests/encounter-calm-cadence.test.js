import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument,
 updateWorldEncounterCheckDistance,applyCalmEncounterBaseline} from '../src/builder/world-builder-draft.js';
import {createEncounterController} from '../src/encounters/encounter-controller.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {createSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {serializeSculptPreviewScene,importSculptPreviewScene,createBlankSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {demoWorldDocument} from '../src/world/demo-world.js';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('default canonical encounter cadence is 300 world units and has validated bounds',()=>{
 assert.equal(normalizeTerrainFamilyEncounterConfig().checkDistance,300);
 assert.equal(normalizeTerrainFamilyEncounterConfig({checkDistance:560}).checkDistance,560);
 assert.equal(normalizeTerrainFamilyEncounterConfig({checkDistance:-100}).checkDistance,80);
 assert.equal(normalizeTerrainFamilyEncounterConfig({checkDistance:999999}).checkDistance,2000);
});
test('calmer baseline preserves selected creature elements, rarity and Area policy',()=>{
 const draft=createBlankWorldBuilderDraft();
 const first=updateWorldEncounterCheckDistance(draft,700);
 assert.equal(first.encounterConfig.checkDistance,700);
 assert.equal(draft.encounterConfig.checkDistance,300,'authoring command is immutable');
 const selected={...first,encounterConfig:{...first.encounterConfig,
   families:first.encounterConfig.families.map(p=>p.terrainFamilyId==='forest'?
      {...p,encounterChancePercent:77,elementChances:[{elementId:'nature',chancePercent:100}]}:p)}};
 const calm=applyCalmEncounterBaseline(selected);
 const forest=calm.encounterConfig.families.find(p=>p.terrainFamilyId==='forest');
 assert.equal(forest.encounterChancePercent,6);
 assert.deepEqual(forest.elementChances,[{elementId:'nature',chancePercent:100}]);
 assert.equal(calm.encounterConfig.families.find(p=>p.terrainFamilyId==='road').encounterChancePercent,0);
 assert.equal(calm.encounterConfig.checkDistance,300);
 assert.deepEqual(calm.areas,selected.areas);
 assert.equal(selected.encounterConfig.checkDistance,700);
 const imported=importWorldBuilderDocument(serializeWorldBuilderDraft(calm));
 assert.equal(imported.encounterConfig.checkDistance,300);
 assert.deepEqual(imported.encounterConfig.families,calm.encounterConfig.families);
});
test('calm new-world samples reduce combat while retaining original element probabilities',()=>{
 const byId=id=>demoWorldDocument.encounterConfig.families.find(p=>p.terrainFamilyId===id);
 assert.equal(byId('forest').encounterChancePercent,6);
 assert.equal(byId('plain').encounterChancePercent,5);
 assert.equal(byId('snow').encounterChancePercent,6);
 assert.equal(byId('road').encounterChancePercent,0);
 assert.equal(demoWorldDocument.encounterConfig.checkDistance,300);
 assert.equal(byId('forest').elementChances.reduce((n,e)=>n+e.chancePercent,0),100);
});
test('canonical controller supports a runtime distance from the same config without timers',()=>{
 const controller=createEncounterController({checkDistance:160});
 const config=normalizeTerrainFamilyEncounterConfig({checkDistance:400,families:[
   {terrainFamilyId:'forest',encounterChancePercent:100,
    elementChances:[{elementId:'nature',chancePercent:100}]}]});
 const catalog=createCaptureCreatureCatalogProvider({schema:'capture-database-v1',
   creatures:[{draft:{id:'a',displayName:'A',elements:['nature'],capture:{spawnChance:100}}}]});
 const area={id:'f',surface:createSculptSurface({baseTerrainFamilyId:'forest'})};
 const step=(x)=>controller.step({area,player:{currentAreaId:'f',x,y:30},
   encounterConfig:config,checkDistance:config.checkDistance,
   captureCatalog:catalog,random:()=>0,playerPartyRef:'party',rulesetId:'capture.standard.1v1'});
 assert.equal(step(100),null);
 assert.equal(step(430),null,'old hardcoded 160 must not trigger');
 assert.equal(step(500)?.source,'terrain-random');
});
test('the identical distance survives a full Sculpt scene export/import',()=>{
 const scene=createBlankSculptPreviewScene({width:25,height:20});
 const config=normalizeTerrainFamilyEncounterConfig({checkDistance:620});
 const saved=serializeSculptPreviewScene(scene.terrain,[],scene.surface,[],{
   encounterConfig:config,exteriorEncounters:{randomEnabled:true}});
 const restored=importSculptPreviewScene(saved);
 assert.equal(restored.encounterConfig.checkDistance,620);
});
test('both authoring UIs expose real frequency control and deliberate calm preset',()=>{
 for(const file of ['builder.html','sculpt-lab.html']){
  const html=source(file);
  assert.match(html,/id="(?:family|sculpt)-encounter-distance"/);
  assert.match(html,/id="(?:family|sculpt)-encounter-calm-baseline"/);
 }
 assert.match(source('src/main.js'),/checkDistance: encounterTest \? 80 : undefined/);
 assert.match(source('src/sculpt-lab-main.js'),/checkDistance:sculptEncounterTest\?80:undefined/);
});
