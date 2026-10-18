import test from 'node:test';
import assert from 'node:assert/strict';
import {sculptNavigationFrameSteps} from '../src/core/sculpt-navigation-frame-clock.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {stepMovement} from '../src/core/movement.js';
test('V21 navigation no longer discards real elapsed time at 5fps',()=>{
  for(const frameMs of [16,32,40,100,200,250]){
    const steps=sculptNavigationFrameSteps(frameMs);
    assert.ok(steps.length>0&&steps.every(t=>t>0&&t<=.020001));
    assert.ok(Math.abs(steps.reduce((a,b)=>a+b,0)-frameMs/1000)<1e-9);
  }
  assert.ok(Math.abs(sculptNavigationFrameSteps(600).reduce((a,b)=>a+b,0)-.25)<1e-9);
  assert.deepEqual(sculptNavigationFrameSteps(0),[]);
  assert.deepEqual(sculptNavigationFrameSteps(-7),[]);
  assert.deepEqual(sculptNavigationFrameSteps(NaN),[]);
});
test('V21 low-FPS inputs travel at correct world rate through existing movement and Collision World',()=>{
  const terrain=createSculptTerrain({width:36,height:24,levels:Array(36*24).fill(2)});
  const world={width:terrain.width*28,height:terrain.height*21,objects:[],obstacles:[]};
  const collisionContext={sculptNavigation:{terrain,cellWidth:28,cellHeight:21,maxStepUp:1,maxStepDown:1}};
  const actor={x:100,y:100,radius:5,locomotion:{modes:['ground']}};
  for(let frame=0;frame<4;frame++)for(const dt of sculptNavigationFrameSteps(200)){
    stepMovement(world,actor,{x:1,y:0},dt,{maxSpeed:220},undefined,collisionContext);
  }
  assert.ok(Math.abs(actor.x-276)<.001,'200ms frames must advance 176 units over 0.8 s, not crawl');
});
test('V21 collision still stops a wall under a 250ms phone frame',()=>{
  const levels=Array(36*24).fill(1);
  for(let y=0;y<24;y++)levels[y*36+8]=6;
  const terrain=createSculptTerrain({width:36,height:24,levels});
  const world={width:terrain.width*28,height:terrain.height*21,objects:[],obstacles:[]};
  const collisionContext={sculptNavigation:{terrain,cellWidth:28,cellHeight:21,maxStepUp:1,maxStepDown:1}};
  const actor={x:180,y:180,radius:5,locomotion:{modes:['ground']}};
  for(const dt of sculptNavigationFrameSteps(250)){
    stepMovement(world,actor,{x:1,y:0},dt,{maxSpeed:360},undefined,collisionContext);
  }
  assert.ok(actor.x<224,'fast actor must not cross a full-height cliff cell');
});
