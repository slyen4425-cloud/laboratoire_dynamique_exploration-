import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';
import {resolveTerrainFamilyEncounter,GLOBAL_CREATURE_RARITY_WEIGHTS_V1}
 from '../src/encounters/terrain-family-encounter-resolver.js';

const catalog=createCaptureCreatureCatalogProvider({schema:'capture-database-v1',version:1,
 creatures:[
 {draft:{id:'r1',displayName:'Rare 1',elements:['fire'],capture:{rarity:'rare',spawnChance:0}}},
 {draft:{id:'r2',displayName:'Rare 2',elements:['water'],capture:{rarity:'rare',spawnChance:100}}},
 {draft:{id:'m1',displayName:'Mythique',elements:['fire'],capture:{rarity:'mythic',spawnChance:0.5}}},
 {draft:{id:'l1',displayName:'Légendaire',elements:['water'],capture:{rarity:'legendary',spawnChance:99}}}
 ]});
const config=normalizeTerrainFamilyEncounterConfig({families:[{
 terrainFamilyId:'forest',encounterChancePercent:20,
 elementChances:[{elementId:'fire',chancePercent:1},{elementId:'water',chancePercent:1}]
}]});
function roll(encounter,rank){
 let values=[encounter,rank];return resolveTerrainFamilyEncounter({
 terrainFamilyId:'forest',config,captureCatalog:catalog,
 random:()=>values.shift()??0
 });
}
test('one global 50/20/10 policy applies after 20 percent grass encounter check',()=>{
 assert.deepEqual(GLOBAL_CREATURE_RARITY_WEIGHTS_V1,{rare:50,mythic:20,legendary:10});
 assert.equal(roll(.21,.02).triggered,false);
 assert.equal(roll(.19,.01).rarity,'rare');
 assert.equal(roll(.19,.70).rarity,'mythic');
 assert.equal(roll(.19,.96).rarity,'legendary');
});
test('per-species old 0%, 0.5%, 99%, 100% never weight rank or species',()=>{
 assert.equal(roll(0,0).creatureId,'r1');
 assert.equal(roll(0,.6).creatureId,'r2');
 assert.equal(roll(0,.625).creatureId,'m1');
});
test('absent ranks do not turn a successful encounter into an empty roll',()=>{
 const rareOnly=createCaptureCreatureCatalogProvider({schema:'capture-database-v1',version:1,
  creatures:[{draft:{id:'r',displayName:'Rare',elements:['fire'],capture:{rarity:'rare',spawnChance:0}}}]});
 const hit=resolveTerrainFamilyEncounter({terrainFamilyId:'forest',config,
  captureCatalog:rareOnly,random:(()=>{let x=[.1,.99];return ()=>x.shift()})()});
 assert.equal(hit.triggered,true);
 assert.equal(hit.creatureId,'r');
});
