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

 test('renderer cannot schedule an animation frame until the real sculpt bootstrap is complete',()=>{
  const bootstrap=source.indexOf('let sculptBootReady=false;');
  const firstHook=source.indexOf('pic.onload=()=>scheduleDraw()');
  const guard=source.indexOf('if(!sculptBootReady)return;');
  const ready=source.indexOf('sculptBootReady=true;fit();');
  const lastBoot=source.lastIndexOf('loadSphereWallImages();',ready);
  assert.ok(bootstrap>0&&bootstrap<firstHook,
    'pre-registered asset callbacks must see one false bootstrap state');
  assert.ok(guard>firstHook&&guard<ready,
    'scheduler must block callbacks during top-level async module evaluation');
  assert.ok(lastBoot>guard&&lastBoot<ready,
    'boot turns ready only after all source-owned render dependencies are set');
  assert.equal((source.match(/let sculptBootReady=false;/g)||[]).length,1);
  assert.equal((source.match(/sculptBootReady=true;fit\(\);/g)||[]).length,1,
    'one boot transition, no global watchdog or duplicate renderer');
 });

test('missing official Combat showcase fails only encounters, never the 2.5D renderer',()=>{
  assert.match(source,/sculptEncounterSourceError=error;/,
    'retain precise Combat source loading error, no alternative catalogue');
  assert.match(source,/if\(!sculptEncounterCatalog\)/,
    'native encounter controls must report their unavailable official source');
  assert.match(source,/!sculptEncounterCatalog\|\|!navigationTesting/,
    'native Tester must fail closed without an official creature catalog');
  assert.doesNotMatch(source,/createCaptureCreatureCatalogProvider\s*\(\s*\[\s*\]/,
    'never make a fake empty Combat catalog to silence failure');
  assert.match(source,/sculptBootReady=true;fit\(\);/,
    'terrain must still complete startup when optional cross-module author data is absent');
});
