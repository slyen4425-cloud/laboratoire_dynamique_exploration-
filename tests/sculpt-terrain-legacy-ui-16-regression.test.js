import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  SCULPT_TERRAIN_MAX_LEVEL,
  createSculptTerrain,serializeSculptTerrain,importSculptTerrain,
  applySculptStroke,sculptHeightAt
} from '../src/world/sculpt-height-model.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('RED: actual height editor +/- and input clamp to the canonical terrain maximum instead of 7',()=>{
  const js=read('../src/sculpt-lab-main.js');
  const handler=js.match(/function changeTarget\(level\)\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(handler,'use the actual target input handler, no parallel UI model');
  assert.match(handler,/SCULPT_TERRAIN_MAX_LEVEL/,
    'click + and slider must permit level 8..16');
  assert.doesNotMatch(handler,/Math\.min\(7,/, 'no obsolete seven-level ceiling');
  assert.match(js,/\$\('level-up'\)\.addEventListener\('click',\(\)=>changeTarget\(/);
  assert.match(js,/\$\('quick-level-plus'\)\.addEventListener\('click',\(\)=>adjustQuickLevel\(1\)\)/);
});
test('legacy map 0..7 imports without conversion; its plateau can be raised to 16 and reexported',()=>{
  assert.equal(SCULPT_TERRAIN_MAX_LEVEL,16);
  const data=createSculptTerrain({width:12,height:12,
    levels:Array(144).fill(7),waterLevels:Array(144).fill(-1)});
  const legacy={...JSON.parse(serializeSculptTerrain(data)),schemaVersion:1};
  let imported=importSculptTerrain(legacy);
  imported=applySculptStroke(imported,{mode:'plateau',target:16,
    points:[{x:5.5,y:5.5}],radius:.5});
  assert.equal(sculptHeightAt(imported,5,5),16);
  assert.equal(sculptHeightAt(importSculptTerrain(serializeSculptTerrain(imported)),5,5),16);
  assert.deepEqual(legacy.levels,Array(144).fill(7),'legacy fixture not rewritten');
});
test('UI still shows terrain target 0..16, water unchanged and no separate backup target handler',()=>{
  const html=read('../sculpt-lab.html');
  assert.match(html, /id="target" type="range" min="0" max="16"/);
  assert.match(html, /id="water-target" type="range" min="0" max="10"/);
  const js=read('../src/sculpt-lab-main.js');
  assert.match(js, /function adjustQuickLevel\(delta\)/);
  assert.match(js, /const limit=editorKind==='water'\?10:SCULPT_TERRAIN_MAX_LEVEL/);
});
