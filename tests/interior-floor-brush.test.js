import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  createWorldBuilderDraft, addSurfacePath, updateAreaProperties,
  serializeWorldBuilderDraft, importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { pointInWorldAreaBoundary } from '../src/world/world-area-geometry.js';
import { normalizeWorldArea } from '../src/world/world-area-model.js';

const floors = ['floor.wood.house','floor.wood.dark','floor.tile.light',
  'floor.tile.sandstone','floor.concrete.gray'];

test('interior floor palette resolves the five real native material IDs and keeps outdoor palettes separate', () => {
  const registry = createMaterialRegistry(materialPackV1);
  const options = registry.list().filter((material) => material.kind === 'surface' && material.id.startsWith('floor.'));
  assert.deepEqual(options.map((item) => item.id), floors);
  assert.ok(options.every((item) => item.assets.base.startsWith('texture.floor.')));
  assert.equal(registry.require('floor.wood.house').id, 'floor.wood.house');
});

test('interior brush reuses canonical WorldArea surface zones and preserves family/movement semantics through JSON', () => {
  const original = demoWorldDocument.areas.find((area) => area.kind === 'interior');
  assert.ok(original, 'a demo interior must exist');
  let draft = createWorldBuilderDraft(demoWorldDocument);
  const family = draft.areas.find((area) => area.id === original.id).surface.baseTerrainFamilyId;
  const speed = draft.terrainFamilies.find((item) => item.id === family)?.traversalModes;
  draft = updateAreaProperties(draft, original.id, { baseMaterialId: floors[0] });
  for (let i=1;i<floors.length;i++) {
    draft = addSurfacePath(draft, original.id, 'terrain', {
      materialId: floors[i], terrainFamilyId: family, width: 36+i*8,
      points: [{x:40+i*30,y:50+i*30},{x:140+i*30,y:80+i*30}]
    });
  }
  const current = draft.areas.find((area) => area.id === original.id);
  assert.equal(current.surface.baseMaterialId, floors[0]);
  assert.deepEqual(current.surface.zones.map((zone)=>zone.materialId), floors.slice(1));
  assert.ok(current.surface.zones.every((zone)=>zone.terrainFamilyId === family));
  const restored = importWorldBuilderDocument(serializeWorldBuilderDraft(draft));
  const interior = restored.areas.find((area) => area.id === original.id);
  assert.equal(interior.surface.baseMaterialId, floors[0]);
  assert.deepEqual(interior.surface.zones.map((zone) => zone.materialId), floors.slice(1));
  assert.deepEqual(restored.terrainFamilies.find((item)=>item.id===family)?.traversalModes, speed);
});

test('indoor paint starts only inside canonical interior shapes, including nonrectangular rooms', () => {
  const area = normalizeWorldArea({
    id:'interior-l', kind:'interior', width:800,height:600,
    boundary:{kind:'polygon',vertices:[
      {x:0,y:0},{x:0.5,y:0},{x:0.5,y:0.5},
      {x:1,y:0.5},{x:1,y:1},{x:0,y:1}]},
    surface:{baseMaterialId:'floor.wood.house'}
  });
  assert.equal(pointInWorldAreaBoundary(area,100,100),true);
  assert.equal(pointInWorldAreaBoundary(area,700,100),false);
});

test('Builder exposes indoor tab only when an interior is selected; outdoor route and river brush remain separate', async () => {
  const html = await readFile(new URL('../builder.html',import.meta.url),'utf8');
  const source = await readFile(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
  for (const id of ['area-open-interior-floors','interior-floor-base','interior-floor-material',
      'interior-floor-brush-size','interior-floor-paint-toggle','interior-floor-undo',
      'interior-floor-zone-select','interior-floor-zone-delete']) {
    assert.match(html, new RegExp('id="'+id+'"'));
  }
  assert.match(html,/data-tab="interior-floor" hidden/);
  assert.match(source,/document\.querySelector\('\[data-tab="interior-floor"\]'\)\.hidden = !interior/);
  assert.match(source,/activateTab\(interior \? 'interior-floor' : 'terrain'\)/);
  assert.match(source,/pointInWorldAreaBoundary\(currentAreaNormalized\(\), point\.x, point\.y\)/);
  assert.match(source,/kind === 'terrain'[\s\S]{0,180}interior\s*\? \$\('interior-floor-material'\)\.value/);
});
