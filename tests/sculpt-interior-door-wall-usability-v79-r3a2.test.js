import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {normalizePortal,portalReferencesAreValid} from '../src/world/portal-model.js';
import {appendInteriorWall,snapInteriorWallPoint} from '../src/world/interior-wall-model.js';
import {createSculptInteriorArea,updateSculptInteriorDoor,serializeSculptInteriors,
  importSculptInteriors,sculptInteriorPortalDocument,sculptInteriorTransition}
  from '../src/world/sculpt-interior-area-link.js';

const fixture=()=>{
  const objects=appendSculptPreviewObject([],{definitionId:
    'objectdef.building.house.fantasy_wood_stone.01',x:280,y:260,scale:.6});
  const building=resolveWorldObjectPlacements(objects)[0];
  return {objects,entry:createSculptInteriorArea(building,objects)};
};
test('R3A2 : door width is visual only, 58% default, and true Portal point remains canonical',()=>{
  const {objects,entry}=fixture();
  assert.equal(entry.exitPortal.visual.scale,.58);
  assert.equal(entry.exitPortal.trigger.kind,'point');
  const resized=updateSculptInteriorDoor(entry,{scale:.4,x:160,y:212});
  assert.equal(resized.exitPortal.visual.scale,.4);
  assert.equal(resized.exitPortal.trigger.x,160);
  assert.equal(resized.exitPortal.trigger.y,212);
  assert.equal(resized.area.spawns.find(s=>s.id==='entrance').x,160);
  assert.ok(resized.area.spawns.find(s=>s.id==='entrance').y<212);
  assert.equal(resized.entryPortal.trigger.kind,'object-anchor');
  assert.deepEqual(resized.entryPortal,entry.entryPortal);
  const doc=sculptInteriorPortalDocument(objects,[resized]);
  assert.ok(portalReferencesAreValid(doc.areas,resized.exitPortal));
  assert.ok(portalReferencesAreValid(doc.areas,resized.entryPortal));
  assert.equal(sculptInteriorTransition(objects,[resized],resized.area.id,
    {x:160,y:212}).currentAreaId,'sculpt-exterior');
  assert.equal(sculptInteriorTransition(objects,[resized],resized.area.id,
    {x:250,y:250}),null);
});
test('R3A2 : position and scale roundtrip, keep walls and never duplicate building Portal',()=>{
  const {objects,entry}=fixture();
  const moved=updateSculptInteriorDoor(entry,{x:180,y:223,scale:.75});
  const original=JSON.parse(JSON.stringify(serializeSculptInteriors([moved])));
  const restored=importSculptInteriors(original,objects)[0];
  assert.equal(restored.exitPortal.trigger.x,180);
  assert.equal(restored.exitPortal.trigger.y,223);
  assert.equal(restored.exitPortal.visual.scale,.75);
  assert.equal(restored.area.spawns[0].x,180);
  assert.equal(restored.entryPortal.id,moved.entryPortal.id);
  assert.equal(restored.buildingId,moved.buildingId);
  assert.throws(()=>importSculptInteriors([{
    ...original[0],exitPortal:{...original[0].exitPortal,
      trigger:{kind:'point',x:9999,y:9999,radius:32}}
  }],objects),/porte invalide/);
});
test('R3A2 : endpoint and grid snapping, orthogonal or diagonals, bounded floor',()=>{
  const walls=appendInteriorWall([],{a:{x:28,y:70},b:{x:168,y:70}});
  assert.deepEqual(snapInteriorWallPoint({x:29,y:73},walls),
    {x:28,y:70});
  const horizontal=snapInteriorWallPoint({x:219,y:124},walls,{
    from:{x:70,y:70}});
  assert.equal(horizontal.y,70);
  const free=snapInteriorWallPoint({x:219,y:124},walls,{
    from:{x:70,y:70},orthogonal:false});
  assert.notEqual(free.y,70);
  assert.deepEqual(snapInteriorWallPoint({x:-20,y:9999},[],{width:504,height:294}),
    {x:7,y:287});
});
test('R3A2 : original Portal visuals without size remain backward compatible',()=>{
  const portal=normalizePortal({id:'a',sourceAreaId:'outside',
    targetAreaId:'inside',targetSpawnId:'spawn',
    trigger:{kind:'point',x:30,y:30,radius:24},
    visual:{visible:true,marker:'entry',label:'Entrer'}});
  assert.equal('scale' in portal.visual,false);
});
test('R3A2 : touch/pointer and scale UI read canonical Portal and WorldArea, camera untouched',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const renderer=readFileSync(new URL('../src/render/sculpt-interior-walls.js',import.meta.url),'utf8');
  assert.match(html,/id="interior-door-move"/);
  assert.match(html,/id="interior-door-scale"/);
  assert.match(html,/id="interior-wall-diagonal"/);
  assert.match(main,/function interiorWallPointFromEvent/);
  assert.match(main,/function commitInteriorDoor/);
  assert.match(main,/interiorWallGesture=.*pointerId/);
  assert.match(main,/function cameraView\(\)/);
  assert.match(renderer,/ctx\.translate\(x,baseY\);ctx\.scale\(size,size\)/);
});
