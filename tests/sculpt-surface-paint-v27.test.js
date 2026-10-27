import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankSculptPreviewScene,serializeSculptPreviewScene,
  importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {createSculptSurface,appendSculptSurfaceStroke,
  removeSculptSurfaceAt,normalizeSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {normalizeWorldSurface} from '../src/world/surface-model.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';

test('V27 painted dirt route is a genuine normalized WorldSurface route, not a ghost ribbon',()=>{
  const blank=createBlankSculptPreviewScene({width:18,height:12});
  const clean=createSculptSurface();
  assert.equal(clean.version,3);
  assert.deepEqual(clean.routes,[]);
  assert.deepEqual(clean.zones,[]);
  assert.equal(blank.surface.routes.length,0);
  assert.equal(blank.surface.zones.length,0);
  const route=appendSculptSurfaceStroke(clean,{materialId:'road.dirt',
    width:56,points:[{x:80,y:80},{x:168,y:90}]});
  assert.equal(route.version,3);
  assert.equal(route.routes.length,1);
  assert.equal(route.routes[0].materialId,'road.dirt');
  assert.equal(route.routes[0].traversalRuleId,'terrain.road');
  assert.deepEqual(route,normalizeWorldSurface(route));
  assert.deepEqual(blank.terrain.levels,Array(18*12).fill(2));
  const gone=removeSculptSurfaceAt(route,{x:120,y:86});
  assert.equal(gone.routes.length,0);
});
test('V27 zone painter uses native material IDs; scene export/import roundtrip is exact',()=>{
  const blank=createBlankSculptPreviewScene({width:20,height:14});
  const route=appendSculptSurfaceStroke(blank.surface,{materialId:'road.dirt',
    points:[{x:56,y:63},{x:168,y:63}],width:42});
  const both=appendSculptSurfaceStroke(route,{materialId:'ground.sand',
    points:[{x:160,y:156}],width:85});
  assert.equal(both.zones.length,1);
  assert.equal(both.zones[0].materialId,'ground.sand');
  assert.equal(both.zones[0].points.length,2,'tap creates valid native path');
  const exported=serializeSculptPreviewScene(blank.terrain,blank.objects,both);
  const loaded=importSculptPreviewScene(exported);
  assert.deepEqual(loaded.surface,both);
  assert.deepEqual(loaded.terrain,blank.terrain);
  assert.deepEqual(loaded.objects,blank.objects);
  assert.equal(loaded.surface.routes.length,1);
  assert.equal(loaded.surface.zones.length,1);
  assert.equal(objectDefinitionCatalogV1.list().length>0,true);
  const noPaint=importSculptPreviewScene(serializeSculptPreviewScene(blank.terrain,blank.objects));
  assert.equal(noPaint.surface.routes.length,0);
  assert.equal(noPaint.surface.zones.length,0);
  assert.equal(JSON.parse(serializeSculptPreviewScene(blank.terrain,blank.objects)).surface,undefined,
    'legacy scene has no newly required surface field');
});
test('V27 imported routes/zones reject unknown material, unsupported river and outside world',()=>{
  const blank=createBlankSculptPreviewScene({width:12,height:9});
  const scene=JSON.parse(serializeSculptPreviewScene(blank.terrain,blank.objects));
  let s=appendSculptSurfaceStroke(createSculptSurface(),{materialId:'ground.snow',
    points:[{x:30,y:40},{x:44,y:40}],width:30});
  scene.surface=s;
  assert.equal(importSculptPreviewScene(scene).surface.zones.length,1);
  scene.surface={...s,zones:[{...s.zones[0],materialId:'arbitrary.binary.asset'}]};
  assert.throws(()=>importSculptPreviewScene(scene),/Peinture/);
  scene.surface={...s,zones:[{...s.zones[0],points:[{x:9999,y:40},{x:9998,y:40}]}]};
  assert.throws(()=>importSculptPreviewScene(scene),/hors/);
  scene.surface={...s,rivers:[{points:[{x:10,y:10},{x:20,y:20}],width:30}]};
  assert.throws(()=>importSculptPreviewScene(scene),/rivière/);
});
test('V27 paint editing is isolated from terrain physics and emits real material layers',()=>{
  const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const render=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
  for(const id of ['mode-surface','surface-palette','surface-action','surface-width',
    'surface-material','surface-undo','surface-redo']){
    assert.equal((page.match(new RegExp('id="'+id+'"','g'))??[]).length,1);
  }
  assert.match(js,/paintSurface:surface,paintImages:surfacePaintImages/);
  assert.match(js,/appendSculptSurfaceStroke/);
  assert.match(render,/sculptPaintByCell/);
  assert.doesNotMatch(js,/new WorldDocument/);
});
