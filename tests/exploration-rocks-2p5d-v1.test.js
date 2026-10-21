import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { listWorldObjectAssets, resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
const manifest=JSON.parse(await readFile(new URL('../assets/exploration/objects/rocks/manifest.v1.json',import.meta.url),'utf8'));
const additions=manifest.files.filter(x=>['desert','gray','moss','volcanic','fantasy'].includes(x.family));
test('20 native 2.5D rocks in 5 families reuse the Rock catalog and semantic adapter',()=>{
 assert.equal(additions.length,20);
 assert.equal(new Set(additions.map(x=>x.assetId)).size,20);
 for(const family of ['desert','gray','moss','volcanic','fantasy'])assert.equal(additions.filter(x=>x.family===family).length,4);
 for(const entry of additions){
  const asset=resolveWorldObjectAsset(entry.assetId);
  assert.ok(asset,entry.assetId); assert.equal(asset.kind,'rock-visual'); assert.equal(asset.path,'./'+entry.path);
  const id=entry.assetId.replace(/^object\\.rock\\./,'objectdef.rock.');
  const def=objectDefinitionCatalogV1.get(id);
  assert.ok(def,id); assert.equal(def.kind,'rock'); assert.equal(def.library.categoryId,'rocks'); assert.equal(def.library.folderId,'rocks/general');
  assert.equal(def.visual.assetId,entry.assetId); assert.equal(def.collision.role,'obstacle');
 }
});
test('new 2.5D rock byte lengths and SHA-256 match committed WebP RIFF files',async()=>{
 for(const entry of additions){
  const bytes=await readFile(new URL('../'+entry.path,import.meta.url));
  assert.equal(bytes.length,entry.bytes,entry.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',entry.path);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',entry.path);
  assert.equal(bytes.readUInt32LE(4)+8,bytes.length,entry.path);
 }
});
