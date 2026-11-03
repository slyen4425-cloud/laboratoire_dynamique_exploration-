import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shouldPaintSculptNavigationFrame}
  from '../src/render/sculpt-navigation-frame-pacing.js';

function runSimulatedRefresh(hz,{moving=false,altitudeChanging=false}={}){
 let lastPaintMs=-Infinity,paints=0;
 for(let index=0;index<hz;index++){
   const nowMs=index*(1000/hz);
   if(shouldPaintSculptNavigationFrame({
     moving,altitudeChanging,
     elapsedSincePaintMs:nowMs-lastPaintMs
   })){
     lastPaintMs=nowMs;
     paints++;
   }
 }
 return paints;
}

test('Tester walking paints on every browser refresh, not an arbitrary 33ms cap',()=>{
 assert.equal(runSimulatedRefresh(60,{moving:true}),60);
 assert.equal(runSimulatedRefresh(120,{moving:true}),120);
 assert.equal(runSimulatedRefresh(144,{moving:true}),144);
});
test('visual altitude following also gets a fresh image on every animation frame',()=>{
 assert.equal(runSimulatedRefresh(60,{altitudeChanging:true}),60);
});
test('static navigation may conserve battery with lower idle FPS',()=>{
 const count=runSimulatedRefresh(120,{moving:false});
 assert.ok(count>=15&&count<=20,'idle should run near 18 fps, not full 120 Hz');
 assert.equal(shouldPaintSculptNavigationFrame({
   moving:false,altitudeChanging:false,elapsedSincePaintMs:20
 }),false);
 assert.equal(shouldPaintSculptNavigationFrame({
   moving:false,altitudeChanging:false,elapsedSincePaintMs:55
 }),true);
});
test('the live Tester measures displayed canvas frames independently of input RAF',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(main,/shouldPaintSculptNavigationFrame\(/,
   'use one pure decision for the existing frame scheduler');
 assert.doesNotMatch(main,/navActor\.moving\s*\?\s*33\s*:\s*55/,
   'the old 30-FPS walking cap causes visible desktop judder');
 assert.match(main,/navPaintFrames\+\+/,
   'count actual draw() completions, not only navigationTick callbacks');
 assert.match(main,/renderFps:navRenderFps/,
   'expose measured painted FPS in the already-existing navigation probe');
 assert.match(main,/navRenderFps.*FPS/,
   'show actual displayed FPS in the player HUD');
});
