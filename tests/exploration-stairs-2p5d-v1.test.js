import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';

const manifest = JSON.parse(await readFile(new URL('../assets/exploration/objects/stairs/manifest.v1.json', import.meta.url), 'utf8'));
const added = manifest.files.filter(file => file.family && file.assetId.includes('_2p5d.'));
const families = ["stone_rustic","stone_temple","wood_rustic","stone_ruins_moss","marble_palace","timber_stone_village","stone_fortress_dark","earth_log_path","stone_cobble_town","stone_cliff_moss"];
const views = ['front','oblique','side'];

test('ten new staircase styles have three native catalog variants without replacing legacy stairs', () => {
  assert.equal(manifest.files.length,33);
  assert.equal(added.length,30);
  assert.equal(new Set(added.map(x=>x.assetId)).size,30);
  for (const family of families) {
    const id = 'objectdef.stairs.'+family+'_2p5d.01';
    const def = objectDefinitionCatalogV1.require(id);
    assert.equal(def.kind,'stairs');
    assert.equal(def.library.categoryId,'stairs');
    assert.equal(def.library.folderId,'stairs/general');
    assert.equal(def.visual.defaultVariantId,'front');
    assert.deepEqual(def.visual.variants.map(v=>v.id),views);
    for(const view of views) {
      const assetId='object.stairs.'+family+'_2p5d.'+view+'.01';
      assert.equal(def.visual.variants.find(x=>x.id===view).assetId,assetId);
      const entry=added.find(x=>x.assetId===assetId);
      assert.ok(entry,assetId);
      assert.equal(resolveWorldObjectAsset(assetId)?.path,'./'+entry.path);
      assert.equal(resolveWorldObjectAsset(assetId)?.kind,'stairs-visual');
    }
  }
  for (const old of ['objectdef.stairs.stone.simple.01','objectdef.stairs.wood.porch.01','objectdef.stairs.stone.grand.01']) assert.ok(objectDefinitionCatalogV1.get(old));
});

test('the 30 committed WebP binaries match SHA-256, length and RIFF structure', async () => {
  for (const entry of added) {
    const bytes=await readFile(new URL('../'+entry.path,import.meta.url));
    assert.equal(bytes.length,entry.bytes,entry.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path);
    assert.equal(bytes.toString('ascii',0,4),'RIFF',entry.path);
    assert.equal(bytes.toString('ascii',8,12),'WEBP',entry.path);
    assert.equal(bytes.readUInt32LE(4)+8,bytes.length,entry.path);
  }
});
