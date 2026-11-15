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
 ensureFreeWorldInitialSpawnV1,placeSculptWorldSpawn}
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
 const exit=marks.find(m=>m.kind==='exit'),start=marks.find(m=>m.kind==='start');
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
 assert.match(source,/paintSurface:chunk\.surface\?\?null/);
 assert.match(source,/if\(navigationTesting\|\|!decorativeFringe\|\|!fringeEditing/);
 assert.match(source,/worldAssembler','1'/);
 assert.doesNotMatch(source.slice(source.indexOf('function drawEditorPlayableLimit('),
   source.indexOf('function drawDecorativeFringeTerrain(')),/localStorage|setItem/);
});
