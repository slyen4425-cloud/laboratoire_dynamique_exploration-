// Static preflight only. The Node integration test and Chromium run exercise
// the actual current Combat engine. Never assert an absolute file/SHA match.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REQUIRED_BRIDGE_PATHS = Object.freeze([
  'examples/dom-demo/exploration-encounter.html',
  'examples/dom-demo/exploration-encounter.js',
  'examples/dom-demo/exploration-native-source-v1.js',
  'examples/dom-demo/party.preview.v1.json',
  'examples/dom-demo/capture-editor-v2.html',
  'examples/dom-demo/capture-editor-v2.css',
  'src/ui/demo-app.js',
  'src/ui/combat-2v2-test-ui.js',
  'src/core/combat/combat-session.js',
  'src/core/combat/combat-runtime.js',
  'src/adapters/input/capture/monster-capture-creature-import-v1.js',
  'data/capture/monster-capture-creatures.v1.json',
  'data/combat/skills/catalog.v1.json',
  'data/combat/fighters/maraileron.combat.json'
]);
export const REQUIRED_COMBAT_CONTRACT_MARKERS = Object.freeze([
  'data-capture-preview-template',
  'data-combat-arena',
  'data-combat-skills',
  'data-combat-live-status'
]);

export function auditCombatPreviewDirectory(root) {
  const issues = [];
  for (const path of REQUIRED_BRIDGE_PATHS) {
    if (!existsSync(join(root, path))) issues.push('missing_bridge_file: ' + path);
  }
  const read = path => existsSync(join(root,path)) ? readFileSync(join(root,path), 'utf8') : '';
  const template = read('examples/dom-demo/capture-editor-v2.html');
  for (const marker of REQUIRED_COMBAT_CONTRACT_MARKERS) {
    if (!template.includes(marker)) issues.push('missing_native_hud_contract: ' + marker);
  }
  const ui = read('src/ui/combat-2v2-test-ui.js');
  if (!/export async function mountCoop2v2Test/.test(ui) ||
      !/nativeCombatSource/.test(ui) || !/session/.test(ui))
    issues.push('official_combat_session_interface_unavailable');
  const bridge = read('examples/dom-demo/exploration-encounter.js');
  if (!bridge.includes('mountCoop2v2Test') ||
      !bridge.includes('session.snapshot()') ||
      !bridge.includes('saveCombatHandoff') ||
      !bridge.includes('createCaptureCombatResult'))
    issues.push('native_combat_result_bridge_incomplete');
  const adapter = read('examples/dom-demo/exploration-native-source-v1.js');
  if (!adapter.includes('importMonsterCaptureCreatureRecordV1') ||
      !adapter.includes('adaptCaptureCreatureToFighterConfig') ||
      !adapter.includes('adaptCaptureSkillToSkillDefinition'))
    issues.push('official_capture_adapters_not_used');
  return Object.freeze({ok:issues.length===0,issues:Object.freeze(issues)});
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.argv[2] ?? 'combat-preview');
  const result = auditCombatPreviewDirectory(root);
  process.stdout.write(JSON.stringify({root, ...result}, null, 2) + '\n');
  if (!result.ok && !process.argv.includes('--report-only')) process.exitCode = 1;
}
