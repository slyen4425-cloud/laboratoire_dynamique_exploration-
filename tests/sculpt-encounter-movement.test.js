import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSculptEncounterAfterMovement} from '../src/encounters/sculpt-encounter-movement-adapter.js';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';
import {normalizeWorldSurface} from '../src/world/surface-model.js';

const config=normalizeTerrainFamilyEncounterConfig({families:[{
 terrainFamilyId:'forest',encounterChancePercent:100,
 elementChances:[{elementId:'nature',chancePercent:1}]
}]});
const captureCatalog={listCreatures:()=>[{id:'test-creature',name:'Test',elements:['nature'],spawnChance:10}]};
const surface=normalizeWorldSurface({baseTerrainFamilyId:'forest'});
const args={surface,position:{x:10,y:10},config,captureCatalog,random:()=>0};
test('stationary actor cannot trigger encounter',()=>{
 assert.equal(evaluateSculptEncounterAfterMovement({...args,distanceMoved:0}).triggered,false);
});
test('moving actor uses canonical family odds and Capture rarity',()=>{
 const result=evaluateSculptEncounterAfterMovement({...args,distanceMoved:5});
 assert.equal(result.triggered,true);
 assert.equal(result.creatureId,'test-creature');
 assert.equal(result.terrainFamilyId,'forest');
});
