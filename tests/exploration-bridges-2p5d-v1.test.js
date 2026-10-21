import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { listWorldObjectAssets, resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
const families = [["wood_rustic","Pont en bois rustique"],["stone_arch","Pont en pierre voûté"],["old_wood","Vieux pont en bois"],["elegant","Pont élégant"],["castle","Pont de château"],["cobblestone","Pont pavé"],["earth_crossing","Passage de terre"]];
const views = [["horizontal","Horizontal"],["vertical","Vertical"],["diagonal_left","Diagonale gauche"],["diagonal_right","Diagonale droite"]];
const manifest = JSON.parse(await readFile(new URL('../assets/exploration/objects/bridges/manifest.v1.json',import.meta.url),'utf8'));
test('seven bridge families expose native four-direction variants without new runtime authority',()=>{
  const canonical=objectDefinitionCatalogV1.get('objectdef.bridge.wood.rustic_bank.01');
  assert.ok(canonical);
  for(const [family,label] of families){
    const id='objectdef.bridge.'+family+'_2p5d.01';
    const def=objectDefinitionCatalogV1.get(id);
    assert.ok(def,id);
    assert.equal(def.kind,'bridge');
    assert.equal(def.library.categoryId,'bridges');
    assert.deepEqual(def.baseSize,canonical.baseSize,'unchanged bridge dimensions');
    assert.equal(def.traversal.lengthRatio,canonical.traversal.lengthRatio,'unchanged corridor length');
    assert.equal(def.traversal.widthRatio,canonical.traversal.widthRatio,'unchanged corridor width');
    assert.equal(def.traversal.edgeAssistRatio,canonical.traversal.edgeAssistRatio,'unchanged edge assist');
    assert.deepEqual(def.traversal.viewAxesDeg,{horizontal:0,vertical:90,diagonal_left:-45,diagonal_right:45});
    assert.equal(def.visual.defaultVariantId,'horizontal');
    assert.deepEqual(def.visual.variants.map(v=>v.id),views.map(v=>v[0]));
    for(const [view] of views){
      const assetId='object.bridge.'+family+'_2p5d.'+view+'.01';
      assert.equal(def.visual.variants.find(x=>x.id===view)?.assetId,assetId);
      const asset=resolveWorldObjectAsset(assetId);
      assert.equal(asset?.kind,'bridge-visual');
      assert.equal(asset?.path,'./assets/exploration/objects/bridges/bridge_'+family+'_2p5d_'+view+'_01.webp');
    }
  }
  const assetIds=listWorldObjectAssets().filter(a=>a.kind==='bridge-visual').map(a=>a.id);
  assert.equal(assetIds.length,32);
  assert.equal(new Set(assetIds).size,32);
});
test('28 committed transparent 512-square WebP files match manifest SHA-256 bytes RIFF VP8X',async()=>{
  assert.equal(manifest.schemaVersion,1);
  const all=manifest.files;
  assert.equal(all.length,32);
  const variants=all.filter(x=>x.assetId.includes('_2p5d.'));
  assert.equal(variants.length,28);
  for(const item of variants){
    const b=await readFile(new URL('../'+item.path,import.meta.url));
    assert.equal(b.length,item.bytes,item.assetId+' byte count');
    assert.equal(createHash('sha256').update(b).digest('hex'),item.sha256,item.assetId+' sha256');
    assert.equal(b.toString('ascii',0,4),'RIFF');
    assert.equal(b.toString('ascii',8,12),'WEBP');
    assert.equal(b.readUInt32LE(4)+8,b.length,'RIFF size');
    assert.equal(b.toString('ascii',12,16),'VP8X','extended WebP profile');
    assert.ok((b[20]&16)!==0,'alpha flag required');
    const width=1+b[24]+(b[25]<<8)+(b[26]<<16);
    const height=1+b[27]+(b[28]<<8)+(b[29]<<16);
    assert.deepEqual([width,height],[512,512],item.assetId+' dimensions');
  }
});
