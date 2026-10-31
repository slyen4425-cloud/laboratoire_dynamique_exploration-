import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,createBuildingInteriorLink,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {createSculptInteriorTemplate} from '../src/world/sculpt-interior-area-link.js';
import {worldInteriorAdapter,worldInteriorFloors,resizeWorldInterior,editWorldInteriorDoor,
  addWorldInteriorFloor,editWorldInteriorConnector,applyWorldInteriorTemplate} from '../src/builder/world-interior-authoring.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const house=(id,x)=>({id,objectDefinitionId:'objectdef.building.house.fantasy_wood_stone.01',
 transform:{x,y:250,scaleX:.8,scaleY:.8,rotationDeg:0}});
const fixture=()=>{
 let d=createBlankWorldBuilderDraft({width:36*28,height:24*21});
 const id=d.initialAreaId;
 d={...d,areas:d.areas.map(a=>a.id===id?{...a,objects:[house('maison-A',250),house('maison-B',650)]}:a)};
 d=createBuildingInteriorLink(d,{sourceAreaId:id,buildingId:'maison-A',interiorSize:{width:18*28,height:14*21}});
 d=createBuildingInteriorLink(d,{sourceAreaId:id,buildingId:'maison-B',interiorSize:{width:18*28,height:14*21}});
 const a=d.portals.find(p=>p.trigger.objectId==='maison-A').targetAreaId;
 const b=d.portals.find(p=>p.trigger.objectId==='maison-B').targetAreaId;
 return {d,a,b};
};
test('World Builder room editor commands preserve individual rooms, WorldDocument Portal+Spawn roundtrip',()=>{
 let {d,a,b}=fixture();const bBefore=JSON.stringify(importWorldBuilderDocument(serializeWorldBuilderDraft(d)).areas.find(x=>x.id===b));
 d=resizeWorldInterior(d,a,{width:22,height:18,shape:'l'});
 assert.equal(d.areas.find(x=>x.id===a).width,22*28);
 assert.equal(d.areas.find(x=>x.id===a).boundary.kind,'polygon');
 let p=d.portals.find(x=>x.sourceAreaId===a&&x.targetAreaId===d.initialAreaId);
 d=editWorldInteriorDoor(d,a,{x:245,y:310,assetId:'object.door.interior.bois_renforce.face',scale:.8});
 p=d.portals.find(x=>x.id===p.id);
 assert.equal(p.trigger.x,245);assert.equal(p.visual.scale,.8);
 assert.equal(p.visual.assetId,'object.door.interior.bois_renforce.face');
 const entry=d.portals.find(x=>x.targetAreaId===a&&x.sourceAreaId===d.initialAreaId);
 assert.equal(d.areas.find(x=>x.id===a).spawns.find(s=>s.id===entry.targetSpawnId).x,245);
 assert.equal(JSON.stringify(d.areas.find(x=>x.id===b)),bBefore);
 const saved=importWorldBuilderDocument(serializeWorldBuilderDraft(d));
 assert.equal(saved.areas.find(x=>x.id===a).width,22*28);
 assert.equal(saved.portals.find(x=>x.id===p.id).visual.assetId,p.visual.assetId);
});
test('room reusable template copies content but never identity, outside door or other house',()=>{
 let {d,a,b}=fixture();
 d={...d,areas:d.areas.map(room=>room.id===a?{...room,wallMaterialId:'stone'}:room)};
 d=resizeWorldInterior(d,a,{width:20,height:16,shape:'t'});
 const entry=worldInteriorAdapter(d,a);
 const t=createSculptInteriorTemplate(entry,{id:'interior-template-1',name:'Modèle de village'});
 const bBefore=d.areas.find(x=>x.id===b);
 const incomingId=d.portals.find(x=>x.targetAreaId===b&&x.trigger.kind==='object-anchor').id;
 const result=applyWorldInteriorTemplate(d,b,t);
 assert.equal(result.areas.find(x=>x.id===b).width,20*28);
 assert.equal(result.areas.find(x=>x.id===b).boundary.kind,'polygon');
 assert.equal(result.areas.find(x=>x.id===b).wallMaterialId,'stone',
   'template wall material must be copied with the walls into house B');
 assert.equal(result.portals.find(x=>x.id===incomingId).targetAreaId,b);
 assert.equal(result.areas.find(x=>x.id===a).width,20*28);
 assert.equal(d.areas.find(x=>x.id===b),bBefore,'input draft immutable');
 assert.equal(importWorldBuilderDocument(serializeWorldBuilderDraft(result)).areas.find(x=>x.id===b).width,20*28);
});
test('two floors share only WorldDocument Portals, with independent walls/materials and editable connector',()=>{
 let {d,a,b}=fixture();const bBefore=JSON.stringify(importWorldBuilderDocument(serializeWorldBuilderDraft(d)).areas.find(x=>x.id===b));
 const entry=d.portals.find(p=>p.targetAreaId===a&&p.trigger.kind==='object-anchor');
 const arrival=d.areas.find(x=>x.id===a).spawns.find(s=>s.id===entry.targetSpawnId);
 const made=addWorldInteriorFloor(d,a);
 d=made.document;
 assert.equal(worldInteriorFloors(d,a).length,2);
 assert.deepEqual(d.areas.find(x=>x.id===a).spawns.find(s=>s.id===entry.targetSpawnId),arrival,
   'adding stairs must not move the original house entrance Spawn');
 const up=d.portals.find(x=>x.sourceAreaId===a&&x.targetAreaId===made.areaId);
 assert.ok(up?.visual.marker==='portal');
 assert.ok(d.portals.some(x=>x.sourceAreaId===made.areaId&&x.targetAreaId===a));
 d=editWorldInteriorConnector(d,up.id,{x:220,y:140,assetId:'ladder.wood',rotationDeg:90});
 const moved=d.portals.find(x=>x.id===up.id);
 assert.equal(moved.trigger.x,220);assert.equal(moved.visual.assetId,'ladder.wood');
 assert.equal(moved.visual.rotationDeg,90);
 assert.equal(d.areas.find(x=>x.id===made.areaId).spawns.find(s=>s.id===up.targetSpawnId).x,220);
 assert.equal(JSON.stringify(d.areas.find(x=>x.id===b)),bBefore);
 const next=importWorldBuilderDocument(serializeWorldBuilderDraft(d));
 assert.equal(next.portals.find(x=>x.id===up.id).visual.rotationDeg,90);
 assert.equal(next.areas.find(x=>x.id===made.areaId).kind,'interior');
 const third=addWorldInteriorFloor(next,made.areaId);
 const doc3=third.document;
 assert.equal(worldInteriorFloors(doc3,third.areaId).length,3);
 const ascend=doc3.portals.find(p=>p.sourceAreaId===made.areaId&&p.targetAreaId===third.areaId);
 const descend=doc3.portals.find(p=>p.sourceAreaId===made.areaId&&p.targetAreaId===a);
 assert.ok(Math.hypot(ascend.trigger.x-descend.trigger.x,ascend.trigger.y-descend.trigger.y)>
   ascend.trigger.radius+descend.trigger.radius,
   'floor 2 up/down stair circles must not overlap');
 assert.equal(findTriggeredPortal(doc3,made.areaId,{
   x:ascend.trigger.x,y:ascend.trigger.y})?.id,ascend.id,
   'the new upper floor must be reachable by normal manual Portal action');
 assert.throws(()=>resizeWorldInterior(next,a,{width:26,height:18,shape:'rectangle'}),/étage|passage|Portal/i);
});
test('all published house-editor buttons remain visible and call WorldDocument adapters, no prototype authority',()=>{
 const html=src('sculpt-lab.html'),js=src('src/sculpt-lab-main.js');
 assert.doesNotMatch(html,/body\.world-area-editing\.sculpt-interior-area \.interior-floor-tools[\s\S]*?display:none!important/);
 for(const control of ['interior-floor-tools','interior-layout-tools','interior-door-tools','interior-template-tools']){
   assert.match(html,new RegExp('class="'+control+'"'));
 }
 for(const fn of ['resizeWorldInterior','editWorldInteriorDoor','addWorldInteriorFloor',
   'editWorldInteriorConnector','applyWorldInteriorTemplate','worldInteriorFloors'])
   assert.ok(js.includes(fn),fn+' should edit canonical WorldDocument');
 assert.match(js,/worldRoom.*\$\('interior-layout-apply'\)/s);
});
