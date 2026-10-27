// Prérequis de publication du pont Combat / Exploration.
// Contrôle uniquement des fichiers de build ; ne possède ni combat ni données de jeu.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REQUIRED_BRIDGE_PATHS = Object.freeze([
  'examples/dom-demo/exploration-encounter.html',
  'examples/dom-demo/exploration-encounter.js',
  'examples/dom-demo/capture-editor-v2.html',
  'examples/dom-demo/capture-editor-v2.css',
  'src/ui/exploration-encounter-handoff-v1.js',
  'src/adapters/input/capture/exploration-encounter-combat-source-v1.js',
  'src/contracts/capture-encounter-snapshot-v1.js',
  'src/contracts/capture-combat-result-v1.js'
]);

const MODERN_UI = 'src/ui/combat-2v2-test-ui.js';
const REQUIRED_HUD_MARKERS = Object.freeze([
  'data-combat-arena',
  'data-combat-skills',
  'data-combat-live-status',
  'data-combat-energy-orbs'
]);

export function auditCombatPreviewDirectory(root) {
  const issues = [];
  for (const path of REQUIRED_BRIDGE_PATHS) {
    if (!existsSync(join(root, path))) {
      issues.push('missing_bridge_file: ' + path);
    }
  }
  if (!existsSync(join(root, MODERN_UI))) {
    issues.push('missing_combat_ui: ' + MODERN_UI);
    return Object.freeze({ ok: false, issues: Object.freeze(issues) });
  }

  const ui = readFileSync(join(root, MODERN_UI), 'utf8');
  // A modern runtime that silently ignores the legacy onBattleEnd parameter
  // cannot complete the Encounter -> Combat -> Result -> Exploration flow.
  const signature = ui.match(
    /export\s+async\s+function\s+mountCoop2v2Test\s*\(\s*\{([\s\S]*?)\}\s*\)/
  );
  const acceptsEndCallback =
    signature !== null && /\bonBattleEnd\b/.test(signature[1]);
  if (!acceptsEndCallback) {
    issues.push('missing_native_battle_end_callback');
  } else if (!/\bonBattleEnd\s*\(/.test(ui.slice(signature.index + signature[0].length))) {
    issues.push('unused_native_battle_end_callback');
  }

  // Do not validate a stale, independently authored Encounter HUD.
  // Only the Capture Editor's real preview template owns presentation.
  const htmlPath = join(root, 'examples/dom-demo/exploration-encounter.html');
  const entryPath = join(root, 'examples/dom-demo/exploration-encounter.js');
  const editorPath = join(root, 'examples/dom-demo/capture-editor-v2.html');
  const cssPath = join(root, 'examples/dom-demo/capture-editor-v2.css');
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';
  const entry = existsSync(entryPath) ? readFileSync(entryPath, 'utf8') : '';
  const editor = existsSync(editorPath) ? readFileSync(editorPath, 'utf8') : '';
  const usesCanonicalView =
    html.includes('data-capture-preview-host') &&
    html.includes('capture-editor-v2.css') &&
    entry.includes('fetch("./capture-editor-v2.html"') &&
    entry.includes('data-capture-preview-template') &&
    entry.includes('template.content.cloneNode(true)') &&
    editor.includes('data-capture-preview-template') &&
    existsSync(cssPath);
  if (!usesCanonicalView) {
    issues.push('missing_native_authoring_capture_view');
  }
  for (const marker of REQUIRED_HUD_MARKERS) {
    if (!editor.includes(marker)) issues.push('missing_modern_hud_marker: ' + marker);
  }
  if (!entry.includes('completeExplorationCombatHandoffV1')) {
    issues.push('missing_combat_result_completion');
  }
  if (!entry.includes('onBattleEnd')) {
    issues.push('missing_combat_end_subscription');
  }
  return Object.freeze({
    ok: issues.length === 0,
    issues: Object.freeze(issues)
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.argv[2] ?? 'combat-preview');
  const result = auditCombatPreviewDirectory(root);
  process.stdout.write(JSON.stringify({ root, ...result }, null, 2) + '\n');
  if (!result.ok && !process.argv.includes('--report-only')) {
    process.exitCode = 1;
  }
}
