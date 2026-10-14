import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTerrainRasterCompositor } from '../src/render/terrain-raster-compositor.js';

function context() {
  return {
    drawCalls: 0,
    save(){}, restore(){}, setTransform(){}, clearRect(){}, clip(){},
    drawImage(){ this.drawCalls++; }
  };
}

function scene() {
  const calls=[];
  const factory=(width,height)=>({
    width,height,
    getContext(){return context();}
  });
  const cache=createTerrainRasterCompositor({canvasFactory:factory});
  const screen=context();
  const renderer={draw(_ctx,{surface}) { calls.push(surface.zones.length); }};
  const surface={baseMaterialId:'grass.forest',zones:Array.from({length:20},(_,i)=>({
    id:'zone'+i,width:140,materialId:'ground.sand',points:[{x:i,y:i},{x:i+8,y:i+9}]
  })),routes:[],rivers:[]};
  const draw=(opt={})=>cache.draw({
    ctx:screen, renderer,
    surface:opt.surface||surface,surfaceKey:opt.surfaceKey||'same',
    areaKey:opt.areaKey||'area-one',areaClip(){},
    zoom:1,dpr:2,canvasWidth:400,canvasHeight:300,
    camera:opt.camera||{x:100,y:80},
    viewport:{width:400,height:300}
  });
  return {calls,screen,cache,draw};
}
test('runtime terrain cache prevents full 20-layer rasterization on every frame',()=>{
  const {draw,calls,screen}=scene();
  for(let i=0;i<120;i++)draw();
  assert.deepEqual(calls,[20]);
  assert.equal(screen.drawCalls,120);
});
test('moving within guard band does not rebake; moving beyond guard band does',()=>{
  const s=scene();
  s.draw();
  for(let x=110;x<=140;x+=10)s.draw({camera:{x,y:80}});
  assert.equal(s.calls.length,1);
  s.draw({camera:{x:360,y:80}});
  assert.equal(s.calls.length,2);
  s.draw({areaKey:'another-area',camera:{x:360,y:80}});
  assert.equal(s.calls.length,3);
  s.draw({areaKey:'another-area',surfaceKey:'terrain-changed',camera:{x:360,y:80}});
  assert.equal(s.calls.length,4);
});
test('runtime scene renders its original actors and objects separately above cached ground',async()=>{
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const shared=await readFile(new URL('../src/render/terrain-raster-compositor.js',import.meta.url),'utf8');
  assert.match(main,/createTerrainRasterCompositor/);
  assert.match(main,/terrainCompositor\.draw\(/);
  assert.match(main,/surface: area\.surface/);
  assert.doesNotMatch(main,/function drawGround\(\)\s*\{[\s\S]*?surfaceRenderer\.draw\(/);
  assert.match(main,/drawGround\(\);[\s\S]*worldObjectRenderer\.draw\([\s\S]*mapActorRenderer\.draw\(/);
  assert.match(shared,/createTerrainRasterCompositor/);
  assert.match(main,/terrainCompositor\.clear\(\)/);
});
test('Builder imports the shared raster engine with unchanged public API',async()=>{
  const facade=await import('../src/builder/builder-terrain-compositor.js');
  const shared=await import('../src/render/terrain-raster-compositor.js');
  assert.equal(facade.createBuilderTerrainCompositor,shared.createTerrainRasterCompositor);
  assert.equal(typeof facade.partitionActiveSurface,'function');
});
