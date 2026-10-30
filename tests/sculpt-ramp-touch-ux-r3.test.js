import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,appendSculptTerrainRamp,sculptTerrainRampProjections} from '../src/world/sculpt-height-model.js';
import {sculptRampVisualMesh} from '../src/render/sculpt-ramp-renderer.js';
import {sculptCameraGameView} from '../src/render/sculpt-camera-projection.js';

const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
test('R3 slopes use a two-tap or single-drag map gesture, bypassing only precision mode',()=>{
  assert.match(main,/if\(rampToolActive\(\)\)\{\s*const point=rampPointFromCell\(cell\)/);
  const gesture=main.indexOf('if(rampToolActive()){\n    const point=rampPointFromCell(cell);');
  const precision=main.indexOf("if($('precision-mode').checked){\n    precisionDragging=true;",gesture);
  assert.ok(gesture>=0&&precision>gesture,'ramp touch must intercept before mobile precision overlay');
  assert.match(main,/if\(gesture\.moved\)\{\s*commitTerrainRamp\(gesture\.previousStart\?\?gesture\.origin,gesture\.last\);/);
  assert.match(main,/rampStart=gesture\.origin;/);
  assert.match(main,/commitTerrainRamp\(gesture\.previousStart,gesture\.last\)/);
  assert.match(main,/if\(rampToolActive\(\)&&!drawing\)\{[\s\S]*?hoverCell=next;[\s\S]*?return;\s*\}\s*if\(\$\('precision-mode'\)\.checked\)return;/);
  assert.match(main,/const cancelled=event\?\.type==='pointercancel'\|\|event\?\.type==='lostpointercapture';/);
  assert.match(main,/if\(!cancelled\)\{/);
  assert.match(html,/id="ramp-guide"[^>]*aria-live="polite"/);
  assert.match(html,/id="ramp-cancel"/);
  assert.match(main,/\$\('ramp-cancel'\)\.addEventListener\('click'/);
  assert.match(main,/updateRampGuide\(\)/);
  assert.doesNotMatch(main,/rampPrecisionStart/);
});
test('R3 preview uses the authored native ramp mesh, never a new saved layer or pseudo-object',()=>{
  assert.match(main,/const candidate=appendSculptTerrainRamp\(terrain,\{/);
  assert.match(main,/const mesh=sculptRampVisualMesh\(candidate,projected,\{/);
  assert.match(main,/sculptTerrainRampProjections\(candidate\)\.at\(-1\)/);
  assert.match(main,/rampPreviewValid=candidate!==terrain/);
  assert.match(main,/rampWidth=\(\)=>Number\(\$\('radius'\)\.value\)\*SCULPT_TILE\.width/);
  assert.match(html,/<button data-mode="terrain-ramp">/);
  assert.doesNotMatch(html,/<option value="ramp">/);
  const w=18,h=22,levels=Array.from({length:w*h},(_,i)=>Math.floor(i/w)<8?5:2);
  const terrain=createSculptTerrain({width:w,height:h,levels});
  const p1={x:8.5*28,y:13.5*21},p2={x:8.5*28,y:7.5*21};
  const candidate=appendSculptTerrainRamp(terrain,{x:p1.x,y:p1.y,endX:p2.x,endY:p2.y,width:84});
  assert.notEqual(candidate,terrain);
  assert.equal(terrain.ramps.length,0,'preview validation does not mutate heightfield');
  const o=sculptTerrainRampProjections(candidate)[0];
  const mesh=sculptRampVisualMesh(candidate,o,{view:sculptCameraGameView(35)});
  assert.equal(mesh.valid,true);
  assert.ok(mesh.samples.length>3);
  assert.ok(mesh.samples.every(s=>Number.isFinite(s.left.y)&&Number.isFinite(s.right.y)));
  const noUpper=appendSculptTerrainRamp(terrain,{x:p1.x,y:p1.y,
    endX:p1.x+28,endY:p1.y,width:84});
  assert.equal(noUpper,terrain,'invalid preview stays orange and does not commit');
});
