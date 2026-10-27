import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {createSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {sculptPreviewEncounterConfig,createSculptEncounterArea} from '../src/encounters/sculpt-encounter-area-adapter.js';
import {terrainFamilyRegistry} from '../src/world/terrain-family-registry.js';
import {updateTerrainFamilyEncounterProfile,setTerrainFamilyEncounterElementEnabled,
  setAreaEncounterRandomEnabled} from '../src/builder/world-builder-draft.js';
import {createEncounterController} from '../src/encounters/encounter-controller.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';

const terrain=()=>createSculptTerrain({width:36,height:24});
const surface=()=>createSculptSurface();
const catalog=createCaptureCreatureCatalogProvider({schema:'capture-database-v1',creatures:[
 {draft:{id:'wild-fire',displayName:'Fire',elements:['fire'],capture:{spawnChance:20}}},
 {draft:{id:'wild-nature',displayName:'Nature',elements:['nature'],capture:{spawnChance:20}}}
]});
function editedConfig(){
 const draft={terrainFamilies:terrainFamilyRegistry.list(),encounterConfig:sculptPreviewEncounterConfig};
 let changed=updateTerrainFamilyEncounterProfile(draft,'forest',{encounterChancePercent:100});
 changed=setTerrainFamilyEncounterElementEnabled(changed,'forest','nature',false);
 changed=setTerrainFamilyEncounterElementEnabled(changed,'forest','fire',true);
 return normalizeTerrainFamilyEncounterConfig(changed.encounterConfig);
}
function result(area,config){
 const controller=createEncounterController({checkDistance:50});
 const args={area,encounterConfig:config,captureCatalog:catalog,
   playerPartyRef:'party',rulesetId:'capture.standard.1v1',random:()=>0};
 controller.step({...args,player:{currentAreaId:area.id,x:10,y:50}});
 return controller.step({...args,player:{currentAreaId:area.id,x:120,y:50}});
}

test('old Builder controls update one canonical encounterConfig, saved and imported without rareté rewriting',()=>{
 const edited=editedConfig();
 const text=serializeSculptPreviewScene(terrain(),[],surface(),[],{
   encounterConfig:edited,exteriorEncounters:{randomEnabled:true}
 });
 const saved=JSON.parse(text);
 assert.equal(saved.encounterConfig.version,1);
 assert.equal(saved.encounterConfig.families.find(x=>x.terrainFamilyId==='forest').encounterChancePercent,100);
 assert.equal(saved.exteriorEncounters.randomEnabled,true);
 const imported=importSculptPreviewScene(text);
 assert.deepEqual(imported.encounterConfig,edited);
 assert.equal(imported.exteriorEncounters.randomEnabled,true);
 const area=createSculptEncounterArea({areaId:'sculpt-exterior',surface:imported.surface,
   width:1000,height:500,exteriorEncounters:imported.exteriorEncounters});
 assert.equal(result(area,imported.encounterConfig)?.opponentCreatureId,'wild-fire');
});

test('disable encounters for exterior Area via SAME World Builder command, persisted and respected by real controller',()=>{
 const area={id:'sculpt-exterior',encounters:{randomEnabled:true}};
 const updated=setAreaEncounterRandomEnabled({areas:[area]},area.id,false);
 const json=serializeSculptPreviewScene(terrain(),[],surface(),[],{
   encounterConfig:editedConfig(),exteriorEncounters:updated.areas[0].encounters
 });
 const imported=importSculptPreviewScene(json);
 const projected=createSculptEncounterArea({areaId:'sculpt-exterior',surface:imported.surface,
   width:1000,height:500,exteriorEncounters:imported.exteriorEncounters});
 assert.equal(imported.exteriorEncounters.randomEnabled,false);
 assert.equal(result(projected,imported.encounterConfig),null);
});

test('older 2.5D scenes and height exports import without inventing encounter settings',()=>{
 const old=importSculptPreviewScene(serializeSculptPreviewScene(terrain(),[],surface(),[]));
 assert.equal(old.encounterConfig,null);
 assert.equal(old.exteriorEncounters.randomEnabled,true);
});

test('malformed explicit encounter config and area flags reject import atomically',()=>{
 const original=JSON.parse(serializeSculptPreviewScene(terrain(),[],surface(),[]));
 for(const payload of [
   {...original,encounterConfig:{version:1,families:'not-an-array'}},
   {...original,encounterConfig:{version:1,families:[{terrainFamilyId:'forest',encounterChancePercent:101,elementChances:[]}]}},
   {...original,exteriorEncounters:{randomEnabled:'false'}},
 ])assert.throws(()=>importSculptPreviewScene(payload),/rencontre|encounter/i);
});

test('world authored scene keeps texture independent of family encounter profiles',()=>{
 const painted={...surface(),baseMaterialId:'ground.snow',baseTerrainFamilyId:'forest'};
 const imported=importSculptPreviewScene(serializeSculptPreviewScene(terrain(),[],painted,[],{
   encounterConfig:editedConfig(),exteriorEncounters:{randomEnabled:true}
 }));
 const area=createSculptEncounterArea({areaId:'sculpt-exterior',surface:imported.surface,
   width:1000,height:500,exteriorEncounters:imported.exteriorEncounters});
 assert.equal(result(area,imported.encounterConfig)?.opponentCreatureId,'wild-fire');
});
