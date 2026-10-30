import test from 'node:test';
import assert from 'node:assert/strict';
import { createSculptEncounterArea } from '../src/encounters/sculpt-encounter-area-adapter.js';
import { createSculptSurface, appendSculptSurfaceStroke } from '../src/world/sculpt-surface-paint.js';
import { createEncounterController } from '../src/encounters/encounter-controller.js';
import { normalizeTerrainFamilyEncounterConfig } from '../src/encounters/terrain-family-encounter-config.js';
import { createCaptureCreatureCatalogProvider } from '../src/capture/capture-creature-catalog-provider.js';
import { snapshotFromEncounterIntent } from '../src/encounters/encounter-bridge.js';

const catalog=createCaptureCreatureCatalogProvider({schema:'capture-database-v1',creatures:[
 {draft:{id:'forest-creature',displayName:'Forest',elements:['nature'],capture:{spawnChance:30}}}
]});
const config=normalizeTerrainFamilyEncounterConfig({families:[
 {terrainFamilyId:'forest',encounterChancePercent:100,elementChances:[{elementId:'nature',chancePercent:100}]},
 {terrainFamilyId:'road',encounterChancePercent:0,elementChances:[]}
]});
const base=()=>createSculptSurface();
const road=()=>appendSculptSurfaceStroke(base(),{materialId:'road.dirt',terrainFamilyId:'road',width:50,
 points:[{x:0,y:80},{x:300,y:80}]});
function step(controller,area,x,y=80){
 return controller.step({area,player:{currentAreaId:area.id,x,y},encounterConfig:config,
  captureCatalog:catalog,playerPartyRef:'capture-party-player-v1',rulesetId:'capture.standard.1v1',random:()=>0});
}
test('2.5D projection reuses canonical WorldArea surface, does not create encounter geometry',()=>{
 const surface=road();
 const area=createSculptEncounterArea({areaId:'sculpt-exterior',surface,width:400,height:300});
 assert.strictEqual(area.surface,surface);
 assert.equal(area.id,'sculpt-exterior');
 assert.equal(area.encounters.randomEnabled,true);
 assert.equal(area.surface.routes[0].terrainFamilyId,'road');
 const controller=createEncounterController({checkDistance:60});
 assert.equal(step(controller,area,20),null);
 assert.equal(step(controller,area,140),null);
});
test('2.5D real moved coordinates route through ONE controller and snapshot bridge',()=>{
 const surface=base();
 const area=createSculptEncounterArea({areaId:'sculpt-exterior',surface,width:400,height:300});
 const controller=createEncounterController({checkDistance:60});
 assert.equal(step(controller,area,20),null);
 const intent=step(controller,area,140);
 assert.equal(intent?.opponentCreatureId,'forest-creature');
 const snapshot=snapshotFromEncounterIntent(intent);
 assert.equal(snapshot.context.terrainFamilyId,'forest');
 assert.equal(snapshot.context.areaId,'sculpt-exterior');
 assert.equal(controller.activeEncounterId,intent.encounterId);
 assert.equal(step(controller,area,260),null);
 assert.equal(controller.release(intent.encounterId),true);
 assert.equal(step(controller,area,360),null); // anchor reset after Combat
});
test('interior read projection honors WorldArea random encounters OFF',()=>{
 const surface=base();
 const area=createSculptEncounterArea({areaId:'interior-1',surface,width:300,height:240,
  existingArea:{id:'interior-1',kind:'interior',encounters:{randomEnabled:false}}});
 assert.equal(area.encounters.randomEnabled,false);
 const controller=createEncounterController({checkDistance:50});
 assert.equal(step(controller,area,20),null);
 assert.equal(step(controller,area,190),null);
});
test('teleport, reset, and editor return reset movement anchor, not a free encounter',()=>{
 const area=createSculptEncounterArea({areaId:'sculpt-exterior',surface:base(),width:400,height:300});
 const controller=createEncounterController({checkDistance:100});
 assert.equal(step(controller,area,20),null);
 assert.equal(step(controller,area,60),null);
 assert.equal(controller.resetAnchor(),true);
 assert.equal(step(controller,area,240),null);
 assert.equal(step(controller,area,280),null);
 assert.equal(step(controller,area,350)?.opponentCreatureId,'forest-creature');
 assert.equal(controller.resetAnchor(),false); // active encounter cannot be reset without releasing
});
test('invalid navigation projection rejects mismatched Area identity',()=>{
 assert.throws(()=>createSculptEncounterArea({areaId:'interior-1',surface:base(),width:300,height:250,
 existingArea:{id:'different',kind:'interior'}}),/Area/);
});
