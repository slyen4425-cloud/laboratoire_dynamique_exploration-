import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankSculptPreviewScene,serializeSculptPreviewScene,importSculptPreviewScene}
  from '../src/world/sculpt-scene-preview.js';
import {appendSculptSurfaceStroke,createSculptSurface,normalizeSculptSurface,
  removeSculptSurfaceAt} from '../src/world/sculpt-surface-paint.js';
import {normalizeWorldSurface} from '../src/world/surface-model.js';
import {squareSurfaceStrokeContainsPoint,squareSurfaceStrokePolygon,
  drawSquareSurfaceStrokePath} from '../src/world/surface-brush-geometry.js';
import {surfaceFeatureContainsPoint,resolveBaseSurfaceFeature}
  from '../src/core/surface-traversal.js';
import {resolveTerrainFamilyAtPoint}
  from '../src/encounters/terrain-family-resolver.js';

function paint(brushShape,materialId='grass.forest.flowers'){
  return appendSculptSurfaceStroke(createSculptSurface(),{
    brushShape,materialId,terrainFamilyId:'new-author-grass',
    points:[{x:100,y:100}],width:60
  });
}
test('round legacy and square texture brushes differ at corners but share WorldSurface v3',()=>{
 const round=paint('round'),square=paint('square');
 assert.equal(round.zones[0].brushShape,undefined);
 assert.equal(square.zones[0].brushShape,'square');
 assert.equal(square.version,3);
 assert.deepEqual(square,normalizeWorldSurface(square));
 assert.deepEqual(round,normalizeWorldSurface(round));
 assert.equal(surfaceFeatureContainsPoint(round.zones[0],128,128),false);
 assert.equal(surfaceFeatureContainsPoint(square.zones[0],128,128),true);
 assert.equal(surfaceFeatureContainsPoint(square.zones[0],131,131),false);
 assert.equal(squareSurfaceStrokeContainsPoint(square.zones[0].points,130,130,30),true);
 assert.equal(resolveTerrainFamilyAtPoint(round,128,128).featureKind,'base');
 assert.equal(resolveTerrainFamilyAtPoint(square,128,128).featureKind,'zone');
 assert.equal(resolveTerrainFamilyAtPoint(square,128,128).terrainFamilyId,'new-author-grass');
 assert.equal(resolveBaseSurfaceFeature({surface:square},128,128).id,square.zones[0].id);
 assert.equal(resolveBaseSurfaceFeature({surface:round},128,128).kind,'base');
});

test('square paint stroke really sweeps square geometry along segments including diagonals',()=>{
 const points=[{x:20,y:20},{x:80,y:80}];
 assert.equal(squareSurfaceStrokeContainsPoint(points,20,29,10),true);
 assert.equal(squareSurfaceStrokeContainsPoint(points,45,45,10),true);
 assert.equal(squareSurfaceStrokeContainsPoint(points,45,66,10),false);
 const polygon=squareSurfaceStrokePolygon(points[0],points[1],10);
 assert.equal(Math.min(...polygon.map(p=>p.x)),10);
 assert.equal(Math.max(...polygon.map(p=>p.x)),90);
 assert.equal(Math.min(...polygon.map(p=>p.y)),10);
 assert.equal(Math.max(...polygon.map(p=>p.y)),90);
 let vertices=0,closed=0;
 const ctx={beginPath(){},moveTo(){vertices++},lineTo(){vertices++},closePath(){closed++}};
 assert.equal(drawSquareSurfaceStrokePath(ctx,points,20),true);
 assert.ok(vertices>=4);assert.equal(closed,1);
});

test('square texture survives real scene export/import and erase; old worlds remain round',()=>{
 const blank=createBlankSculptPreviewScene({width:20,height:18});
 let surface=appendSculptSurfaceStroke(blank.surface,{
   materialId:'ground.snow',terrainFamilyId:'snow',brushShape:'square',
   points:[{x:82,y:103},{x:110,y:103}],width:28
 });
 surface=appendSculptSurfaceStroke(surface,{materialId:'road.dirt',brushShape:'square',
   points:[{x:72,y:70},{x:145,y:105}],width:28});
 const snap=serializeSculptPreviewScene(blank.terrain,blank.objects,surface);
 const reloaded=importSculptPreviewScene(snap);
 assert.deepEqual(reloaded.surface,surface);
 assert.equal(reloaded.surface.zones[0].brushShape,'square');
 assert.equal(reloaded.surface.routes[0].brushShape,'square');
 assert.equal(removeSculptSurfaceAt(surface,{x:83,y:118}).zones.length,0);
 const legacy=appendSculptSurfaceStroke(createSculptSurface(),{
   materialId:'ground.sand',points:[{x:50,y:50},{x:70,y:70}],width:30});
 assert.equal(legacy.zones[0].brushShape,undefined);
 assert.equal(normalizeSculptSurface(legacy).zones[0].brushShape,undefined);
 const invalid={...surface,zones:[{...surface.zones[0],brushShape:'triangle'}]};
 assert.throws(()=>normalizeSculptSurface(invalid),/Peinture/);
});

test('UI, renderer, 2D painter and navigation use the same square surface contract',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const painter=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 const flat=readFileSync(new URL('../src/render/surface-renderer.js',import.meta.url),'utf8');
 assert.equal((html.match(/id="surface-brush-shape"/g)??[]).length,1);
 assert.match(html,/<option value="round">◯ Rond<\/option>/);
 assert.match(html,/<option value="square">▦ Carré plein<\/option>/);
 assert.match(editor,/brushShape:\$\('surface-brush-shape'\)\.value/);
 assert.match(editor,/drawSquareSurfaceStrokePath\(ctx,projected,width\)/);
 assert.match(painter,/drawSquareSurfaceStrokePath\(ctx,feature\.points,feature\.width/);
 assert.match(flat,/drawSquareSurfaceStrokePath\(ctx,item\.points,width/);
 assert.match(flat,/if\(item\.brushShape==='square'\)/);
});
