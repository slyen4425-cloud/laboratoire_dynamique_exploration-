import test from 'node:test';
import assert from 'node:assert/strict';
import {editSculptEncounterChance,editSculptEncounterElement} from '../src/world/sculpt-encounter-authoring-adapter.js';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';

test('sculpt editor delegates encounter odds and selected elements to canonical Builder',()=>{
 const original=normalizeTerrainFamilyEncounterConfig();
 const withChance=editSculptEncounterChance(original,'forest',35);
 const configured=editSculptEncounterElement(withChance,'forest','nature',true);
 const forest=configured.families.find(f=>f.terrainFamilyId==='forest');
 assert.equal(forest.encounterChancePercent,35);
 assert.deepEqual(forest.elementChances,[{elementId:'nature',chancePercent:1}]);
 assert.equal(original.families.find(f=>f.terrainFamilyId==='forest').encounterChancePercent,0);
 assert.equal(configured.families.find(f=>f.terrainFamilyId==='road').encounterChancePercent,0);
 assert.deepEqual(editSculptEncounterElement(configured,'forest','nature',false).families.find(f=>f.terrainFamilyId==='forest').elementChances,[]);
});
