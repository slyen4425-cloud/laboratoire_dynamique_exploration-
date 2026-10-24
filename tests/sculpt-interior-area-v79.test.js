import test from 'node:test';
import assert from 'node:assert/strict';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {
  SCULPT_EXTERIOR_AREA_ID,SCULPT_INTERIOR_SIZE,
  createSculptInteriorArea,updateSculptInterior,serializeSculptInteriors,
  importSculptInteriors,sculptInteriorPortalDocument,sculptInteriorTransition
} from '../src/world/sculpt-interior-area-link.js';
import {applySculptStroke,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {applyPortalTransition,portalReferencesAreValid} from '../src/world/portal-model.js';
import {readFileSync} from 'node:fs';

const buildingObjects=()=>appendSculptPreviewObject([],{
  definitionId:'objectdef.building.house.fantasy_wood_stone.01',
  x:280,y:260,scale:.60
});
const setup=()=>{const objects=buildingObjects();
  const building=resolveWorldObjectPlacements(objects)[0];
  return {objects,building,entry:createSculptInteriorArea(building,objects)};};

test('V79 creates exactly one independent heightfield inside canonical WorldArea with two valid Portals',()=>{
  const {objects,building,entry}=setup();
  assert.equal(building.kind,'building');assert.ok(entry);
  assert.equal(entry.terrain.width,SCULPT_INTERIOR_SIZE.width);
  assert.equal(entry.terrain.height,SCULPT_INTERIOR_SIZE.height);
  assert.equal(entry.area.kind,'interior');
  assert.equal(entry.entryPortal.trigger.kind,'object-anchor');
  assert.equal(entry.entryPortal.sourceAreaId,SCULPT_EXTERIOR_AREA_ID);
  assert.equal(entry.exitPortal.sourceAreaId,entry.area.id);
  const doc=sculptInteriorPortalDocument(objects,[entry]);
  assert.ok(portalReferencesAreValid(doc.areas,entry.entryPortal));
  assert.ok(portalReferencesAreValid(doc.areas,entry.exitPortal));
  assert.equal(doc.areas.length,2);
  assert.equal(doc.portals.length,2);
  assert.equal(entry.area.encounters.randomEnabled,false);
  assert.equal(doc.areas[0].objects.length,1);
  assert.equal(entry.area.spawns[0].id,'entrance');
});

test('V79 entry/exit obey existing Portal controller and real door anchor',async()=>{
  const {objects,entry}=setup(),doc=sculptInteriorPortalDocument(objects,[entry]);
  const entrance=applyPortalTransition(doc,{currentAreaId:SCULPT_EXTERIOR_AREA_ID},entry.entryPortal);
  assert.equal(entrance.currentAreaId,entry.area.id);
  const exit=applyPortalTransition(doc,{currentAreaId:entry.area.id},entry.exitPortal);
  assert.equal(exit.currentAreaId,SCULPT_EXTERIOR_AREA_ID);
  // The trigger is NOT the icon center nor a duplicated world-position cache.
  const {resolvePortalTriggerPoint}=await import('../src/world/portal-model.js');
  const foot=resolvePortalTriggerPoint(doc.areas,entry.entryPortal);
  assert.equal(sculptInteriorTransition(objects,[entry],SCULPT_EXTERIOR_AREA_ID,foot)?.currentAreaId,entry.area.id);
  const exitPoint=resolvePortalTriggerPoint(doc.areas,entry.exitPortal);
  assert.equal(sculptInteriorTransition(objects,[entry],entry.area.id,exitPoint)?.currentAreaId,SCULPT_EXTERIOR_AREA_ID);
  assert.equal(sculptInteriorTransition(objects,[entry],SCULPT_EXTERIOR_AREA_ID,{x:0,y:0}),null);
});

test('V79 independent room sculpt retains heights across export/import, old exteriors remain unchanged',()=>{
  const {objects,entry}=setup();
  const before=serializeSculptTerrain(entry.terrain);
  const terrain=applySculptStroke(entry.terrain,{mode:'raise',
    points:[{x:8,y:5}],radius:2,strength:1,target:3});
  assert.notEqual(terrain,entry.terrain);
  assert.notEqual(serializeSculptTerrain(terrain),before);
  const edited=updateSculptInterior(entry,{terrain});
  const saved=JSON.parse(JSON.stringify(serializeSculptInteriors([edited])));
  const imported=importSculptInteriors(saved,objects);
  assert.equal(imported.length,1);
  assert.equal(serializeSculptTerrain(imported[0].terrain),serializeSculptTerrain(terrain));
  assert.equal(imported[0].buildingId,objects[0].id);
  assert.equal(entry.terrain.levels.every(n=>n===0),true);
  assert.deepEqual(importSculptInteriors([],objects),[]);
});

test('V79 reject dangling building, forged IDs, duplicate interiors without dropping user data',()=>{
  const {objects,entry}=setup();
  const data=serializeSculptInteriors([entry])[0];
  assert.throws(()=>importSculptInteriors([data],[]),/bâtiment absent/);
  assert.throws(()=>importSculptInteriors([data,data],objects),/dupliqué/);
  assert.throws(()=>importSculptInteriors([{...data,area:{...data.area,id:'fake'}}],objects),/raccord/);
  assert.throws(()=>importSculptInteriors([{...data,terrain:{...data.terrain,width:100}}],objects));
});

test('V79 UI preserves exterior scene schema and offers explicit editing and 35–90 degree room camera',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/id="object-open-interior"/);
  assert.match(html,/id="interior-area-return"/);
  assert.match(html,/id="interior-camera-angle" min="35" max="90"/);
  assert.match(html,/id="navigation-area-door"/);
  assert.match(main,/createSculptInteriorArea\(resolved,placedObjects\)/);
  assert.match(main,/sculptInteriorTransition\(/);
  assert.match(main,/drawSculptInteriorWalls\(ctx,terrain/);
  assert.match(main,/scene\.interiors=serializeSculptInteriors\(entries\)/);
  assert.match(main,/importSculptInteriors\(raw\.interiors\?\?\[\],imported\.objects\)/);
  assert.match(main,/sculptCameraGameView\(Number\(\$\('interior-camera-angle'\)\.value\)\)/);
});
