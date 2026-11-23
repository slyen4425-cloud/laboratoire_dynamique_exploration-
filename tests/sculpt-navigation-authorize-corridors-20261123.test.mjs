import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,appendSculptNavigationAllowedCorridor,
  applySculptNavigationBlockStroke,serializeSculptTerrain,importSculptTerrain,
  sculptTerrainRampProjections} from '../src/world/sculpt-height-model.js';
import {sculptNavigationRoute} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';

const W=18,H=22,CW=28,CH=21;
const pt=(col,row)=>({x:(col+.5)*CW,y:(row+.5)*CH});
const terrace=()=>createSculptTerrain({width:W,height:H,
  levels:Array.from({length:W*H},(_,i)=>Math.floor(i/W)<8?5:2)});
const route=(t,from=pt(8,12),to=pt(8,3),width=84)=>
  appendSculptNavigationAllowedCorridor(t,{
    x:from.x,y:from.y,endX:to.x,endY:to.y,width});
const nav=t=>({sculptNavigation:{
  terrain:t,stairs:sculptTerrainRampProjections(t),bridges:[],
  cellWidth:CW,cellHeight:CH,projectionRise:18,maxStepUp:0,maxStepDown:0}});
const world={width:W*CW,height:H*CH,objects:[],obstacles:[]};
const actor=()=>({x:pt(8,13).x,y:pt(8,13).y,radius:5,
  locomotion:{modes:['ground']}});
const walk=(p,t,direction,frames=90)=>{
  for(let i=0;i<frames;i++)
    stepMovement(world,p,{x:0,y:direction},.04,
      {maxSpeed:95},undefined,nav(t));
};

test('Autoriser draws a true canonical terrain ramp: traversable ascent and descent, not a global cliff override',()=>{
 const source=terrace(),p=actor();
 const before=serializeSculptTerrain(source);
 walk(p,source,-1);
 assert.ok(p.y>=8*CH,'raw cliff still blocked');
 const granted=route(source);
 assert.equal(granted.ramps.length,1);
 assert.equal(granted.navigationAllowedCells,undefined,'no second permission mask');
 assert.equal(serializeSculptTerrain(source),before,'original immutable');
 const walker=actor();walk(walker,granted,-1);
 assert.ok(walker.y<8*CH,'the native Collision World must climb the corridor');
 assert.equal(walker.sculptStairId,null);
 walk(walker,granted,1);assert.ok(walker.y>12*CH);
 const outside={...actor(),x:pt(2,13).x};
 walk(outside,granted,-1);assert.ok(outside.y>=8*CH,
   'a nearby wall outside the corridor stays solid');
 const saved=importSculptTerrain(serializeSculptTerrain(granted));
 assert.deepEqual(saved.ramps,granted.ramps);
 assert.equal(serializeSculptTerrain(importSculptTerrain(before)),before);
});

test('Autoriser supports reverse drawing and clears no-go paint only along the intended corridor',()=>{
 let t=terrace();
 t=applySculptNavigationBlockStroke(t,{points:[{x:8.5,y:10.5},{x:1.5,y:10.5}],
   radius:.5,shape:'square',action:'block'});
 const blocked=t.navigationBlockedCells;
 assert.equal(blocked.length,2);
 const next=route(t,pt(8,3),pt(8,12));
 assert.equal(next.ramps.length,1,'two-point gesture may start from the top');
 assert.ok(!next.navigationBlockedCells.includes(10*W+8),
  'explicit allow clears the conflict inside its own corridor');
 assert.ok(next.navigationBlockedCells.includes(10*W+1),
  'other restricted paths remain blocked');
 const p=actor();walk(p,next,-1);
 assert.ok(p.y<8*CH,'clearance and native ramp work together');
});

test('Autoriser rejects invalid or unsafe paths without silently changing water or height rules',()=>{
 const t=terrace();
 for(const other of [pt(8,11),pt(8,14),pt(8,12)])
   assert.equal(route(t,pt(8,12),other),t,
     'equal-level/short corridor must not create a bypass');
 const water=Array(W*H).fill(-1);water[3*W+8]=8;
 const wet=createSculptTerrain({width:W,height:H,
   levels:t.levels,waterLevels:water});
 assert.equal(route(wet),wet,'a flooded head is never a supported slope');
 assert.equal(route(t,pt(8,12),pt(8,3),2),t,'too narrow is unsafe');
 assert.equal(route(t,pt(8,12),{x:pt(8,3).x,y:-200}),t);
});

test('Navigation editor has a real third mode and the same native preview, gesture, Undo and stop',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const code=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.equal((html.match(/id="nav-zone-allow"/g)||[]).length,1);
 assert.match(html,/Autoriser \/ Interdire \/ Normal/);
 assert.match(code,/setNavigationMaskEditing\('allow'\)/);
 assert.match(code,/appendSculptNavigationAllowedCorridor\(terrain,/);
 assert.match(code,/navAllowStart/);
 assert.match(code,/commitUndo\(before\)/);
 assert.match(code,/rampToolActive\(\)\|\|navAllowPreview/);
 assert.match(code,/if\(navigationMaskEditing==='allow'\)/);
 assert.match(code,/\$\('nav-zone-allow'\)\?\.addEventListener/);
});
