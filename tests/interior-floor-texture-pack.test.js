import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  createWorldBuilderDraft, updateAreaProperties,
  serializeWorldBuilderDraft, importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';

const FLOOR_IDS = ['floor.wood.house', 'floor.wood.dark', 'floor.tile.light',
  'floor.tile.sandstone', 'floor.concrete.gray'];

test('5 native indoor surfaces resolve through Material Registry to one texture each', () => {
  const registry = createMaterialRegistry(materialPackV1);
  for (const id of FLOOR_IDS) {
    const material = registry.require(id, 'surface');
    assert.match(material.assets.base, /^texture\\.floor\\./);
    assert.ok(material.label);
  }
  assert.equal(demoWorldDocument.areas.find((area) => area.kind === 'interior').surface.baseMaterialId, 'floor.wood.house');
});

test('all floors survive Builder draft -> canonical JSON -> reload with ID preserved', () => {
  const interior = demoWorldDocument.areas.find((area) => area.kind === 'interior');
  assert.ok(interior);
  for (const materialId of FLOOR_IDS) {
    const draft = updateAreaProperties(createWorldBuilderDraft(demoWorldDocument), interior.id, { baseMaterialId: materialId });
    const exported = serializeWorldBuilderDraft(draft);
    const restored = importWorldBuilderDocument(exported);
    assert.equal(restored.areas.find((area) => area.id === interior.id).surface.baseMaterialId, materialId);
  }
});

test('existing indoor selector lists floor materials first, while exterior family filters remain', async () => {
  const source = await readFile(new URL('../src/builder/world-builder-main.js', import.meta.url), 'utf8');
  assert.match(source, /area\\.kind === 'interior'[\\s\\S]{0,150}surfaceMaterials\\.filter\\(\\(material\\) => material\\.id\\.startsWith\\('floor\\.'/);
  assert.match(source, /: surfaceMaterialsForFamily\\(surfaceMaterials, familyId, families\\)/);
});
