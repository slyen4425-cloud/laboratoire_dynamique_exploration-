import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addWorldObject,createBlankWorldBuilderDraft,createWorldBuilderDraft,
  serializeWorldBuilderDraft,importWorldBuilderDocument,validateWorldBuilderDraft}
  from '../src/builder/world-builder-draft.js';
import {linkSculptWorldBuildingInteriorV1,sculptWorldAreaScene,saveSculptWorldArea}
  from '../src/builder/sculpt-world-area-link.js';
import {appendInteriorWall} from '../src/world/interior-wall-model.js';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {findTriggeredPortal,applyPortalTransition,portalReferencesAreValid}
  from '../src/world/portal-model.js';
import {
 worldInteriorFloors,worldInteriorFloorPortals,worldInteriorHouseExit,
 addWorldInteriorFloor,changeWorldInteriorDoor,changeWorldInteriorConnector
} from '../src/builder/sculpt-world-interior-floors-v1.js';

function linkedHouse(){
 let world=createBlankWorldBuilderDraft({width:36*28,height:24*21});
 const outside=world.areas.find(a=>a.kind==='exterior');
 world=addWorldObject(world,outside.id,{
   objectDefinitionId:'objectdef.building.house.blue_cottage.01',
   id:'linked-house-ui-regression',
   transform:{x:510,y:305,rotationDeg:0,scaleX:1,scaleY:1}
 });
 const link=linkSculptWorldBuildingInteriorV1(world,{
   sourceAreaId:outside.id,buildingId:'linked-house-ui-regression'});
 return {world:link.document,outsideAreaId:outside.id,groundId:link.targetAreaId};
}
test('WorldBuilder linked house opens the native interior inspector, wall tool and return exit',()=>{
 const {world,outsideAreaId,groundId}=linkedHouse();
 const root=worldInteriorFloors(world,groundId);
 assert.deepEqual(root.map(f=>f.level),[0]);
 assert.equal(root[0].areaId,groundId);
 assert.equal(worldInteriorHouseExit(world,groundId).outsideAreaId,outsideAreaId);
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(main,/const inInterior=!!entry\|\|worldInterior/);
 assert.match(main,/\$\('interior-area-bar'\)\.hidden=!inInterior/);
 assert.match(main,/function currentInteriorArea\(\)/);
 assert.match(main,/sculptWorldCurrentInterior\(\)\)commitWorldInteriorAreaPatch\(\{walls\}\)/);
 assert.match(main,/\$\('interior-area-return'\)\.addEventListener\('click'/);
 assert.match(main,/worldInteriorHouseExit\(sculptWorldDraft,sculptWorldAreaId\)/);
 assert.match(html,/id="interior-wall-toggle"/);
 assert.match(html,/id="interior-level-add"/);
 assert.match(html,/id="interior-area-return"/);
});
test('two linked upper floors create one canonical Area and two traversable Portals per level; save + reload is lossless',()=>{
 const {world,groundId,outsideAreaId}=linkedHouse();
 const beforeAreas=world.areas.length,beforePortals=world.portals.length;
 const created=addWorldInteriorFloor(world,groundId);
 assert.equal(created.document.areas.length,beforeAreas+1);
 assert.equal(created.document.portals.length,beforePortals+2);
 assert.equal(created.document.areas.find(a=>a.id===created.areaId).interiorFloor.rootAreaId,groundId);
 assert.deepEqual(worldInteriorFloors(created.document,created.areaId).map(f=>f.level),[0,1]);
 const up=worldInteriorFloorPortals(created.document,groundId);
 const down=worldInteriorFloorPortals(created.document,created.areaId);
 assert.equal(up.length,1);assert.equal(down.length,1);
 assert.equal(up[0].targetAreaId,created.areaId);
 assert.equal(down[0].targetAreaId,groundId);
 assert.equal(up[0].visual.assetId,'stairs.wood');
 assert.equal(portalReferencesAreValid(created.document.areas,up[0]),true);
 assert.equal(portalReferencesAreValid(created.document.areas,down[0]),true);
 const goingUp=applyPortalTransition(created.document,
   {currentAreaId:groundId,x:up[0].trigger.x,y:up[0].trigger.y},up[0]);
 assert.equal(goingUp.currentAreaId,created.areaId);
 assert.equal(findTriggeredPortal(created.document,created.areaId,goingUp),null,
   'arrival must never immediately trigger the return passage');
 const top=addWorldInteriorFloor(created.document,created.areaId);
 assert.deepEqual(worldInteriorFloors(top.document,top.areaId).map(f=>f.level),[0,1,2]);
 assert.equal(worldInteriorHouseExit(top.document,top.areaId).outsideAreaId,outsideAreaId);
 const persisted=importWorldBuilderDocument(serializeWorldBuilderDraft(top.document));
 assert.deepEqual(worldInteriorFloors(persisted,top.areaId).map(f=>f.level),[0,1,2]);
 assert.equal(persisted.portals.length,beforePortals+4);
 assert.equal(validateWorldBuilderDraft(persisted).valid,true);
 assert.equal(worldInteriorHouseExit(persisted,top.areaId).rootAreaId,groundId);
});
test('real walls, wall material, floor contents and original house entrance survive the same world roundtrip',()=>{
 const {world,outsideAreaId,groundId}=linkedHouse();
 const originalEntrance=world.portals.find(p=>p.sourceAreaId===outsideAreaId&&
   p.targetAreaId===groundId&&p.trigger.kind==='object-anchor');
 const area=world.areas.find(a=>a.id===groundId);
 const walls=appendInteriorWall(area.walls,{a:{x:56,y:84},b:{x:280,y:84}});
 let saved=createWorldBuilderDraft({...world,areas:world.areas.map(a=>a.id===groundId?
   normalizeWorldArea({...a,walls,wallMaterialId:'stone'}):a)});
 const scene=sculptWorldAreaScene(saved.areas.find(a=>a.id===groundId));
 saved=saveSculptWorldArea(saved,groundId,scene);
 const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(saved));
 const interior=restored.areas.find(a=>a.id===groundId);
 assert.equal(interior.walls.length,1);
 assert.equal(interior.walls[0].id,walls[0].id);
 assert.equal(interior.wallMaterialId,'stone');
 assert.equal(restored.portals.find(p=>p.id===originalEntrance.id).trigger.objectId,
   originalEntrance.trigger.objectId);
});
test('floor stairs and exterior return door update native Portal visuals but not WorldObject or other worlds',()=>{
 const {world,groundId,outsideAreaId}=linkedHouse();
 const floor=addWorldInteriorFloor(world,groundId);
 const portal=worldInteriorFloorPortals(floor.document,groundId)[0];
 const changed=changeWorldInteriorConnector(floor.document,portal.id,{
   x:210,y:147,assetId:'ladder.wood',rotationDeg:90});
 const modified=changed.portals.find(p=>p.id===portal.id);
 assert.equal(modified.visual.assetId,'ladder.wood');
 assert.equal(modified.visual.rotationDeg,90);
 assert.equal(modified.trigger.x,210);
 const rootExit=worldInteriorHouseExit(changed,groundId).exit;
 const door=changeWorldInteriorDoor(changed,groundId,{
   x:200,y:256,assetId:'default',scale:.7});
 assert.equal(door.portals.find(p=>p.id===rootExit.id).trigger.x,200);
 assert.equal(door.portals.find(p=>p.id===rootExit.id).visual.scale,.7);
 assert.equal(worldInteriorHouseExit(door,groundId).outsideAreaId,outsideAreaId);
 assert.deepEqual(door.areas.find(a=>a.id===outsideAreaId).objects,
    world.areas.find(a=>a.id===outsideAreaId).objects);
 assert.throws(()=>changeWorldInteriorDoor(door,floor.areaId,{x:100}),/rez-de-chaussée/);
 assert.equal(validateWorldBuilderDraft(door).valid,true);
});
