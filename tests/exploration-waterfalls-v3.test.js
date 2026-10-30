import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
import { worldObjectAnimationFrame,drawWorldObjectSprite } from '../src/render/world-object-frame-selector.js';
const manifest=JSON.parse(await readFile(new URL('../assets/exploration/objects/waterfalls/manifest.v1.json',import.meta.url),'utf8'));
test('V3 20 unique assets and 4 world objects with 5 palette variants',()=>{
 assert.equal(manifest.files.length,20);
 assert.equal(new Set(manifest.files.map(f=>f.assetId)).size,20);
 for(const view of ['front_wide','side_narrow','three_quarter','tiered']){
  const def=objectDefinitionCatalogV1.require('objectdef.waterfall.'+view+'.01');
  assert.equal(def.kind,'decor');assert.equal(def.library.folderId,'decor/general');
  assert.equal(def.visual.variants.length,5);assert.equal(def.collision,undefined);
  for(const variant of def.visual.variants){
   const asset=resolveWorldObjectAsset(variant.assetId);
   assert.ok(asset);assert.equal(asset.kind,'decor-visual');
   assert.equal(asset.animation.frames,16);assert.equal(asset.animation.columns,4);
   assert.equal(asset.animation.fps,12);
   const item=manifest.files.find(x=>x.assetId===variant.assetId);
   assert.ok(item);assert.equal(asset.path,'./'+item.path);
  }
 }
});
test('V3 sprite atlas SHA-256, length, RIFF integrity on Git-committed data',async()=>{
 for(const file of manifest.files){
  const bytes=await readFile(new URL('../'+file.path,import.meta.url));
  assert.equal(bytes.length,file.bytes,file.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
 }
});
test('frame selection advances with time, wraps, and preserves static draw semantics',()=>{
 const asset=resolveWorldObjectAsset('object.waterfall.front_wide.clear_blue.flow.01');
 assert.deepEqual(worldObjectAnimationFrame(asset,0),{index:0,x:0,y:0,width:256,height:256});
 assert.deepEqual(worldObjectAnimationFrame(asset,4/12),{index:4,x:0,y:256,width:256,height:256});
 assert.equal(worldObjectAnimationFrame(asset,16/12).index,0);
 const calls=[];const ctx={drawImage(...args){calls.push(args)}};
 drawWorldObjectSprite(ctx,{},asset,{x:1,y:2,width:180,height:240},4/12);
 assert.deepEqual(calls[0].slice(1),[0,256,256,256,1,2,180,240]);
 drawWorldObjectSprite(ctx,{},resolveWorldObjectAsset('object.relief.waterfall.blue.01'),{x:1,y:2,width:3,height:4},0);
 assert.deepEqual(calls[1].slice(1),[1,2,3,4]);
});
