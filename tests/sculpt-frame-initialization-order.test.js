import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('sculpt render scheduling state exists before early interior image onload hooks',()=>{
  // Chromium can dispatch a cached Image.onload before late scene initialization.
  // An image callback that schedules draw while framePending is in TDZ leaves
  // the entire sculpt canvas black (verified by GenSrpg external preview).
  const declaration=source.indexOf('let framePending=false;');
  const firstHook=source.indexOf('pic.onload=()=>scheduleDraw()');
  assert.ok(firstHook>0,'the original interior image owner must remain');
  assert.ok(declaration>=0&&declaration<firstHook,
    'framePending must be initialized before early async image callbacks are installed');
  assert.equal((source.match(/let framePending=false;/g)||[]).length,1,
    'a single frame scheduler owner only');
});
