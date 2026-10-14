import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createTerrainTileCache
} from '../src/render/terrain-raster-compositor.js';
import {surfaceFeatureMayBeVisible} from '../src/render/surface-renderer.js';

const path=(id,x,y,width=90)=>({id,materialId:'ground.sand',width,points:[{x,y},{x:x+30,y:y+20}]});
const surface={baseMaterialId:'grass.forest',zones:[path('a',10,10),path('b',15000,15000)],routes:[],rivers:[]};
const fakeCtx=()=>({draws:[],save(){},restore(){},setTransform(){},clearRect(){},drawImage(...v){this.draws.push(v)},fillRect(){}});
function scene(opts={}){
 const renders=[],factoryCalls=[];
 const makeCanvas=(width,height)=>{factoryCalls.push([width,height]);const canvas={width,height,getContext:()=>fakeCtx()};return canvas;};
 const renderer={draw(_ctx,args){renders.push({surface:args.surface,camera:args.camera,viewport:args.viewport});}};
 const layer=createTerrainTileCache({canvasFactory:makeCanvas,tileSize:256,bleed:88,maxTiles:40,maxNewTilesPerFrame:2});
 const canvasCtx=fakeCtx(),width=480,height=360;
 const draw=(input={})=>layer.draw({
  ctx:canvasCtx, renderer, surface:input.surface??surface,
  surfaceKey:input.surfaceKey??'terrain', areaKey:input.areaKey??'a',
  camera:input.camera??{x:0,y:0},viewport:{width,height},
  canvasWidth:width,canvasHeight:height,
  zoom:1,dpr:1,areaClip(){}
 });
 return {draw,renderer,renders,factoryCalls,layer,canvasCtx};
}
test('surface viewport guard rejects far painted layers without altering nearby ones',()=>{
 assert.equal(surfaceFeatureMayBeVisible(path('near',50,50),{x:0,y:0},{width:300,height:200},0),true);
 assert.equal(surfaceFeatureMayBeVisible(path('far',1800,800),{x:0,y:0},{width:300,height:200},0),false);
 assert.equal(surfaceFeatureMayBeVisible(path('edge',390,40),{x:0,y:0},{width:300,height:200},65),true);
});
test('runtime tiles amortize raster baking over frames, not once per camera-guard boundary',()=>{
 const f=scene();f.draw();
 assert.ok(f.renders.length>0 && f.renders.length<=2);
 for(let n=0;n<20;n++)f.draw();
 const after=f.renders.length;assert.ok(after>=4);
 for(let n=0;n<6;n++)f.draw();
 assert.equal(f.renders.length,after);
 f.draw({camera:{x:400,y:0}});
 assert.ok(f.renders.length<=after+2);
 for(let n=0;n<20;n++)f.draw({camera:{x:400,y:0}});
 const afterMove=f.renders.length;
 f.draw({camera:{x:416,y:0}});
 assert.equal(f.renders.length,afterMove);
 f.draw({camera:{x:416,y:0},areaKey:'another-area'});
 assert.ok(f.renders.length<=afterMove+2);
});
test('bounded tile storage and full invalidation on area/content switch',()=>{
 const f=scene();
 for(let x=0;x<10000;x+=210){
  f.draw({camera:{x,y:0}});
 }
 assert.ok(f.layer.stats().cachedTiles<=40);
 const before=f.renders.length;
 f.draw({surfaceKey:'edited'});
 assert.ok(f.renders.length>before);
 f.layer.clear();assert.equal(f.layer.stats().cachedTiles,0);
});
test('runtime module uses tiled cache; Builder retains old compositor, no camera changes',async()=>{
 const js=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
 const builder=await readFile(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
 assert.match(js,/createTerrainTileCache/);
 assert.match(js,/terrainCompositor\.draw\(/);
 assert.match(builder,/createBuilderTerrainCompositor/);
 const txt=await readFile(new URL('../src/render/surface-renderer.js',import.meta.url),'utf8');
 assert.match(txt,/surfaceFeatureMayBeVisible\(/);
});
