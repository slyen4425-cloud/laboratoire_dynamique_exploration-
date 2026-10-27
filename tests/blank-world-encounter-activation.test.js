import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createBlankWorldBuilderDraft,
  setAreaEncounterRandomEnabled,
  setTerrainFamilyExclusiveEncounterElement,
  updateTerrainFamilyEncounterProfile,
  addSurfacePath,
  importWorldBuilderDocument,
  serializeWorldBuilderDraft,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import { createCaptureCreatureCatalogProvider } from '../src/capture/capture-creature-catalog-provider.js';
import { CAPTURE_CREATURE_CATALOG_PREVIEW_V1 } from '../src/capture/capture-creature-catalog-preview-v1.js';
import { createEncounterController } from '../src/encounters/encounter-controller.js';
import { snapshotFromEncounterIntent } from '../src/encounters/encounter-bridge.js';

const catalog = createCaptureCreatureCatalogProvider(CAPTURE_CREATURE_CATALOG_PREVIEW_V1);
const makeForest = () => createBlankWorldBuilderDraft({
  terrainFamilyId:'forest', materialId:'grass.forest'
});
const configured = (draft) => setTerrainFamilyExclusiveEncounterElement(
  updateTerrainFamilyEncounterProfile(draft, 'forest', { encounterChancePercent: 100 }),
  'forest', 'earth'
);
function checkEncounter(world, {x=1370,y=800} = {}) {
  const controller = createEncounterController({checkDistance:160});
  const area=world.areas[0];
  const context={
    area, encounterConfig:world.encounterConfig, captureCatalog:catalog,
    playerPartyRef:'capture-party-player-v1', rulesetId:'capture.standard.1v1',
    random:() => 0
  };
  controller.step({...context,player:{currentAreaId:area.id,x:1200,y:800}});
  return controller.step({...context,player:{currentAreaId:area.id,x,y}});
}

test('new blank exterior allows encounters once the author configures the family; no automatic odds are inserted', () => {
  const blank=makeForest();
  assert.equal(blank.areas[0].encounters.randomEnabled,true);
  assert.ok(blank.encounterConfig.families.every(p=>p.encounterChancePercent===0));
  const world=configured(blank);
  assert.equal(validateWorldBuilderDraft(world).valid,true);
  const intent=checkEncounter(world);
  assert.ok(intent,'a fully configured blank forest must trigger an encounter after movement');
  assert.equal(intent.terrainFamilyId,'forest');
  assert.equal(intent.elementId,'earth');
  const snapshot=snapshotFromEncounterIntent(intent);
  assert.equal(snapshot.context.terrainFamilyId,'forest');
  assert.equal(snapshot.context.elementId,'earth');
  assert.ok(snapshot.opponents[0].creatureId);
});

test('existing imported explicit OFF remains OFF, and author can turn encounters on and off via one WorldArea field', () => {
  const blank=makeForest();
  const legacy=setAreaEncounterRandomEnabled(blank,blank.initialAreaId,false);
  assert.equal(legacy.areas[0].encounters.randomEnabled,false);
  const imported=importWorldBuilderDocument(serializeWorldBuilderDraft(legacy));
  assert.equal(imported.areas[0].encounters.randomEnabled,false);
  const disabledWorld=configured(imported);
  assert.equal(checkEncounter(disabledWorld),null);
  const enabled=setAreaEncounterRandomEnabled(disabledWorld,disabledWorld.initialAreaId,true);
  assert.equal(enabled.areas[0].encounters.randomEnabled,true);
  assert.equal(disabledWorld.areas[0].encounters.randomEnabled,false,'immutable original draft');
  assert.equal(validateWorldBuilderDraft(enabled).valid,true);
  assert.equal(snapshotFromEncounterIntent(checkEncounter(enabled)).context.elementId,'earth');
  const switchedOff=setAreaEncounterRandomEnabled(enabled,enabled.initialAreaId,false);
  assert.equal(checkEncounter(switchedOff),null);
  assert.equal(importWorldBuilderDocument(serializeWorldBuilderDraft(switchedOff)).areas[0].encounters.randomEnabled,false);
});

test('disabled encounters on interior and safe roads remain respected', () => {
  const world=configured(makeForest());
  const withRoad=addSurfacePath(world,world.initialAreaId,'route',{
    terrainFamilyId:'road', materialId:'road.dirt', width:80,
    points:[{x:1050,y:800},{x:1500,y:800}]
  });
  assert.equal(checkEncounter(withRoad),null,'road at 0% takes priority over underlying forest');
});

test('Builder exposes Area-owned activation, visible warning and explanation of surface and movement rules', async () => {
  const html=await readFile(new URL('../builder.html',import.meta.url),'utf8');
  const main=await readFile(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
  assert.match(html,/id="area-random-encounters-enabled"/);
  assert.match(html,/id="area-random-encounters-status"/);
  assert.match(html,/160/);
  assert.match(html,/sol de base|sol principal/i);
  assert.match(html,/id="family-encounter-surface-info"/);
  assert.match(main,/baseFamilyId === selectedEncounterFamilyId/);
  assert.match(main,/setAreaEncounterRandomEnabled/);
  assert.match(main,/\$\('area-random-encounters-enabled'\)\.checked/);
  assert.match(main,/refreshFamilyEncounterControls/);
});
