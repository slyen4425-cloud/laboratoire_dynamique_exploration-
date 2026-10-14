import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  auditCombatPreviewDirectory,
  REQUIRED_BRIDGE_PATHS
} from '../scripts/audit-combat-preview.mjs';

function fixture(t, options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'exploration-combat-bridge-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const add = (file, text) => {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  };
  const ui = options.ui ?? [
    'export async function mountCoop2v2Test({',
    '  root, visuals, onBattleEnd = () => {}',
    '}) {',
    '  onBattleEnd({ outcome: "victory" });',
    '}'
  ].join('\n');
  add('src/ui/combat-2v2-test-ui.js', ui);
  for (const file of REQUIRED_BRIDGE_PATHS) add(file, 'versioned contract');
  add('examples/dom-demo/exploration-encounter.html', [
    '<main data-combat-arena>',
    '<section data-combat-skills></section>',
    '<span data-combat-live-status></span>',
    '<div data-combat-energy-orbs="local-1"></div>',
    '</main>'
  ].join('\n'));
  add('examples/dom-demo/exploration-encounter.js',
    'const onBattleEnd = () => completeExplorationCombatHandoffV1();'
  );
  return { root, add };
}

test('Combat recent sans bridge ne peut jamais être déclaré intégrable', (t) => {
  const { root, add } = fixture(t, {
    ui: 'export async function mountCoop2v2Test({ root, visuals }) {}'
  });
  add('examples/dom-demo/exploration-encounter.html',
    '<main data-combat-arena data-combat-skills data-combat-live-status></main>'
  );
  const report = auditCombatPreviewDirectory(root);
  assert.equal(report.ok, false);
  assert.ok(report.issues.includes('missing_native_battle_end_callback'));
  assert.ok(report.issues.includes('missing_modern_hud_marker: data-combat-energy-orbs'));
});

test('une déclaration non utilisée de onBattleEnd ne suffit pas', (t) => {
  const { root } = fixture(t, {
    ui: 'export async function mountCoop2v2Test({ onBattleEnd }) { return {}; }'
  });
  const report = auditCombatPreviewDirectory(root);
  assert.equal(report.ok, false);
  assert.ok(report.issues.includes('unused_native_battle_end_callback'));
});

test('la prévalidation refuse les fichiers pont manquants', (t) => {
  const { root } = fixture(t);
  rmSync(join(root, 'examples/dom-demo/exploration-encounter.js'));
  const report = auditCombatPreviewDirectory(root);
  assert.equal(report.ok, false);
  assert.ok(report.issues.includes(
    'missing_bridge_file: examples/dom-demo/exploration-encounter.js'
  ));
});

test('contrat explicite + scène HUD compatible donne un avis de prévalidation positif', (t) => {
  const { root } = fixture(t);
  const report = auditCombatPreviewDirectory(root);
  assert.equal(report.ok, true);
  assert.deepEqual(report.issues, []);
});
