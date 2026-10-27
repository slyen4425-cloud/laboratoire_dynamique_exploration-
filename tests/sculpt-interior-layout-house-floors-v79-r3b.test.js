import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {isBlocked} from '../src/core/collision.js';
import {portalReferencesAreValid} from '../src/world/portal-model.js';
import {sculptInteriorBoundary,sculptInteriorShapeId,resizeSculptInterior}
  from '../src/world/sculpt-interior-layout.js';
import {createSculptInteriorArea,createSculptUpperFloor,
  createSculptInteriorTemplate,applySculptInteriorTemplate,
  serializeSculptInteriors,importSculptInteriors,
  sculptInteriorPortalDocument,sculptInteriorTransition,
  sculptInteriorAvailablePortal} from '../src/world/sculpt-interior-area-link.js';
const houses=()=>{
  let objects=appendSculptPreviewObject([],{
    definitionId:'objectdef.building.house.fantasy_wood_stone.01',
    x:280,y:260,scale:.6
  });
  objects=appendSculptPreviewObject(objects,{
    definitionId:'objectdef.building.house.fantasy_wood_stone.01',
    x:440,y:260,scale:.6
  });
  return {objects,buildings:resolveWorldObjectPlacements(objects)};
};
test('R3B shape presets use canonical WorldArea.boundary and resize data',()=>{
  const {objects,buildings}=houses();
  const entry=createSculptInteriorArea(buildings[0],objects);
  for(const kind of ['rectangle','l','t','cross']){
    const updated=resizeSculptInterior(entry,{width:24,height:18,shape:kind});
    assert.equal(updated.area.id,entry.area.id);
    assert.equal(updated.area.width,24*28);
    assert.equal(updated.area.height,18*21);
    assert.equal(updated.terrain.levels.length,24*18);
    assert.equal(sculptInteriorShapeId(updated.area),kind);
    assert.deepEqual(updated.area.boundary,sculptInteriorBoundary(kind));
    assert.equal(updated.entryPortal.id,entry.entryPortal.id);
    assert.equal(updated.exitPortal.id,entry.exitPortal.id);
  }
  const l=resizeSculptInterior(entry,{shape:'l'});
  assert.equal(isBlocked(l.area,{radius:4,locomotion:{modes:['ground']}},470,20),true);
  assert.equal(isBlocked(l.area,{radius:4,locomotion:{modes:['ground']}},200,200),false);
  assert.throws(()=>resizeSculptInterior(entry,{width:7}),/Dimensions/);
});
test('R3B assigning an existing named room creates a private copy for each house',()=>{
  const {objects,buildings}=houses();
  const room=resizeSculptInterior(createSculptInteriorArea(buildings[0],objects),
    {width:30,height:20,shape:'t'});
  const template=createSculptInteriorTemplate(room,{id:'interior-template-1',
    name:'Grande salle de donjon'});
  assert.equal(template.terrain.width,30);
  assert.equal(template.boundary.kind,'polygon');
  assert.equal('entryPortal' in template,false);
  const house2=createSculptInteriorArea(buildings[1],objects);
  const selected=applySculptInteriorTemplate(house2,template);
  assert.equal(selected.terrain.width,30);
  assert.equal(selected.area.width,840);
  assert.deepEqual(selected.area.boundary,room.area.boundary);
  assert.equal(selected.entryPortal.trigger.objectId,house2.entryPortal.trigger.objectId);
  assert.notEqual(selected.entryPortal.id,room.entryPortal.id);
  assert.equal(selected.buildingId,house2.buildingId);
  const roundtrip=importSculptInteriors(JSON.parse(JSON.stringify(
    serializeSculptInteriors([room,selected]))),objects);
  assert.deepEqual(roundtrip[1].area.boundary,selected.area.boundary);
});
test('R3B multi-floor WorldArea and Portal navigation and roundtrip',()=>{
  const {objects,buildings}=houses();
  const ground=resizeSculptInterior(createSculptInteriorArea(buildings[0],objects),
    {width:23,height:17,shape:'rectangle'});
  const result1=createSculptUpperFloor(ground);
  const result2=createSculptUpperFloor(result1.upper);
  const entries=[result1.below,result2.below,result2.upper];
  const doc=sculptInteriorPortalDocument(objects,entries);
  assert.equal(doc.areas.length,4);
  assert.equal(doc.portals.length,6);
  assert.equal(doc.areas[0].spawns.length,1);
  assert.deepEqual(entries.map(x=>x.floorIndex),[0,1,2]);
  for(const portal of doc.portals)assert.equal(portalReferencesAreValid(doc.areas,portal),true,
    'orphan '+portal.id);
  const up=result1.upper.entryPortal.trigger;
  const goingUp=sculptInteriorTransition(objects,entries,entries[0].area.id,{x:up.x,y:up.y});
  assert.equal(goingUp.currentAreaId,entries[1].area.id);
  const down=entries[1].exitPortal.trigger;
  assert.match(sculptInteriorAvailablePortal(objects,entries,entries[1].area.id,
    {x:down.x,y:down.y}).visual.label,/Descendre/);
  assert.equal(sculptInteriorTransition(objects,entries,entries[1].area.id,
    {x:down.x,y:down.y}).currentAreaId,entries[0].area.id);
  const stored=JSON.parse(JSON.stringify(serializeSculptInteriors(entries)));
  const restored=importSculptInteriors(stored,objects);
  assert.deepEqual(restored.map(x=>x.floorIndex),[0,1,2]);
  const restoredDoc=sculptInteriorPortalDocument(objects,restored);
  for(const portal of restoredDoc.portals)
    assert.equal(portalReferencesAreValid(restoredDoc.areas,portal),true);
  assert.throws(()=>importSculptInteriors([stored[2]],objects),/niveau précédent/);
});
test('R3B editor UI hooks are present for linking house and multi-floor size/shape',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  for(const id of ['object-interior-template','interior-shape','interior-width','interior-height',
    'interior-layout-apply','interior-level-select','interior-level-add'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(main,/applySculptInteriorTemplate\(entry,wanted\)/);
  assert.match(main,/createSculptUpperFloor\(fresh\)/);
  assert.match(main,/boundary:current\?\.area\.boundary/);
});
