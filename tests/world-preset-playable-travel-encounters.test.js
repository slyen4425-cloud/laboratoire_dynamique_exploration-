import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {makePlayableZoneRoute} from '../src/builder/sculpt-playable-zone-route.js';
import {createEncounterController} from '../src/encounters/encounter-controller.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {CAPTURE_CREATURE_CATALOG_PREVIEW_V1} from '../src/capture/capture-creature-catalog-preview-v1.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';

const presets=builtinSculptMapPresets();
const catalog=createCaptureCreatureCatalogProvider(CAPTURE_CREATURE_CATALOG_PREVIEW_V1);
const playable=p=>p.kind==='exterior'&&p.width<=80*28&&p.height<=64*21;

test('new World Builder worlds give native prefab terrain a nonzero configured Capture encounter profile',()=>{
 const d=createBlankWorldBuilderDraft({id:'fresh',width:2400,height:1600});
 for(const preset of [presets[0],presets[3],presets[5],presets[7]]){
  const area=createWorldAreaFromSculptMapPreset(d,preset,{name:preset.name}).areas[1];
  const family=area.surface.baseTerrainFamilyId;
  const rule=d.encounterConfig.families.find(f=>f.terrainFamilyId===family);
  assert.ok(rule?.encounterChancePercent>0,'Missing actual encounter chance: '+family);
  const controller=createEncounterController({checkDistance:160});
  const y=area.surface.routes[0].points[0].y;
  const player=x=>({currentAreaId:area.id,x,y});
  controller.step({area,player:player(76),encounterConfig:d.encounterConfig,captureCatalog:catalog,random:()=>0});
  const intent=controller.step({area,player:player(270),encounterConfig:d.encounterConfig,captureCatalog:catalog,random:()=>0});
  assert.ok(intent?.opponents?.length,'No real Capture intent despite walking: '+family);
 }
});

test('explicit World Builder repair restores BOTH broken legacy links and both direction routes at native road exits',()=>{
 const original=createBlankWorldBuilderDraft({id:'legacy',width:2400,height:1600});
 const first=createWorldAreaFromSculptMapPreset(original,presets[0],{name:'Foret',hostAreaId:original.initialAreaId});
 const second=createWorldAreaFromSculptMapPreset(first,presets[3],{name:'Neige',hostAreaId:original.initialAreaId});
 const source=second.areas.find(a=>a.label==='Foret'),target=second.areas.find(a=>a.label==='Neige');
 const blocked=second.portals.filter(p=>[source.id,target.id].includes(p.sourceAreaId)&&p.targetAreaId===original.initialAreaId);
 assert.equal(blocked.length,2);
 const fixed=makePlayableZoneRoute(second,{selectedAreaId:source.id}).document;
 assert.equal(fixed.areas[0].width,2400);
 for(const old of blocked){
  const portal=fixed.portals.find(p=>p.id===old.id);
  assert.ok(playable(fixed.areas.find(a=>a.id===portal.targetAreaId)),'Historical destination remains unplayable');
  assert.deepEqual(portal.trigger,old.trigger,'Do not move previously authored portal');
 }
 for(const [from,to] of [[source,target],[target,source]]){
  const portal=fixed.portals.find(p=>p.sourceAreaId===from.id&&p.targetAreaId===to.id);
  assert.ok(portal,'Missing real reciprocal Portal');
  const roadEnd=from.surface.routes[0].points.at(-1);
  assert.equal(portal.trigger.x,from.width-64,'Prefab exit must be near east map edge');
  assert.ok(Math.abs(portal.trigger.y-roadEnd.y)<1,'Prefab exit does not follow its actual road');
  const hit=findTriggeredPortal(fixed,from.id,{x:portal.trigger.x,y:portal.trigger.y});
  assert.ok(hit);
  const result=applyPortalTransition(fixed,{currentAreaId:from.id,x:portal.trigger.x,y:portal.trigger.y},hit);
  assert.ok(result&&result.currentAreaId!==original.initialAreaId);
 }
});

test('an old blank encounter document can be explicitly equipped, while saved custom encounter values remain unchanged',()=>{
 const initial=createBlankWorldBuilderDraft({id:'legacy'});
 const empty=createWorldBuilderDraft({...initial,encounterConfig:{
   version:1,families:initial.encounterConfig.families.map(f=>({...f,encounterChancePercent:0,elementChances:[]}))
 }});
 const untouched=makePlayableZoneRoute(empty,{selectedAreaId:empty.initialAreaId}).document;
 assert.equal(untouched.encounterConfig.families.filter(f=>f.encounterChancePercent>0).length,0);
 const enabled=makePlayableZoneRoute(empty,{selectedAreaId:empty.initialAreaId,initializeEncounters:true}).document;
 assert.ok(enabled.encounterConfig.families.some(f=>f.encounterChancePercent>0));
 const custom=createWorldBuilderDraft({...initial,encounterConfig:{
  version:1,families:initial.encounterConfig.families.map(f=>({...f,encounterChancePercent:f.terrainFamilyId==='forest'?37:0}))
 }});
 const retained=makePlayableZoneRoute(custom,{selectedAreaId:custom.initialAreaId,initializeEncounters:true}).document;
 assert.equal(retained.encounterConfig.families.find(f=>f.terrainFamilyId==='forest').encounterChancePercent,37);
 assert.equal(retained.encounterConfig.families.find(f=>f.terrainFamilyId==='snow').encounterChancePercent,0);
});
