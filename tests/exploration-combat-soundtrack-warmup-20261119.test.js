import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAPTURE_COMBAT_WARMUP_PATHS_V1} from '../src/encounters/capture-combat-warmup-v1.js';

const bridge=readFileSync(new URL('../integration/combat-bridge/exploration-encounter.js',import.meta.url),'utf8');

test('first battle quietly warms the one already published Combat entry and UI, without evaluating them',()=>{
  for(const path of [
    'combat-preview/examples/dom-demo/exploration-encounter.html',
    'combat-preview/examples/dom-demo/exploration-encounter.js',
    'combat-preview/src/ui/combat-2v2-test-ui.js',
    'combat-preview/src/ui/demo-app.js'
  ])assert.ok(CAPTURE_COMBAT_WARMUP_PATHS_V1.includes(path),'missing official preload '+path);
  assert.equal(new Set(CAPTURE_COMBAT_WARMUP_PATHS_V1).size,CAPTURE_COMBAT_WARMUP_PATHS_V1.length);
});

test('native Combat, not Exploration HP/DOM, announces result to the existing music owner',()=>{
  assert.match(bridge,/onBattleOutcome:playOfficialCombatResultSoundtrack/);
  assert.match(bridge,/function playOfficialCombatResultSoundtrack\(outcome\)/);
  assert.match(bridge,/announcedResultSoundtrack!==null/,'jingle must fire only once');
  assert.match(bridge,/soundtrack\.transitionTo\(sceneId\)/);
  assert.match(bridge,/startSoundtrackOnGesture\(sceneId\)/);
  assert.match(bridge,/sceneId='capture:combat:'\+outcome/);
  assert.match(bridge,/if\(!outcomeHold\.start\(outcome\)\)return;\s*\/\/ Tester also uses this hold[\s\S]*?playOfficialCombatResultSoundtrack\(outcome\)/);
  assert.match(bridge,/event\.data\?\.type!=='gensrpg\.capture\.combat-stop-audio\.v1'/,
    'the result dialog still owns soundtrack dismissal');
  assert.doesNotMatch(bridge,/new Audio\(/,'no second audio player');
});
