import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the actual Combat document has no redundant audio activation button',()=>{
  const html=file('integration/combat-bridge/exploration-encounter.html');
  const bridge=file('integration/combat-bridge/exploration-encounter.js');
  assert.doesNotMatch(html,/data-encounter-audio/);
  assert.match(bridge,/startSoundtrackOnGesture/);
  assert.match(bridge,/addEventListener\('pointerdown',startMusicWhenTouched/);
  assert.match(bridge,/createCombatSoundtrackPreviewBridgeV1/);
  assert.match(bridge,/privateAudioRuntimeAssetV1/);
  assert.match(bridge,/soundtrackRuntimeAssetV1/);
  assert.match(bridge,/onAudioError/);
  assert.match(bridge,/soundtrack\?\.dispose\(\)/);
});
test('real authored visuals are decoded before the first Combat HUD mount',()=>{
  const bridge=file('integration/combat-bridge/exploration-encounter.js');
  const decodeAt=bridge.indexOf('await Promise.all(imageFiles.map');
  const mountAt=bridge.indexOf('mountedVisuals=await mountCombatDemo');
  assert.ok(decodeAt>0&&decodeAt<mountAt);
  assert.match(bridge,/captureEncounterVisualFilesV1\(/);
  assert.match(bridge,/img.onload=/);
  assert.match(bridge,/Chargement des textures du combat/);
});
