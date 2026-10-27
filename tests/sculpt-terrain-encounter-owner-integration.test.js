import test from 'node:test';
import assert from 'node:assert/strict';
import { createSculptSurface, appendSculptSurfaceStroke } from '../src/world/sculpt-surface-paint.js';
import { createEncounterController } from '../src/encounters/encounter-controller.js';
import { createCaptureCreatureCatalogProvider } from '../src/capture/capture-creature-catalog-provider.js';
import { normalizeTerrainFamilyEncounterConfig } from '../src/encounters/terrain-family-encounter-config.js';

const catalog = createCaptureCreatureCatalogProvider({
  schema: 'capture-database-v1',
  creatures: [{ draft: {
    id: 'wild-nature', displayName: 'Wild Nature',
    elements: ['nature'], capture: { spawnChance: 30 }
  } }]
});
const config = normalizeTerrainFamilyEncounterConfig({
  families: [
    { terrainFamilyId: 'forest', encounterChancePercent: 100, elementChances: [{elementId: 'nature',chancePercent: 100}] },
    { terrainFamilyId: 'road', encounterChancePercent: 0, elementChances: [] }
  ]
});
function walkingEncounter(surface) {
  const controller = createEncounterController({checkDistance: 60});
  const area = {id:'sculpt-exterior', surface};
  const payload = {
    area, encounterConfig: config, captureCatalog: catalog,
    playerPartyRef: 'capture-party', rulesetId: 'capture.standard.1v1',
    random: () => 0
  };
  const player = (x)=>({currentAreaId:'sculpt-exterior',x,y:80});
  assert.equal(controller.step({...payload,player:player(20)}),null);
  return controller.step({...payload,player:player(160)});
}
const stroke = {
  materialId:'road.dirt',points:[{x:0,y:80},{x:220,y:80}],width:60
};

test('2.5D painted route uses canonical safe road family in existing Encounter Controller', () => {
  const surface = appendSculptSurfaceStroke(createSculptSurface(),{...stroke,terrainFamilyId:'road'});
  assert.equal(surface.routes[0].terrainFamilyId,'road');
  assert.equal(walkingEncounter(surface),null);
});

test('same 2.5D route texture with explicitly authored forest family can spawn Capture creature', () => {
  const surface = appendSculptSurfaceStroke(createSculptSurface(),{...stroke,terrainFamilyId:'forest'});
  assert.equal(surface.routes[0].materialId,'road.dirt');
  const encounter = walkingEncounter(surface);
  assert.equal(encounter?.source,'terrain-random');
  assert.equal(encounter?.opponentCreatureId,'wild-nature');
  assert.equal(encounter?.terrainFamilyId,'forest');
});

test('Capture creature selection ignores texture and retains the single encounter lock', () => {
  const surface = appendSculptSurfaceStroke(createSculptSurface(), {
    materialId:'ground.snow',terrainFamilyId:'forest',points:stroke.points,width:stroke.width
  });
  const intent = walkingEncounter(surface);
  assert.equal(intent?.opponentCreatureId,'wild-nature');
});
