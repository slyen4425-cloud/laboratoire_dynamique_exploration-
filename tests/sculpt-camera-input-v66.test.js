import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sculptCameraGameView,sculptCameraProject,sculptCameraWorldInput}
 from '../src/render/sculpt-camera-projection.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('V66 joystick moves in intended screen direction at every 35–90° camera angle',()=>{
 for(const angle of [35,45,55,70,90]){
  const view=sculptCameraGameView(angle);
  for(const [sx,sy] of [[0,-1],[0,1],[1,0],[-1,0],[1,1],[-1,1],[1,-1]]){
   const intent=sculptCameraWorldInput(view,sx,sy),mag=Math.hypot(intent.x,intent.y);
   const visual=sculptCameraProject(view,
     intent.x/mag*intent.speedMultiplier,intent.y/mag*intent.speedMultiplier);
   const expected=Math.hypot(sx,sy);
   near(visual.x,sx/expected);near(visual.y,sy/expected);
   near(Math.hypot(visual.x,visual.y),1);
  }
 }
});
test('V66 keyboard zero/invalid input stays inert and top down legacy is unchanged',()=>{
 for(const angle of [35,90]){
  const view=sculptCameraGameView(angle);
  assert.deepEqual(sculptCameraWorldInput(view,0,0),{x:0,y:0,speedMultiplier:1});
  assert.deepEqual(sculptCameraWorldInput(view,NaN,Infinity),
     {x:0,y:0,speedMultiplier:1});
 }
 const ninety=sculptCameraWorldInput(sculptCameraGameView(90),0,1);
 near(ninety.y,1);near(ninety.speedMultiplier,1);
});
test('V66 uses the real controller -> Core stepMovement and leaves collision authority alone',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(main,/const rawIntent=navigationInput\(\)/);
 assert.match(main,/const intent=sculptCameraWorldInput\(cameraView\(\),rawIntent\.x,rawIntent\.y\)/);
 assert.match(main,/maxSpeed:navSpeed\(\)\*intent\.speedMultiplier/);
 assert.match(main,/sculptNavigationBlockDetail\(context\.sculptNavigation/);
 assert.match(html,/rev=sculpt-bridge-input-v66/);
});
