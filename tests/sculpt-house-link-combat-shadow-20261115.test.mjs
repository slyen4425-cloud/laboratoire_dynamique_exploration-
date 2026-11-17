import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {demoWorldDocument} from '../src/world/demo-world.js';
import {addWorldObject,createWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument}
  from '../src/builder/world-builder-draft.js';
import {linkSculptWorldBuildingInteriorV1,sculptWorldAreaScene}
  from '../src/builder/sculpt-world-area-link.js';
import {findTriggeredPortal,applyPortalTransition,resolvePortalTriggerPoint}
  from '../src/world/portal-model.js';
import {resolveWorldAreaSpawnPoint} from '../src/world/world-area-model.js';

const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');

function houseWorld(){
 let draft=createWorldBuilderDraft(demoWorldDocument);
 const area=draft.areas.find(a=>a.kind==='exterior')??draft.areas[0];
 const buildingId='house-on-map-author';
 draft=addWorldObject(draft,area.id,{
  objectDefinitionId:'objectdef.building.house.blue_cottage.01',id:buildingId,
  transform:{x:980,y:620,rotationDeg:0,scaleX:1,scaleY:1}
 });
 return {draft,sourceAreaId:area.id,buildingId};
}

test('single click in 2.5D creates real linked WorldArea and two traversable native Portals',()=>{
 const {draft,sourceAreaId,buildingId}=houseWorld();
 const oldAreas=draft.areas.length,oldPortals=draft.portals.length;
 const link=linkSculptWorldBuildingInteriorV1(draft,{sourceAreaId,buildingId});
 assert.equal(link.created,true);
 assert.equal(link.document.areas.length,oldAreas+1);
 assert.equal(link.document.portals.length,oldPortals+2);
 const door=link.document.portals.find(p=>p.id===link.portalId);
 const target=link.document.areas.find(a=>a.id===link.targetAreaId);
 assert.equal(door.trigger.kind,'object-anchor');
 assert.equal(door.enabled,true);assert.equal(target.kind,'interior');
 assert.equal(target.width,18*28);assert.equal(target.height,14*21);
 assert.equal(sculptWorldAreaScene(target).terrain.width,18);
 assert.equal(sculptWorldAreaScene(target).terrain.height,14);
 const doorPoint=resolvePortalTriggerPoint(link.document.areas,door);
 assert.ok(door.trigger.radius>=84,'safe physical approach must reach the door without penetrating collision');
 assert.equal(findTriggeredPortal(link.document,sourceAreaId,doorPoint).id,door.id);
 const entry=applyPortalTransition(link.document,{currentAreaId:sourceAreaId,...doorPoint},door);
 assert.equal(entry.currentAreaId,target.id);
 const back=link.document.portals.find(p=>p.sourceAreaId===target.id&&p.targetAreaId===sourceAreaId);
 assert.ok(back,'exit returns to the same exterior');
 const returnState=applyPortalTransition(link.document,{currentAreaId:target.id,
  x:back.trigger.x,y:back.trigger.y},back);
 assert.equal(returnState.currentAreaId,sourceAreaId);
 const arrival=resolveWorldAreaSpawnPoint(
  link.document.areas.find(a=>a.id===sourceAreaId),back.targetSpawnId);
 assert.deepEqual({x:returnState.x,y:returnState.y},{x:arrival.x,y:arrival.y});
 assert.ok(Math.hypot(arrival.x-doorPoint.x,arrival.y-doorPoint.y)<=door.trigger.radius,
  'door remains reachable from its canonical collision-safe return Spawn');
});

test('relinking same house reuses exact IDs and never duplicates WorldAreas/Portals',()=>{
 const input=houseWorld(),first=linkSculptWorldBuildingInteriorV1(input.draft,input);
 const again=linkSculptWorldBuildingInteriorV1(first.document,input);
 assert.equal(again.created,false);
 assert.equal(again.portalId,first.portalId);
 assert.equal(again.targetAreaId,first.targetAreaId);
 assert.equal(again.document.areas.length,first.document.areas.length);
 assert.equal(again.document.portals.length,first.document.portals.length);
 const saved=importWorldBuilderDocument(serializeWorldBuilderDraft(again.document));
 assert.ok(saved.portals.some(p=>p.id===first.portalId));
 assert.ok(saved.areas.some(a=>a.id===first.targetAreaId));
});

test('invalid building never creates a spare interior, and original source stays immutable',()=>{
 const {draft,sourceAreaId}=houseWorld(),old=JSON.stringify(draft);
 assert.throws(()=>linkSculptWorldBuildingInteriorV1(draft,{
  sourceAreaId,buildingId:'nonexistent-house'
 }),/maison/);
 assert.equal(JSON.stringify(draft),old);
});

test('World Builder editing uses one canonical document; standalone Sculpt remains isolated',()=>{
 assert.match(source,/linkSculptWorldBuildingInteriorV1\(sculptWorldDraft/);
 assert.match(source,/commitCurrentSculptWorldArea\(\)/);
 assert.match(source,/saveWorldAssemblerDraft\(worldStorage,sculptWorldDraft\)/);
  assert.match(source,/const worldStorage=sculptUniverseId===null\?window\.localStorage/);
 assert.match(source,/mountWorldSculptArea\(link\.targetAreaId,scene\)/);
 assert.match(source,/if\(sculptWorldDraft\)\{/);
 assert.match(html,/id="object-open-interior"/);
 assert.match(html,/id="world-area-return-house"/);
 assert.match(source,/sculptInteriors=Object\.freeze\(\[\.\.\.sculptInteriors,entry\]\)/,
  'standalone legacy Sculpt interiors are not destructively removed');
 assert.doesNotMatch(source.slice(source.indexOf('function openSelectedSculptInterior(){'),
  source.indexOf('function updateSculptDoorAction(){')),/new Map\(\)|localStorage\.setItem\(/);
});

test('Tester resumes exact outstanding Combat journal, not overwritten by arena edits',()=>{
 assert.match(source,/readCombatHandoff\(sculptCombatStorage\)/);
 assert.match(source,/consumeCombatResult\(sculptCombatStorage\)/);
 assert.match(source,/sculptEncounterController\.restore\(pending\.snapshot\.encounterId\)/);
 assert.match(source,/presentSculptEncounter\(pending\.snapshot,true\)/);
 assert.match(source,/if\(!testerHandoffRecovered\)sculptEncounterStep\(\)/);
});
