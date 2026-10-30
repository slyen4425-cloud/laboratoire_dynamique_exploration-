import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const htmlUrl = new URL('../builder.html', import.meta.url);
const mainUrl = new URL(
  '../src/builder/world-builder-main.js',
  import.meta.url
);
const runtimeUrl = new URL('../src/main.js', import.meta.url);

test('Builder exposes one user texture management panel while canonical paint selectors remain authoritative', async () => {
  const html = await readFile(htmlUrl, 'utf8');

  for (const id of [
    'user-texture-name',
    'user-texture-kind',
    'user-texture-file',
    'user-texture-import',
    'user-texture-library',
    'user-texture-delete',
    'user-texture-status',
    'terrain-paint-material',
    'terrain-route-material',
    'terrain-river-material'
  ]) {
    assert.match(
      html,
      new RegExp(`id=["']${id}["']`)
    );
  }

  assert.match(
    html,
    /accept=["'][^"']*image\/png[^"']*image\/jpeg[^"']*image\/webp/
  );
  assert.equal(
    /user-texture-paint-select/.test(html),
    false,
    'user imports must join canonical material selectors rather than create a second paint catalog'
  );
});

test('Builder and runtime both rebuild the same composed user material pipeline', async () => {
  const [builder, runtime] = await Promise.all([
    readFile(mainUrl, 'utf8'),
    readFile(runtimeUrl, 'utf8')
  ]);

  for (const source of [builder, runtime]) {
    assert.match(source, /createUserMaterialStore/);
    assert.match(source, /composeMaterialPackWithUserMaterials/);
    assert.match(source, /createUserMaterialAssetResolver/);
    assert.match(source, /createMaterialAssetResolver/);
  }

  assert.match(builder, /rebuildMaterialPipeline/);
  assert.match(builder, /countMaterialReferences/);
});
