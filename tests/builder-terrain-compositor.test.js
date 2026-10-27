import test from 'node:test';
import assert from 'node:assert/strict';
import { createBuilderTerrainCompositor, partitionActiveSurface } from '../src/builder/builder-terrain-compositor.js';
import { readFile } from 'node:fs/promises';

const surface = Object.freeze({
 baseMaterialId:'grass.forest',
 zones:[{id:'z1',materialId:'ground.sand',width:100,points:[{x:20,y:20},{x:60,y:70}]},
        {id:'z2',materialId:'ground.snow',width:100,points:[{x:80,y:20},{x:120,y:70}]}],
 routes:[{id:'road1',width:70,materialId:'path.dirt',points:[{x:0,y:0},{x:200,y:200}]}],
 rivers:[{id:'river1',width:80,materialId:'water.river',points:[{x:50,y:0},{x:50,y:200}]}]
});
function dummyContext() {
 return { calls:[], save(){}, restore(){},setTransform(){},clearRect(){},
   drawImage(...args){this.calls.push(args)}, get globalAlpha(){return 1},
   set globalAlpha(x) {} };
}
function fixture(){
 const renders=[];
 const factory=(w,h)=>({width:w,height:h,getContext:()=>dummyContext()});
 const renderer={draw(ctx,args){
   renders.push({includeBase:args.includeBase, zones:args.surface.zones.map(x=>x.id),
      routes:args.surface.routes.map(x=>x.id),rivers:args.surface.rivers.map(x=>x.id)});
 }};
 const compositor=createBuilderTerrainCompositor({canvasFactory:factory});
 const mainCtx=dummyContext();
 const draw=(opts={})=>compositor.draw({
  ctx:mainCtx,renderer, surface:opts.surface??surface, surfaceKey:opts.surfaceKey??'unchanged',
  areaKey:opts.areaKey??'outside', areaClip(){},active:opts.active??null,
  zoom:1,dpr:1, canvasWidth:500,canvasHeight:300,
  camera:opts.camera??{x:0,y:0},
  viewport:{width:500,height:300}
 });
 return {renders,draw,mainCtx,compositor};
}
test('partition retains canonical terrain -> roads -> rivers stacking around active stroke',()=>{
 for (const [kind,id,pre,post] of [
   ['terrain','z1',[],['z2','road1','river1']],
   ['route','road1',['z1','z2'],['river1']],
   ['river','river1',['z1','z2','road1'],[]]
 ]) {
  const result=partitionActiveSurface(surface,{kind,id});
  const ids=obj=>[...obj.zones,...obj.routes,...obj.rivers].map(x=>x.id);
  assert.deepEqual(ids(result.before),pre);
  assert.deepEqual(ids(result.active),[id]);
  assert.deepEqual(ids(result.after),post);
 }
});
test('unchanged terrain repaints via cached raster even when other editor UI redraws',()=>{
 const f=fixture();
 f.draw();f.draw();f.draw();
 assert.equal(f.renders.length,1);
 assert.equal(f.mainCtx.calls.length,3);
 f.draw({camera:{x:40,y:0}}); // pan within overscan, no rasterization
 assert.equal(f.renders.length,1);
 f.draw({camera:{x:500,y:0}}); // beyond overscan
 assert.equal(f.renders.length,2);
 f.draw({surfaceKey:'edited'}); // terrain edit forces rebuild
 assert.equal(f.renders.length,3);
 f.draw({areaKey:'new-boundary'}); // clip change forces rebuild
 assert.equal(f.renders.length,4);
});
test('active brush caches both committed layers, only active stroke redrawn per frame',()=>{
 const f=fixture(), active={kind:'terrain',id:'z2'};
 f.draw({active});
 let edited={...surface,zones:[surface.zones[0],{...surface.zones[1],points:[...surface.zones[1].points,{x:220,y:180}]}]};
 f.draw({active,surface:edited});
 assert.deepEqual(f.renders.map(x=>x.zones.join(',')), ['z1','', 'z2', 'z2']);
 assert.equal(f.renders.filter(x=>x.includeBase).length,1);
 assert.equal(f.renders.filter(x=>x.rivers.includes('river1')).length,1);
 f.draw({surface:edited,surfaceKey:'completed'}); // finish rebuild once
 assert.equal(f.renders.length,5);
});
test('Builder preview hands renderer to a compositor while runtime defaults to original renderer',async()=>{
 const main=await readFile(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
 const renderer=await readFile(new URL('../src/render/surface-renderer.js',import.meta.url),'utf8');
 assert.match(main,/terrainCompositor\.draw\(/);
 assert.match(main,/createBuilderTerrainCompositor/);
 assert.match(renderer,/includeBase = true/);
 assert.match(renderer,/if \(includeBase\)/);
});

import { createBlankWorldBuilderDraft,addSurfacePath,appendSurfacePathPoint } from '../src/builder/world-builder-draft.js';
test('brush samples copy only edited path and preserve immutability of prior worlds',()=>{
  let draft=createBlankWorldBuilderDraft();
  draft=addSurfacePath(draft,draft.initialAreaId,'terrain',{
    width:180,terrainFamilyId:'forest',materialId:'grass.forest',
    points:[{x:2,y:3},{x:4,y:5}]
  });
  const oldArea=draft.areas[0];
  const oldZones=oldArea.surface.zones;
  const oldPath=oldZones[0];
  const oldOthers={...draft,events:draft.events,objects:oldArea.objects};
  const newDraft=appendSurfacePathPoint(draft,draft.initialAreaId,'terrain',oldPath.id,{x:80,y:90});
  assert.notEqual(newDraft,draft);
  assert.notEqual(newDraft.areas, draft.areas);
  assert.notEqual(newDraft.areas[0], oldArea);
  assert.notEqual(newDraft.areas[0].surface,oldArea.surface);
  assert.notEqual(newDraft.areas[0].surface.zones,oldZones);
  assert.notEqual(newDraft.areas[0].surface.zones[0],oldPath);
  assert.equal(oldPath.points.length,2);
  assert.equal(newDraft.areas[0].surface.zones[0].points.length,3);
  assert.deepEqual(newDraft.areas[0].surface.zones[0].points[2],{x:80,y:90});
  // Old unrelated arrays remain shared, not JSON-serialized on every brush point.
  assert.equal(newDraft.events,oldOthers.events);
  assert.equal(newDraft.areas[0].objects,oldOthers.objects);
  assert.equal(newDraft.areas[0].surface.routes,oldArea.surface.routes);
});
