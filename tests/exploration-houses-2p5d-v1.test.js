import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {resolveWorldObjectAsset} from '../src/assets/world-object-asset-adapter.js';
const families = [
  {
    "name": "blue_cottage",
    "family": "house",
    "views": [
      "front",
      "oblique",
      "side",
      "back"
    ]
  },
  {
    "name": "red_tile",
    "family": "house",
    "views": [
      "front",
      "oblique",
      "side",
      "back"
    ]
  },
  {
    "name": "green_moss",
    "family": "house",
    "views": [
      "front",
      "oblique",
      "side",
      "back"
    ]
  },
  {
    "name": "golden_thatch",
    "family": "inn",
    "views": [
      "front",
      "oblique",
      "side",
      "back"
    ]
  },
  {
    "name": "purple_ivy",
    "family": "house",
    "views": [
      "front",
      "oblique",
      "side",
      "back"
    ]
  },
  {
    "name": "terracotta",
    "family": "house",
    "views": [
      "oblique",
      "side",
      "back"
    ]
  }
];
const manifest = JSON.parse(await readFile(new URL('../assets/exploration/objects/buildings/manifest.v1.json',import.meta.url),'utf8'));
test('six new 2.5D houses resolve in the native building catalog and reuse the existing variant pipeline',()=>{
 for(const item of families){
  const id='objectdef.building.'+item.family+'.'+item.name+'_2p5d.01';
  const def=objectDefinitionCatalogV1.get(id);
  assert.ok(def,id);assert.equal(def.kind,'building');
  assert.equal(def.library.categoryId,'buildings');
  assert.deepEqual(def.visual.variants.map(v=>v.id),item.views);
  for(const v of item.views){
   const asset='object.building.'+item.family+'.'+item.name+'_2p5d.'+v+'.01';
   assert.equal(def.visual.variants.find(x=>x.id===v).assetId,asset);
   assert.equal(resolveWorldObjectAsset(asset)?.path,'./assets/exploration/objects/buildings/building_'+item.family+'_'+item.name+'_'+v+'_01.webp');
  }
 }
});
test('all 23 2.5D building visuals are complete, alpha-capable WebP assets with manifest hashes',async()=>{
 const entries=manifest.files.filter(x=>x.assetId.includes('_2p5d.'));
 assert.equal(entries.length,23);
 for(const item of entries){
   const bytes=await readFile(new URL('../'+item.path,import.meta.url));
   assert.equal(bytes.length,item.bytes,item.assetId+' bytes');
   assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.assetId+' SHA-256');
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'RIFF size');
   assert.equal(bytes.toString('ascii',12,16),'VP8X','RGBA WebP extended header');
   assert.ok((bytes[20]&0x10)!==0,'alpha flag');
 }
});
