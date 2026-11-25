import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorldBuilderDraft,addWorldObject,createBuildingInteriorLink,validateWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {demoWorldDocument} from '../src/world/demo-world.js';
import {buildingDoorCounterpart,findPortalEnteredDuringMove,findTriggeredPortal,applyPortalTransition,resolvePortalWaypoint} from '../src/world/portal-model.js';
import {placeSculptWorldPortal,setSculptWorldPortalAppearance} from '../src/builder/sculpt-world-area-link.js';
import {markersForSculptWorldArea} from '../src/builder/sculpt-world-portal-markers.js';
function fixture(){
 let d=createWorldBuilderDraft(demoWorldDocument);
 const area=d.areas.find(a=>a.kind==='exterior');
 d=addWorldObject(d,area.id,{id:'door-test-house',objectDefinitionId:'objectdef.building.house.blue_cottage.01',transform:{x:980,y:620,rotationDeg:0,scaleX:1,scaleY:1}});
 d=createBuildingInteriorLink(d,{sourceAreaId:area.id,buildingId:'door-test-house'});
 const checked=validateWorldBuilderDraft(d);assert.equal(checked.valid,true,checked.errors.join(', '));
 d=createWorldBuilderDraft(checked.document);
 const entry=d.portals.find(p=>p.trigger.objectId==='door-test-house');
 const exit=buildingDoorCounterpart(d,entry);
 assert.ok(exit);
 return {d,entry,exit};
}
test('legacy house uses safe shared points and explicit interaction in both directions',()=>{
 const {d,entry,exit}=fixture();
 for(const p of [entry,exit]){
  const point=resolvePortalWaypoint(d,p);
  assert.equal(findTriggeredPortal(d,p.sourceAreaId,point)?.id,p.id);
  assert.equal(findPortalEnteredDuringMove(d,p.sourceAreaId,{x:point.x+point.radius+10,y:point.y},point),null);
  const other=buildingDoorCounterpart(d,p),arrival=resolvePortalWaypoint(d,other);
  const result=applyPortalTransition(d,{currentAreaId:p.sourceAreaId,...point},p);
  assert.equal(result.x,arrival.x);assert.equal(result.y,arrival.y);
  assert.equal(markersForSculptWorldArea(d,p.sourceAreaId,{showHidden:true}).filter(m=>m.portalId===p.id).length,1);
 }
});
test('move each shared endpoint without replacing ids, anchor or spawn; hidden/radius persist',()=>{
 let {d,entry,exit}=fixture();
 d=placeSculptWorldPortal(d,entry.id,{x:1000,y:700});
 d=placeSculptWorldPortal(d,exit.id,{x:200,y:200});
 d=setSculptWorldPortalAppearance(d,entry.id,{mode:'hidden',radius:40});
 d=importWorldBuilderDocument(serializeWorldBuilderDraft(d));
 const e=d.portals.find(p=>p.id===entry.id),x=d.portals.find(p=>p.id===exit.id);
 assert.equal(e.trigger.objectId,entry.trigger.objectId);assert.equal(e.targetSpawnId,entry.targetSpawnId);
 assert.equal(x.targetSpawnId,exit.targetSpawnId);
 assert.deepEqual(resolvePortalWaypoint(d,e),{x:1000,y:700,radius:40});
 assert.equal(resolvePortalWaypoint(d,x).x,200);
 assert.equal(applyPortalTransition(d,{currentAreaId:x.sourceAreaId},x).x,1000);
 assert.equal(applyPortalTransition(d,{currentAreaId:e.sourceAreaId},e).x,200);
 assert.equal(markersForSculptWorldArea(d,e.sourceAreaId,{testing:true}).some(m=>m.portalId===e.id),false);
 assert.equal(markersForSculptWorldArea(d,e.sourceAreaId,{showHidden:true}).some(m=>m.portalId===e.id),true);
});

test('2D runtime requires a door click and auto travel uses entry edge',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(source,/applyTriggeredPortal\(findPortalEnteredDuringMove/);
 assert.match(source,/isManualBuildingPortal\(activeWorldDocument,portal\)\?applyTriggeredPortal\(portal\)/);
 const {d,entry,exit}=fixture();
 const arrival=applyPortalTransition(d,{currentAreaId:entry.sourceAreaId},entry);
 assert.equal(findPortalEnteredDuringMove(d,exit.sourceAreaId,arrival,arrival),null);
});
