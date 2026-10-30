import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {listWorldObjectAssets,resolveWorldObjectAsset} from '../src/assets/world-object-asset-adapter.js';
import {listSculptPlaceableDefinitions,appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveObjectLibraryFolder} from '../src/objects/object-library-taxonomy.js';
const manifest=JSON.parse(await readFile(new URL('../assets/exploration/objects/trees/manifest.generated-trees.v1.json',import.meta.url),'utf8'));
const ids=['forest.pine_dense','forest.spruce_tall','forest.broadleaf','fantasy.blossom','fantasy.ancient_twist'];
test('generated 2.5D trees integrate with native Vegetation and Sculpt catalogue',()=>{
 assert.equal(manifest.files.length,5);
 assert.equal(resolveObjectLibraryFolder('vegetation/trees').categoryId,'vegetation');
 for(const suffix of ids){
  const id='object.tree.'+suffix+'.01', defId='objectdef.tree.'+suffix+'.01';
  const entry=manifest.files.find(x=>x.assetId===id),def=objectDefinitionCatalogV1.get(defId);
  assert.ok(entry);assert.ok(def);assert.equal(def.kind,'tree');
  assert.equal(def.library.categoryId,'vegetation');assert.equal(def.library.folderId,'vegetation/trees');
  assert.equal(def.visual.assetId,id);assert.equal(resolveWorldObjectAsset(id).path,'./'+entry.path);
  assert.ok(listWorldObjectAssets().some(a=>a.id===id));
  assert.ok(listSculptPlaceableDefinitions().some(d=>d.id===defId));
  assert.equal(appendSculptPreviewObject([],{definitionId:defId,x:100,y:100,scale:.38}).length,1);
 }
});
test('generated tree WebP files are complete GitHub binaries with exact hashes',async()=>{
 for(const entry of manifest.files){
  const raw=await readFile(new URL('../'+entry.path,import.meta.url));
  assert.equal(raw.length,entry.bytes,entry.assetId+': byte count');
  assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256,entry.assetId+': sha256');
  assert.equal(raw.toString('ascii',0,4),'RIFF');assert.equal(raw.toString('ascii',8,12),'WEBP');
  assert.equal(raw.readUInt32LE(4)+8,raw.length,entry.assetId+': RIFF length');
  assert.equal(entry.view,'three-quarter-2.5d');
 }
});
