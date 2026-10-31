import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldObjectPlacements,resolveWorldObjectPlacement} from '../src/world/world-object-placement-model.js';
import {buildingDoorAnchorWorld,buildingDoorArrivalWorld,buildingFootprintRect} from '../src/world/world-object-model.js';
import {circleIntersectsOrientedRect,isBlocked} from '../src/core/collision.js';
import {createBlankWorldBuilderDraft,createBuildingInteriorLink,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {resolvePortalTriggerPoint} from '../src/world/portal-model.js';
import {resolveWorldAreaSpawnPoint} from '../src/world/world-area-model.js';

// Exact authored house placements from user's unfinished 80×60 `foret_1`.
// This fixture does not publish or overwrite any of the player's maps.
const buildings=[
  {id:'sculpt-object-129',objectDefinitionId:'objectdef.building.house.fantasy_wood_stone.01',
   transform:{x:780.4896850585938,y:550.927080154419,rotationDeg:0,scaleX:.85,scaleY:.85}},
  {id:'sculpt-object-141',objectDefinitionId:'objectdef.building.house.terracotta_2p5d.01',
   transform:{x:1507.5834732055664,y:669.8124713897705,rotationDeg:9,scaleX:.9,scaleY:.9},
   overrides:{visualVariantId:'side'}}
];
const getBuilding=i=>resolveWorldObjectPlacement(normalizeWorldObjectPlacements([buildings[i]])[0]);

test('forest 1: house thresholds remain at the facade, not 100 units out on a road',()=>{
 for(const i of [0,1]){
  const b=getBuilding(i),foot=b.baseSize.height*b.transform.scaleY;
  const doorway=buildingDoorAnchorWorld(b,'main-door');
  const arrival=buildingDoorArrivalWorld(b,'main-door',20);
  assert.ok(doorway.y < b.transform.y+foot*.22,'entrance is at the building facade');
  assert.ok(Math.hypot(arrival.x-doorway.x,arrival.y-doorway.y)<=21);
  assert.ok(Math.hypot(doorway.x-b.transform.x,doorway.y-b.transform.y)<foot*.3);
  assert.equal(circleIntersectsOrientedRect(doorway.x,doorway.y,10,buildingFootprintRect(b)),false,
   'the doorstep must remain reachable next to a solid building wall');
 }
});
test('forest 1: scaled buildings block entering their apparent walls; area behind the roof stays walkable',()=>{
 const b=getBuilding(1),H=b.baseSize.height*b.transform.scaleY;
 const collision=buildingFootprintRect(b);
 const inside={x:b.transform.x,y:b.transform.y-H*.45};
 assert.equal(circleIntersectsOrientedRect(inside.x,inside.y,9,collision),true);
 const world={width:80*28,height:60*21,objects:[buildings[1]],obstacles:[]};
 assert.equal(isBlocked(world,{radius:9},inside.x,inside.y),true);
 assert.equal(isBlocked(world,{radius:9},b.transform.x,b.transform.y-H*.95),false);
 const larger=resolveWorldObjectPlacement(normalizeWorldObjectPlacements([{
  ...buildings[1],transform:{...buildings[1].transform,scaleX:1.4,scaleY:1.4}}])[0]);
 const wallAfterScale={x:larger.transform.x,y:larger.transform.y-larger.baseSize.height*larger.transform.scaleY*.45};
 assert.equal(circleIntersectsOrientedRect(wallAfterScale.x,wallAfterScale.y,9,buildingFootprintRect(larger)),true);
});
test('new interior links use door-relative arrival near the facade after scale/rotation and export',()=>{
 let draft=createBlankWorldBuilderDraft({id:'forest-entry-qa',width:80*28,height:60*21});
 const area=draft.areas[0];
 draft={...draft,areas:draft.areas.map(a=>a.id===area.id?{...a,objects:buildings}:a)};
 draft=createBuildingInteriorLink(draft,{sourceAreaId:area.id,buildingId:buildings[1].id,
  anchorId:'main-door',interiorSize:{width:18*28,height:14*21}});
 const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(draft));
 const linked=restored.portals.find(p=>p.sourceAreaId===area.id&&p.trigger.kind==='object-anchor'&&p.trigger.objectId===buildings[1].id);
 assert.ok(linked,'house must have canonical Portal');
 const door=resolvePortalTriggerPoint(restored.areas,linked);
 const returnPortal=restored.portals.find(p=>p.sourceAreaId===linked.targetAreaId&&p.targetAreaId===area.id);
 const outside=restored.areas.find(a=>a.id===area.id);
 const returnSpawn=resolveWorldAreaSpawnPoint(outside,returnPortal.targetSpawnId);
 const distance=Math.hypot(door.x-returnSpawn.x,door.y-returnSpawn.y);
 assert.ok(distance>=12&&distance<=28,'return should be just outside the same threshold');
 assert.equal(isBlocked(outside,{radius:9},returnSpawn.x,returnSpawn.y),false,
  'return spawn must be walkable, not inside the facade or on the road');
});

test('old generated 72-unit return spawns migrate once; custom 72-unit spawns stay authored',()=>{
 let draft=createBlankWorldBuilderDraft({id:'migration-qa',width:80*28,height:60*21});
 const id=draft.areas[0].id;
 draft={...draft,areas:draft.areas.map(a=>a.id===id?{...a,objects:buildings}:a)};
 draft=createBuildingInteriorLink(draft,{sourceAreaId:id,buildingId:buildings[1].id,
  interiorSize:{width:18*28,height:14*21}});
 const raw=JSON.parse(serializeWorldBuilderDraft(draft));
 const outside=raw.areas.find(a=>a.id===id);
 const generated=outside.spawns.find(s=>s.id===buildings[1].id+'-return');
 assert.equal(generated.anchor.offset,20);
 generated.anchor.offset=72;
 const upgraded=importWorldBuilderDocument(JSON.stringify(raw));
 assert.equal(upgraded.areas.find(a=>a.id===id).spawns.find(s=>s.id===generated.id).anchor.offset,20);
 const deliberate=structuredClone(raw);
 deliberate.areas.find(a=>a.id===id).spawns
  .find(s=>s.id===generated.id).id='my-custom-door-return';
 const loaded=importWorldBuilderDocument(JSON.stringify(deliberate));
 assert.equal(loaded.areas.find(a=>a.id===id).spawns
  .find(s=>s.id==='my-custom-door-return').anchor.offset,72,
 'explicit author adjustments must never be migrated by guess');
});
