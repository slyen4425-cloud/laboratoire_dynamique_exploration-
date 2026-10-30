import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  createBlankWorldBuilderDraft,
  createWorldBuilderDraft,
  importWorldBuilderDocument,
  serializeWorldBuilderDraft,
  updateAreaProperties,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';

test('new blank map keeps one editable playable area and no demo content', () => {
  const blank = createBlankWorldBuilderDraft();
  const check = validateWorldBuilderDraft(blank);
  assert.equal(check.valid, true, check.errors.join(', '));
  assert.equal(blank.areas.length, 1);
  assert.equal(blank.portals.length, 0);
  assert.equal(blank.events.length, 0);
  const area = blank.areas[0];
  assert.equal(area.kind, 'exterior');
  assert.deepEqual(area.objects, []);
  assert.deepEqual(area.actors, []);
  assert.deepEqual(area.obstacles, []);
  assert.deepEqual(area.surface.zones, []);
  assert.deepEqual(area.surface.routes, []);
  assert.deepEqual(area.surface.rivers, []);
  assert.equal(area.encounters.randomEnabled, true);
  assert.equal(area.spawns.length, 1);
  assert.equal(blank.initialSpawnId, area.spawns[0].id);
  assert.equal(blank.initialAreaId, area.id);
  assert.equal(blank.encounterConfig.families.every(p => p.encounterChancePercent === 0), true);
  assert.ok(blank.terrainFamilies.some(f => f.id === 'plain'));
});

test('blank map presets are editable; export/import faithfully round-trips', () => {
  const blank = createBlankWorldBuilderDraft({
    id: 'mon-monde', width: 1536, height: 1024,
    terrainFamilyId: 'forest', materialId: 'grass.forest'
  });
  assert.equal(blank.id, 'mon-monde');
  assert.equal(blank.areas[0].width, 1536);
  assert.equal(blank.areas[0].height, 1024);
  assert.equal(blank.areas[0].surface.baseMaterialId, 'grass.forest');
  assert.equal(blank.areas[0].surface.baseTerrainFamilyId, 'forest');
  const resized = updateAreaProperties(blank, blank.initialAreaId, {width: 1600});
  const roundTrip = importWorldBuilderDocument(serializeWorldBuilderDraft(resized));
  assert.equal(roundTrip.areas[0].width, 1600);
  assert.equal(roundTrip.areas[0].objects.length, 0);
  assert.deepEqual(roundTrip.terrainFamilies, resized.terrainFamilies);
  assert.equal(validateWorldBuilderDraft(roundTrip).valid, true);
  assert.equal(demoWorldDocument.areas[0].objects.length > 0, true);
  assert.equal(createWorldBuilderDraft(demoWorldDocument).id, demoWorldDocument.id);
});

test('blank map and export remain discoverable on mobile, no second export format', async () => {
  const html = await readFile(new URL('../builder.html', import.meta.url), 'utf8');
  const main = await readFile(new URL('../src/builder/world-builder-main.js', import.meta.url), 'utf8');
  assert.match(html, /id="new-blank-world"/);
  assert.match(html, /id="export-map"/);
  assert.match(html, /id="export-json"/);
  assert.match(html, /id="import-json"/);
  assert.match(main, /createBlankWorldBuilderDraft/);
  assert.match(main, /serializeWorldBuilderDraft\(draft\)/);
  assert.match(main, /function exportWorldDocument\(/);
  assert.match(main, /window\.confirm\(/);
});
