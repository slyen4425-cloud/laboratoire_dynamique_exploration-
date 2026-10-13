import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { createSurfaceRenderer } from '../src/render/surface-renderer.js';
import { createUserMaterialRecord, materialDefinitionFromUserRecord } from '../src/materials/user-material-library.js';
import { surfaceMaterialsForFamily, preferredSurfaceMaterial } from '../src/materials/terrain-family-materials.js';

const surfaces = materialPackV1.materials.filter(m => m.kind === 'surface');

test('showcase texture is classified by gameplay family, not globally listed under grass', () => {
  for (const [family, id] of [
    ['plain', 'grass.forest'], ['forest', 'ground.forest_floor'],
    ['sand', 'ground.sand'], ['snow', 'ground.snow'],
    ['mountain', 'ground.mountain_rock'],
    ['volcano', 'ground.volcanic_ash_lava']
  ]) {
    const options = surfaceMaterialsForFamily(surfaces, family);
    assert.ok(options.some(item => item.id === id), `${family} must offer ${id}`);
    assert.equal(preferredSurfaceMaterial(surfaces, family), id);
  }
  assert.equal(surfaceMaterialsForFamily(surfaces, 'sand').some(m => m.id === 'grass.forest'), false);
  assert.equal(preferredSurfaceMaterial(surfaces, 'sand', 'grass.forest'), 'ground.sand');
  assert.equal(preferredSurfaceMaterial(surfaces, 'sand', 'ground.sand'), 'ground.sand');
  assert.equal(preferredSurfaceMaterial(surfaces, 'unknown-new-family'), null);
});

test('user surface import stores its chosen family and composes with same Material Registry', () => {
  const blob = new Blob(['sample'], { type: 'image/png' });
  const record = createUserMaterialRecord({
    idToken: 'dune', kind: 'surface', label: 'Dunes',
    terrainFamilyId: 'sand', mimeType: 'image/png',
    width: 256, height: 256, bytes: blob.size, blob,
    sourceName: 'dunes.png'
  });
  assert.equal(record.terrainFamilyId, 'sand');
  const material = materialDefinitionFromUserRecord(record);
  assert.equal(material.terrainFamilyId, 'sand');
  const registered = createMaterialRegistry({
    ...materialPackV1, materials: [...materialPackV1.materials, material]
  }).list();
  assert.equal(registered.find(x => x.id === material.id).terrainFamilyId, 'sand');
  assert.deepEqual(
    surfaceMaterialsForFamily(registered, 'sand').map(x => x.id).includes(material.id), true
  );
  assert.equal(surfaceMaterialsForFamily(registered, 'forest').some(x => x.id === material.id), false);
});

test('empty surface does not allocate costly world-sized feather mask canvases', () => {
  let allocated = 0;
  const registry = createMaterialRegistry({
    schemaVersion: 1, materials: [{
      id: 'flat', kind: 'surface', label: 'Flat',
      assets: { base: null, decals: [] },
      render: { baseColor: '#aaa', variationColors: [], detailSpacing: 0, decalSpacing: 0 }
    }],
    surfaceTransition: {mode:'feather',method:'smooth-mask'}
  });
  const renderer = createSurfaceRenderer({
    materialRegistry: registry,
    canvasFactory() { allocated++; throw new Error('No masks required for an empty map'); }
  });
  const ctx = {fillRect(){},save(){},restore(){},createPattern(){return null}};
  renderer.draw(ctx, {
    camera:{x:0,y:0}, viewport:{width:4000,height:3000},
    surface:{baseMaterialId:'flat',zones:[],routes:[],rivers:[]}
  });
  assert.equal(allocated, 0);
});

test('Builder binds family change to associated visual material and queues pointer samples per frame', async () => {
  const html = await readFile(new URL('../builder.html', import.meta.url), 'utf8');
  const builder = await readFile(new URL('../src/builder/world-builder-main.js', import.meta.url), 'utf8');
  assert.match(html, /id="user-texture-family"/);
  assert.match(builder, /preferredSurfaceMaterial/);
  assert.match(builder, /surfaceMaterialsForFamily/);
  assert.match(builder, /function flushPendingPaintPoint\(/);
  const move = builder.slice(builder.indexOf("canvas.addEventListener('pointermove'"),builder.indexOf("canvas.addEventListener('pointerleave'"));
  assert.match(move, /pendingPaintPoint\s*=/);
  assert.doesNotMatch(move, /appendDrawPoint\(\s*pointerSession.kind,\s*pointerSession.pathId,\s*world\s*\)/);
});
