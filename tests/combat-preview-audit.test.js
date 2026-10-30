import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { auditCombatPreviewDirectory, REQUIRED_BRIDGE_PATHS, REQUIRED_COMBAT_CONTRACT_MARKERS } from '../scripts/audit-combat-preview.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'exploration-combat-owner-'));
  t.after(() => rmSync(root, { recursive:true, force:true }));
  const add = (name, content) => {
    const file = join(root, name);
    mkdirSync(dirname(file), {recursive:true});
    writeFileSync(file, content);
  };
  for (const file of REQUIRED_BRIDGE_PATHS) add(file, 'available');
  add('examples/dom-demo/capture-editor-v2.html', REQUIRED_COMBAT_CONTRACT_MARKERS.join(' '));
  add('src/ui/combat-2v2-test-ui.js',
    'export async function mountCoop2v2Test({nativeCombatSource}) { return {session:{}}; }');
  add('examples/dom-demo/exploration-encounter.js',
    'mountCoop2v2Test(); combat.session.snapshot(); saveCombatHandoff(); createCaptureCombatResult();');
  add('examples/dom-demo/exploration-native-source-v1.js',
    'importCaptureTransferJsonV1 buildCaptureEditorCombatTestV1 adaptCaptureCombatExportStackV1');
  return {root, add};
}

test('official Combat runtime with a compatible functional bridge is accepted', t => {
  const {root} = fixture(t);
  assert.deepEqual(auditCombatPreviewDirectory(root), {ok:true,issues:[]});
});

test('missing official runtime is not replaced by a mock/preview', t => {
  const {root} = fixture(t);
  unlinkSync(join(root,'src/core/combat/combat-runtime.js'));
  const report = auditCombatPreviewDirectory(root);
  assert.equal(report.ok,false);
  assert.ok(report.issues.includes('missing_bridge_file: src/core/combat/combat-runtime.js'));
});

test('native Combat session interface mismatch is blocked', t => {
  const {root,add} = fixture(t);
  add('src/ui/combat-2v2-test-ui.js', 'export function fakeCombat() {}');
  const report = auditCombatPreviewDirectory(root);
  assert.equal(report.ok,false);
  assert.ok(report.issues.includes('official_combat_session_interface_unavailable'));
});

test('Combat may add abilities or new fields without byte/version equivalence checks', t => {
  const {root,add} = fixture(t);
  add('src/ui/combat-2v2-test-ui.js',
    'export async function mountCoop2v2Test({root,nativeCombatSource, futureOptions}) { const session = {}; return {session, futureOptions}; }');
  assert.equal(auditCombatPreviewDirectory(root).ok,true);
});

test('the official Capture editor must remain the sole HUD owner', t => {
  const {root,add} = fixture(t);
  add('examples/dom-demo/capture-editor-v2.html','<main data-combat-arena></main>');
  assert.ok(auditCombatPreviewDirectory(root).issues.some(x =>
    x.includes('missing_native_hud_contract: data-combat-skills')));
});
