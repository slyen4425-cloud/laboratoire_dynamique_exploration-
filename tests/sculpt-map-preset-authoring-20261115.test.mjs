import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createSculptDecorativeFringeV1,paintSculptDecorativeFringeSurfaceV1,
 normalizeSculptDecorativeFringeV1
} from '../src/world/sculpt-decorative-fringe-v1.js';
import {createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
 serializeWorldBuilderDraft,importWorldBuilderDocument}
 from '../src/builder/world-builder-draft.js';
import {sculptWorldAreaScene,saveSculptWorldArea,
 ensureFreeWorldInitialSpawnV1,placeSculptWorldSpawn,placeSculptWorldPortal}
 from '../src/builder/sculpt-world-area-link.js';
import {pickSculptWorldEditorMarkerV1,markersForSculptWorldArea}
 from '../src/builder/sculpt-world-portal-markers.js';

const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const draft=()=>createBlankWorldBuilderDraft({id:'authoring-regression',width:36*28,height:24*21});

test('north decoration accepts real native texture strokes while gameplay surface and world size stay unchanged',()=>{
 const world=draft(),area=world.areas[0],original=JSON.stringify(world);
 const fringe=createSculptDecorativeFringeV1(area);
 const texture=paintSculptDecorativeFringeSurfaceV1(fringe,area,{
  points:[{x:5*28+14,y:-21*3+10},{x:6*28+14,y:-21*3+10}],
  materialId:'ground.snow',terrainFamilyId:'snow',width:28
 });
 assert.ok(texture.chunks.some(p=>p.row<0&&p.surface?.zones.length>0));
 assert.equal(JSON.stringify(world),original,'editing fringe cannot mutate the source WorldDocument');
 const scene=sculptWorldAreaScene(area);
 const saved=saveSculptWorldArea(world,area.id,{...scene,decorativeFringe:texture});
 const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(saved));
 const loaded=restored.areas[0];
 assert.equal(loaded.width,area.width);assert.equal(loaded.height,area.height);
 assert.deepEqual(loaded.surface,area.surface);
 assert.deepEqual(loaded.spawns,area.spawns);
 assert.deepEqual(loaded.objects,area.objects);
 assert.deepEqual(normalizeSculptDecorativeFringeV1(loaded.decorativeFringe,loaded),loaded.decorativeFringe);
 assert.ok(loaded.decorativeFringe.chunks.some(p=>p.surface?.zones.length));
});

test('outside painter rejects inside gameplay, far outside and malformed points',()=>{
 const world=draft(),area=world.areas[0],fringe=createSculptDecorativeFringeV1(area);
 for(const p of [{x:120,y:100},{x:-28*9,y:10},{x:1,y:NaN}]){
  assert.throws(()=>paintSculptDecorativeFringeSurfaceV1(fringe,area,{
   points:[p],materialId:'ground.snow',width:28
  }));
 }
 const first=paintSculptDecorativeFringeSurfaceV1(fringe,area,{
  points:[{x:40,y:-30}],materialId:'ground.snow',width:28
 });
 const erased=paintSculptDecorativeFringeSurfaceV1(first,area,{
  points:[{x:40,y:-30}],erase:true
 });
 assert.ok(first.chunks.some(p=>p.surface?.zones.length===1));
 assert.ok(erased.chunks.every(p=>!p.surface?.zones.length));
});

test('free world start stays the same ID and can be moved with canonical Spawn command',()=>{
 const before=draft(),stable=ensureFreeWorldInitialSpawnV1(before);
 assert.equal(stable.initialSpawnId,before.initialSpawnId);
 const after=placeSculptWorldSpawn(stable,stable.initialAreaId,stable.initialSpawnId,{x:280,y:189});
 assert.equal(after.initialSpawnId,before.initialSpawnId);
 const spawn=after.areas[0].spawns.find(s=>s.id===after.initialSpawnId);
 assert.equal(spawn.x,280);assert.equal(spawn.y,189);
 assert.equal(before.areas[0].spawns[0].x,504);
});

test('marker touch selection is based only on official portal and spawn coordinates',()=>{
 let w=draft();
 w=addWorldArea(w,{name:'Plaine',width:36*28,height:24*21});
 w=connectWorldAreas(w,{sourceAreaId:w.initialAreaId,
  targetAreaId:w.areas[1].id,returnPortal:true});
 const marks=markersForSculptWorldArea(w,w.initialAreaId,{testing:false});
 const exit=marks.find(m=>m.kind==='exit'),start=marks.find(m=>m.spawnId===w.initialSpawnId&&m.isInitial);
 assert.ok(exit);assert.ok(start);
 assert.equal(pickSculptWorldEditorMarkerV1(w,w.initialAreaId,{x:exit.x,y:exit.y}).portalId,exit.portalId);
 assert.equal(pickSculptWorldEditorMarkerV1(w,w.initialAreaId,{x:start.x,y:start.y}).spawnId,start.spawnId);
 assert.equal(pickSculptWorldEditorMarkerV1(w,w.initialAreaId,{x:-999,y:-999}),null);
});

test('editor keeps one native map renderer, moves presets away from top-left and exposes visible spawn/exit controls',()=>{
 assert.match(source,/appendChild\(\$\('sculpt-map-preset-panel'\)\)/);
 assert.match(html,/body\.world-area-editing #world-area-portal-panel #sculpt-map-preset-panel/);
 assert.match(html,/id="world-area-spawn-select-start"/);
 assert.match(html,/id="world-area-marker-pick"/);
 assert.match(html,/id="world-area-edit-destination"/);
 assert.match(source,/ensureFreeWorldInitialSpawnV1/);
 assert.match(source,/pickSculptWorldEditorMarkerV1/);
 assert.match(source,/paintSculptDecorativeFringeSurfaceV1/);
 assert.match(source,/paintSurface:fringePaintSurface,paintImages:surfacePaintImages/);
 assert.match(source,/const fringePaintSurface=sculptFringeResolvedPaintSurfaceV1\(chunk\.surface,surface/);
 assert.match(source,/if\(navigationTesting\|\|!decorativeFringe\|\|!fringeEditing/);
 assert.match(source,/worldAssembler','1'/);
 assert.doesNotMatch(source.slice(source.indexOf('function drawEditorPlayableLimit('),
   source.indexOf('function drawDecorativeFringeTerrain(')),/localStorage|setItem/);
});

test('a two-tap passage uses ONLY official Portals and Spawns and survives reload',()=>{
 const source=draft();
 const withTarget=addWorldArea(source,{name:'Plaine',width:36*28,height:24*21});
 const target=withTarget.areas.find(a=>a.id!==withTarget.initialAreaId);
 const position={x:5*28,y:9*21};
 let linked=connectWorldAreas(withTarget,{
  sourceAreaId:withTarget.initialAreaId,targetAreaId:target.id,returnPortal:true
 });
 assert.equal(linked.portals.length,2,'forward and return use the canonical link helper');
 const portal=linked.portals.find(p=>p.sourceAreaId===withTarget.initialAreaId&&
   p.targetAreaId===target.id);
 assert.ok(portal);
 linked=placeSculptWorldPortal(linked,portal.id,position);
 const after=linked.portals.find(p=>p.id===portal.id);
 assert.equal(after.trigger.x,position.x);
 assert.equal(after.trigger.y,position.y);
 const originalStart=target.spawns[0];
 const linkedArrivalId=portal.targetSpawnId;
 assert.notEqual(linkedArrivalId,originalStart.id,
   'new portals now own separate arrival Spawns');
 linked=placeSculptWorldSpawn(linked,target.id,linkedArrivalId,{x:10*28,y:12*21});
 const unchangedId=linked.portals.find(p=>p.id===portal.id).targetSpawnId;
 assert.equal(unchangedId,linkedArrivalId,'the Portal keeps its own landing Spawn');
 assert.deepEqual(target.spawns[0],originalStart,
   'the old map Spawn must remain untouched');
 const relinked=connectWorldAreas(linked,{
  sourceAreaId:withTarget.initialAreaId,targetAreaId:target.id,returnPortal:true
 });
 assert.equal(relinked.portals.length,2,'recreating cannot duplicate portals');
 const saved=importWorldBuilderDocument(serializeWorldBuilderDraft(relinked));
 assert.equal(saved.portals.length,2);
 assert.equal(saved.areas.find(a=>a.id===target.id).spawns.find(p=>p.id===linkedArrivalId).x,280);
 assert.deepEqual(saved.areas.find(a=>a.id===target.id).spawns.find(p=>p.id===originalStart.id),
   originalStart,'legacy default Spawn remains unchanged');
 assert.equal(saved.portals.find(p=>p.id===portal.id).trigger.y,position.y);
});

test('passage UI offers creation and destination edits without exposing numeric controls by default',()=>{
 assert.match(html,/id="world-area-passages-target"/);
 assert.match(html,/id="world-area-passages-create"/);
 assert.match(html,/<details id="world-area-passages-advanced"/);
 const start=html.indexOf('<details id="world-area-passages-advanced"');
 const pos=html.indexOf('id="world-area-portal-x"');
 assert.ok(start>=0&&pos>start);
 assert.match(source,/sculptWorldPortalPlacement='new-portal'/);
 assert.match(source,/connectWorldAreas\(sculptWorldDraft,/);
 assert.match(source,/placeSculptWorldPortal\(next,portal\.id,position\)/);
 assert.match(source,/searchParams\.set\('arrivalSpawnId',portal\.targetSpawnId\)/);
 assert.match(source,/sculptWorldPortalPlacement='spawn'/);
 assert.match(source,/world-area-portal-panel'\)\.open=false/);
});

test('Objets owns one visible authoring UI for Depart / Entree / Sortie, without coordinates',()=>{
 const start=html.indexOf('<details id="object-waypoints-panel"');
 const objectEnd=html.indexOf('<button type="button" id="actor-open">',start);
 assert.ok(start>0&&objectEnd>start);
 const compact=html.slice(start,objectEnd);
 assert.match(compact,/id="object-waypoint-select"/);
 assert.match(compact,/id="object-waypoint-place"/);
 assert.match(compact,/id="object-waypoint-target"/);
 assert.match(compact,/id="object-waypoint-create-button"/);
 assert.match(compact,/id="object-waypoint-destination"/);
 assert.doesNotMatch(compact,/Sortie X|Position X|Position Y|Sortie Y|type="number"/);
 assert.match(source,/panel\.hidden=true;/);
 assert.match(source,/syncObjectWaypoints\(\)/);
 assert.match(source,/selectedWaypointKey=waypointKey\(marker\)/);
 assert.match(source,/function pickedVisibleWaypoint\(point\)/);
 assert.match(source,/waypointDrag=\{pointerId:event\.pointerId/);
 assert.match(source,/if\(waypointDrag\)\{/);
 assert.match(source,/placeSculptWorldPortal\(\s*sculptWorldDraft,drag\.marker\.portalId,point\)/);
 assert.match(source,/placeSculptWorldSpawn\(\s*sculptWorldDraft,sculptWorldAreaId,drag\.marker\.spawnId,point\)/);
 assert.match(source,/event\.type!=='pointercancel'/);
});
