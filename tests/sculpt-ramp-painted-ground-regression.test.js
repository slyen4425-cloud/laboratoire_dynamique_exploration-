import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,appendSculptTerrainRamp,sculptTerrainRampProjections}
 from '../src/world/sculpt-height-model.js';
import {createSculptSurface,appendSculptSurfaceStroke,sculptSurfacePaintAt}
 from '../src/world/sculpt-surface-paint.js';
import {drawSculptRamp} from '../src/render/sculpt-ramp-renderer.js';

const W=18,H=22;
const terrain=()=>{
 const levels=Array.from({length:W*H},(_,i)=>Math.floor(i/W)<8?5:2);
 const clean=createSculptTerrain({width:W,height:H,levels});
 return appendSculptTerrainRamp(clean,{x:8.5*28,y:13.5*21,
   endX:8.5*28,endY:4.5*21,width:84});
};
function painted(){
 const base=createSculptSurface();
 const dirt={...base,baseTerrainFamilyId:'road',baseMaterialId:'ground.dirt'};
 const forest=appendSculptSurfaceStroke(dirt,{
   materialId:'ground.forest_floor',terrainFamilyId:'forest',width:300,
   points:[{x:8.5*28,y:3*21},{x:8.5*28,y:16*21}]});
 return appendSculptSurfaceStroke(forest,{
   materialId:'road.dirt',terrainFamilyId:'forest',width:42,
   points:[{x:100,y:7*21},{x:400,y:7*21}]});
}
function recorder(){
 const fills=[],ctx={
   fillStyle:null,strokeStyle:null,lineWidth:1,
   save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},
   createPattern(img){return {from:img.name};},
   fill(){fills.push(this.fillStyle?.from??this.fillStyle);}
 };
 return {ctx,fills};
}
test('painted forest floor is the visible slope material even when base terrain is brown dirt',()=>{
 const surface=painted();
 assert.equal(surface.baseMaterialId,'ground.dirt');
 assert.equal(sculptSurfacePaintAt(surface,8.5*28,12*21),'ground.forest_floor');
 assert.equal(sculptSurfacePaintAt(surface,8.5*28,7*21),'road.dirt',
  'the last route layer wins just as in the terrain painter');
 assert.equal(sculptSurfacePaintAt(surface,0,0),null,'unpainted retains base material');
});
test('native ramp uses the actual painted ground patterns, preserving route overlaps',()=>{
 const t=terrain(),r=sculptTerrainRampProjections(t)[0];
 assert.ok(r);
 const {ctx,fills}=recorder();
 const surface=painted();
 const images=new Map([
  ['ground.forest_floor',{name:'forest-texture',naturalWidth:64}],
  ['road.dirt',{name:'road-texture',naturalWidth:64}]
 ]);
 assert.equal(drawSculptRamp(ctx,r,t,{texture:{name:'brown-dirt',naturalWidth:64},
   baseColor:'#654321',paintSurface:surface,paintImages:images}),true);
 assert.ok(fills.includes('forest-texture'),'forest painted texture must cover slope');
 assert.ok(fills.includes('road-texture'),'route paint layer must be respected on slope');
 assert.ok(!fills.includes('brown-dirt'),'the brown default must not cover painted incline');
});
test('unpainted native ramp remains exactly on base ground material',()=>{
 const t=terrain(),r=sculptTerrainRampProjections(t)[0];
 const {ctx,fills}=recorder();
 assert.equal(drawSculptRamp(ctx,r,t,{texture:{name:'base'},baseColor:'#765432'}),true);
 assert.ok(fills.length>0&&fills.every(x=>x==='base'));
});
test('both native and historic ramp render paths pass the same authored WorldSurface paint',()=>{
 const terrainRender=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 const sculpt=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(terrainRender,/tileWidth:w,tileHeight:h,rise,texture,baseColor,paintSurface,paintImages/);
 assert.match(sculpt,/if\(object\.kind==='ramp'\)\{[\s\S]*?paintSurface:surface,paintImages:surfacePaintImages/);
});
