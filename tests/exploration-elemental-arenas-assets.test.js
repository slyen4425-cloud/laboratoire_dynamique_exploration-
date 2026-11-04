import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
import { resolveObjectLibraryFolder } from '../src/objects/object-library-taxonomy.js';
import { normalizeWorldObjectPlacements, resolveWorldObjectPlacement } from '../src/world/world-object-placement-model.js';
import { worldObjectObstacleRect } from '../src/world/world-object-model.js';

const ELEMENTS = ['nature','feu','eau','air','terre','foudre','glace','lumiere','tenebres','arcane'];
const folderId = 'buildings/arenas/elemental';

test('10 elemental arenas have one official native definition and visual each', async () => {
  assert.equal(resolveObjectLibraryFolder(folderId)?.categoryId, 'buildings');
  const manifest = JSON.parse(await readFile(new URL('../assets/exploration/objects/buildings/manifest.v1.json', import.meta.url), 'utf8'));
  const items = manifest.files.filter(entry => entry.family === 'elemental-arena');
  assert.equal(items.length, 10, 'One official entry for each arena');
  for (const element of ELEMENTS) {
    const id = `objectdef.building.arena.element.${element}.01`;
    const assetId = `object.building.arena.element.${element}.01`;
    const definition = objectDefinitionCatalogV1.get(id);
    const asset = resolveWorldObjectAsset(assetId);
    assert.equal(definition?.kind, 'building', id);
    assert.equal(definition.library.folderId, folderId);
    assert.equal(definition.visual.assetId, assetId);
    assert.equal(definition.footprint?.enabled, false, 'Arena art must not create an invented collision');
    assert.deepEqual(definition.doorAnchors ?? [], [], 'No fake usable portals');
    assert.equal(asset?.kind, 'building-visual', assetId);
    const entry = items.find(item => item.assetId === assetId);
    assert.ok(entry, assetId);
    assert.equal(asset.path, './' + entry.path);
    const webp = await readFile(new URL('../' + entry.path, import.meta.url));
    assert.equal(webp.length, entry.bytes, assetId + ' bytes');
    assert.equal(createHash('sha256').update(webp).digest('hex'), entry.sha256, assetId + ' hash');
    assert.equal(webp.subarray(0, 4).toString('ascii'), 'RIFF', assetId);
    assert.equal(webp.subarray(8, 12).toString('ascii'), 'WEBP', assetId);
    assert.equal(webp.readUInt32LE(4) + 8, webp.length, assetId + ' size');
    const png = await readFile(new URL('../assets/exploration/objects/buildings/arenas/arena_' + element + '_2p5d.png', import.meta.url));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', assetId + ' PNG');
    assert.equal(png.readUInt32BE(16), 512, assetId + ' PNG width');
    assert.equal(png.readUInt32BE(20), 512, assetId + ' PNG height');
    assert.equal(png[25], 6, assetId + ' PNG RGBA');
    const placement = resolveWorldObjectPlacement(
      normalizeWorldObjectPlacements([{ id: 'test-'+element, objectDefinitionId: id, transform: {x:100,y:100,rotationDeg:0,scaleX:1,scaleY:1} }])[0]
    );
    assert.equal(placement.visual.assetId, assetId);
    assert.equal(worldObjectObstacleRect(placement), null, 'No collision until explicit arena geometry is authored');
  }
});
