import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,appendSculptTerrainRamp,sculptTerrainRampProjections}
 from '../src/world/sculpt-height-model.js';
import {appendSculptSurfaceStroke,createSculptSurface}
 from '../src/world/sculpt-surface-paint.js';
import {drawSculptRamp} from '../src/render/sculpt-ramp-renderer.js';
import {sculptCameraGameView} from '../src/render/sculpt-camera-projection.js';

const W=18,H=22;
function slope(){
 const levels=Array.from({length:W*H},(_,i)=>Math.floor(i/W)<8?5:2);
 const original=createSculptTerrain({width:W,height:H,levels});
 const terrain=appendSculptTerrainRamp(original,
   {x:8.5*28,y:13.5*21,endX:8.5*28,endY:4.5*21,width:140});
 assert.notEqual(terrain,original);
 return {terrain,object:sculptTerrainRampProjections(terrain)[0]};
}
function surface(){
 const dirt={...createSculptSurface(),baseMaterialId:'ground.dirt'};
 const forest=appendSculptSurfaceStroke(dirt,{materialId:'ground.forest_floor',
   terrainFamilyId:'forest',width:240,
   points:[{x:8.5*28,y:4*21},{x:8.5*28,y:14*21}]});
 return appendSculptSurfaceStroke(forest,{materialId:'road.dirt',
   width:24,points:[{x:8.5*28,y:11*21},{x:8.5*28,y:6*21}]});
}
const images=new Map([
 ['ground.forest_floor',{name:'forest',naturalWidth:64}],
 ['road.dirt',{name:'road',naturalWidth:64}]
]);
function recorder(){
 const fills=[],strokes=[],transformations=[],clips=[];
 const c={fillStyle:null,strokeStyle:null,lineWidth:1,globalAlpha:1,
   save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},
   clip(){clips.push('clip');},
   fill(){fills.push(this.fillStyle?.source??this.fillStyle);},
   stroke(){strokes.push({pattern:this.strokeStyle?.source??this.strokeStyle,
     width:this.lineWidth,alpha:this.globalAlpha});},
   createPattern(image){return {source:image.name};},
   transform(...args){transformations.push(args);}
 };
 return {c,fills,strokes,transformations,clips};
}
test('route painted along ramp is 24 world units, never replaces the whole 140-wide ramp',()=>{
 const {terrain,object}=slope(),rec=recorder();
 const snapshot=JSON.stringify(terrain);
 assert.equal(drawSculptRamp(rec.c,object,terrain,{texture:{name:'earth'},
    baseColor:'#665544',paintSurface:surface(),paintImages:images}),true);
 assert.ok(rec.fills.length>0);
 assert.ok(rec.fills.every(v=>v==='earth'),
   'all ramp body quads keep their base texture: painted zones/routes are overlays');
 assert.ok(rec.clips.length>0,'surface strokes must be clipped to actual ramp outline');
 assert.ok(rec.transformations.length>0,'world space brush footprint must be projected onto the incline');
 assert.ok(rec.strokes.some(e=>e.pattern==='forest'&&e.width===240));
 assert.ok(rec.strokes.some(e=>e.pattern==='road'&&e.width===24&&e.alpha===.95));
 assert.ok(!rec.strokes.some(e=>e.pattern==='road'&&e.width>=140),
   'a narrow road must never inherit the full ramp width');
 assert.equal(JSON.stringify(terrain),snapshot,'paint cannot change physical incline');
});
test('route across ramp is narrow and ordered on top of forest, across camera angles',()=>{
 const {terrain,object}=slope();
 const paint=appendSculptSurfaceStroke(surface(),{materialId:'road.dirt',width:18,
   points:[{x:140,y:9*21},{x:320,y:9*21}]});
 for(const angle of [90,55,35]){
   const rec=recorder();
   drawSculptRamp(rec.c,object,terrain,{
     view:sculptCameraGameView(angle),texture:{name:'earth'},
     paintSurface:paint,paintImages:images});
   const ordered=rec.strokes.filter(x=>x.alpha===.95&&x.pattern!=='rgba(25,42,26,.15)');
   assert.equal(ordered[0]?.pattern,'forest');
   assert.equal(ordered.at(-1)?.pattern,'road');
   assert.ok(rec.strokes.some(x=>x.width===18&&x.pattern==='road'));
   assert.ok(rec.transformations.every(args=>args.length===6&&args.every(Number.isFinite)));
 }
});
test('unpainted ramp keeps original base, with no new painter, geometric shape unchanged',()=>{
 const {terrain,object}=slope(),rec=recorder();
 assert.equal(drawSculptRamp(rec.c,object,terrain,{texture:{name:'earth'}}),true);
 assert.ok(rec.fills.length>0&&rec.fills.every(x=>x==='earth'));
 assert.equal(rec.clips.length,0);
 assert.equal(rec.transformations.length,0);
 assert.equal(rec.strokes.some(x=>x.pattern==='road'),false);
});
