import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createSculptSurface,appendSculptSurfaceStroke,sculptEncounterFamilyForMaterial,
  alignSculptSurfaceEncounterFamilies
} from '../src/world/sculpt-surface-paint.js';
import {createEncounterController} from '../src/encounters/encounter-controller.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';

const points=[{x:0,y:80},{x:220,y:80}];
function stroke(surface,materialId,extra={}){
  return appendSculptSurfaceStroke(surface,{materialId,points,width:70,...extra});
}
const catalog=createCaptureCreatureCatalogProvider({
  schema:'capture-database-v1',creatures:[{draft:{
    id:'nature-creature',displayName:'Nature',elements:['nature'],
    capture:{spawnChance:50}
  }}]
});
const config=normalizeTerrainFamilyEncounterConfig({families:[
  {terrainFamilyId:'forest',encounterChancePercent:100,
    elementChances:[{elementId:'nature',chancePercent:100}]},
  {terrainFamilyId:'snow',encounterChancePercent:0,
    elementChances:[{elementId:'nature',chancePercent:100}]},
  {terrainFamilyId:'road',encounterChancePercent:0,
    elementChances:[{elementId:'nature',chancePercent:100}]},
  {terrainFamilyId:'sand',encounterChancePercent:0,
    elementChances:[{elementId:'nature',chancePercent:100}]}
]});
function walk(surface){
  const controller=createEncounterController({checkDistance:60});
  const input={area:{id:'sculpt-exterior',surface},encounterConfig:config,
    captureCatalog:catalog,playerPartyRef:'party',rulesetId:'capture.standard.1v1',random:()=>0};
  controller.step({...input,player:{currentAreaId:'sculpt-exterior',x:20,y:80}});
  return controller.step({...input,player:{currentAreaId:'sculpt-exterior',x:160,y:80}});
}

test('official painted materials supply matching encounter families by default',()=>{
  const expected=[
    ['road.dirt','road','routes'],
    ['grass.forest','forest','zones'],
    ['ground.forest_floor','forest','zones'],
    ['ground.snow','snow','zones'],
    ['ground.sand','sand','zones'],
    ['ground.mountain_rock','mountain','zones']
  ];
  for(const [material,family,kind] of expected){
    assert.equal(sculptEncounterFamilyForMaterial(material),family);
    const s=stroke(createSculptSurface(),material);
    assert.equal(s[kind][0].terrainFamilyId,family,material);
    assert.equal(s[kind][0].materialId,material);
  }
  assert.equal(sculptEncounterFamilyForMaterial('floor.wood.house'),null,
    'indoor floor has no invented encounter mapping');
  assert.equal(sculptEncounterFamilyForMaterial('not-in-catalogue'),null);
});

test('snow 0% and road 0% reject encounters while grass 100% may encounter',()=>{
  assert.equal(walk(stroke(createSculptSurface(),'ground.snow')),null);
  assert.equal(walk(stroke(createSculptSurface(),'road.dirt')),null);
  assert.equal(walk(stroke(createSculptSurface(),'ground.sand')),null);
  const encounter=walk(stroke(createSculptSurface(),'grass.forest'));
  assert.equal(encounter?.source,'terrain-random');
  assert.equal(encounter?.terrainFamilyId,'forest');
});

test('existing mismatched snow/road maps migrate only by explicit reversible authoring',()=>{
  const legacy=stroke(createSculptSurface(),'ground.snow',{terrainFamilyId:'forest'});
  assert.equal(legacy.zones[0].terrainFamilyId,'forest');
  assert.equal(walk(legacy)?.source,'terrain-random','legacy remains intact until opted in');
  const converted=alignSculptSurfaceEncounterFamilies(legacy);
  assert.equal(converted.zones[0].terrainFamilyId,'snow');
  assert.equal(walk(converted),null);
  assert.equal(converted.zones[0].id,legacy.zones[0].id);
  assert.deepEqual(converted.zones[0].points,legacy.zones[0].points);
  assert.equal(converted.zones[0].width,legacy.zones[0].width);
  assert.equal(legacy.zones[0].terrainFamilyId,'forest','existing save not mutated');
});

test('semantic overrides and base biome remain canonical unless author aligns a stroke',()=>{
  const custom=stroke(createSculptSurface(),'road.dirt',{terrainFamilyId:'forest'});
  assert.equal(walk(custom)?.terrainFamilyId,'forest');
  const aligned=alignSculptSurfaceEncounterFamilies(custom);
  assert.equal(aligned.routes[0].terrainFamilyId,'road');
  assert.equal(walk(aligned),null);
  const snowWorld={...createSculptSurface(),baseTerrainFamilyId:'snow'};
  const unchanged=alignSculptSurfaceEncounterFamilies(snowWorld);
  assert.equal(unchanged.baseTerrainFamilyId,'snow',
    'a snow map must not be rewritten to forest by its default placeholder material');
});

test('editor binds one surface family selection with an explicit undoable repair',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/id="surface-align-families"/);
  assert.match(script,/\$\('surface-material'\)\.addEventListener\('change'/);
  assert.match(script,/sculptEncounterFamilyForMaterial\(\$\('surface-material'\)\.value\)/);
  assert.match(script,/alignSculptSurfaceEncounterFamilies\(surface\)/);
  assert.match(script,/surfaceCommit\(aligned\)/);
});
