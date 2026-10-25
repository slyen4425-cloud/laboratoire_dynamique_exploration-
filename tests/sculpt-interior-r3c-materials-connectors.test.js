import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {isBlocked} from '../src/core/collision.js';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {INTERIOR_DOOR_ASSETS,INTERIOR_CONNECTOR_ASSETS} from '../src/world/interior-material-catalog.js';
import {createSculptInteriorArea,createSculptUpperFloor,updateSculptFloorConnector,
  updateSculptInteriorDoor,serializeSculptInteriors,importSculptInteriors,
  sculptInteriorPortalDocument,sculptInteriorTransition,createSculptInteriorTemplate,
  applySculptInteriorTemplate} from '../src/world/sculpt-interior-area-link.js';
import {resizeSculptInterior} from '../src/world/sculpt-interior-layout.js';

function fixture(){
  const objects=appendSculptPreviewObject([],{definitionId:
    'objectdef.building.house.fantasy_wood_stone.01',x:300,y:260,scale:.6});
  const house=resolveWorldObjectPlacements(objects)[0];
  return {objects,room:createSculptInteriorArea(house,objects)};
}
test('R3C : five wall finishes belong to WorldArea, door choices to Portal visuals',()=>{
  const {room}=fixture();
  const area=normalizeWorldArea({...room.area,wallMaterialId:'dark-stone'});
  assert.equal(area.wallMaterialId,'dark-stone');
  assert.equal(normalizeWorldArea({...area,wallMaterialId:'unknown'}).wallMaterialId,'plaster');
  const door=updateSculptInteriorDoor({...room,area},{assetId:'object.door.fantasy.wood.01'});
  assert.equal(door.exitPortal.visual.assetId,'object.door.fantasy.wood.01');
  assert.ok(INTERIOR_DOOR_ASSETS.every(x=>!x.path||x.path.endsWith('.webp')));
  assert.equal(INTERIOR_DOOR_ASSETS.length,4);
  assert.equal(INTERIOR_CONNECTOR_ASSETS.length,3);
  const exported=JSON.parse(JSON.stringify(serializeSculptInteriors([door])));
  const restored=importSculptInteriors(exported,fixture().objects);
  // Fixture's building instance IDs are deterministic per scene.
  assert.equal(restored[0].area.wallMaterialId,'dark-stone');
  assert.equal(restored[0].exitPortal.visual.assetId,'object.door.fantasy.wood.01');
});
test('R3C : room shape is true collision boundary and preserved under models',()=>{
  const {room}=fixture();
  const resized=resizeSculptInterior(room,{width:24,height:18,shape:'l'});
  assert.equal(resized.area.boundary.kind,'polygon');
  assert.equal(isBlocked(resized.area,{radius:7,locomotion:{modes:['ground']}},620,50),true);
  assert.equal(isBlocked(resized.area,{radius:7,locomotion:{modes:['ground']}},340,90),false);
  const template=createSculptInteriorTemplate({...resized,
    area:normalizeWorldArea({...resized.area,wallMaterialId:'brick'})},
    {id:'interior-template-r3c',name:'Donjon L'});
  const second=applySculptInteriorTemplate(room,template);
  assert.equal(second.area.wallMaterialId,'brick');
  assert.equal(second.area.boundary.kind,'polygon');
  assert.equal(second.terrain.width,24);
});
test('R3C : placed physical stair Portal and target Spawn roundtrip through JSON',()=>{
  const {room,objects}=fixture();
  const linked=createSculptUpperFloor(room);
  let entries=[linked.below,linked.upper];
  const ascending=entries[1].entryPortal;
  entries=updateSculptFloorConnector(entries,{
    sourceAreaId:room.area.id,portalId:ascending.id,
    x:170,y:125,assetId:'ladder.wood'
  });
  assert.equal(entries[1].entryPortal.trigger.x,170);
  assert.equal(entries[1].entryPortal.visual.assetId,'ladder.wood');
  assert.equal(entries[1].area.spawns.find(s=>s.id==='arrival-up').x,170);
  const descending=entries[1].exitPortal;
  entries=updateSculptFloorConnector(entries,{
    sourceAreaId:entries[1].area.id,portalId:descending.id,
    x:190,y:185,assetId:'stairs.stone'
  });
  assert.equal(entries[1].exitPortal.trigger.x,190);
  assert.equal(entries[0].area.spawns.find(s=>s.id==='arrival-down').x,190);
  const doc=sculptInteriorPortalDocument(objects,entries);
  assert.equal(doc.portals.length,4);
  const upstairs=sculptInteriorTransition(objects,entries,room.area.id,{x:170,y:125});
  assert.equal(upstairs.currentAreaId,entries[1].area.id);
  assert.equal(upstairs.x,170);
  const downstairs=sculptInteriorTransition(objects,entries,entries[1].area.id,{x:190,y:185});
  assert.equal(downstairs.currentAreaId,room.area.id);
  assert.equal(downstairs.x,190);
  const restored=importSculptInteriors(JSON.parse(
    JSON.stringify(serializeSculptInteriors(entries))),objects);
  assert.equal(restored[1].entryPortal.trigger.x,170);
  assert.equal(restored[1].entryPortal.visual.assetId,'ladder.wood');
  assert.equal(restored[1].exitPortal.trigger.x,190);
  assert.equal(restored[0].area.spawns.find(s=>s.id==='arrival-down').x,190);
});
test('R3C : visuals do not change authoritatively tested 35-degree camera',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/id="interior-wall-material"/);
  assert.match(html,/id="interior-door-asset"/);
  assert.match(html,/id="interior-connector-place"/);
  assert.match(main,/interior-shape'\)\.addEventListener\('change'/);
  assert.match(main,/sculptCameraInteriorView/);
  assert.match(main,/updateSculptFloorConnector\(sculptInteriors/);
});
