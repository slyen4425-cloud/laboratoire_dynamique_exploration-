import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
import { resolveObjectLibraryFolder } from '../src/objects/object-library-taxonomy.js';
import { worldObjectAnimationFrame } from '../src/render/world-object-frame-selector.js';
import { appendSculptPreviewObject, listSculptPlaceableDefinitions } from '../src/world/sculpt-scene-preview.js';

const catalogPath = new URL('../assets/exploration/objects/animated/manifest.v1.json', import.meta.url);
test('moulin et éolienne sont sélectionnables, animés en 3 vues sans doubler l’autorité des assets',async()=>{
  const manifest=JSON.parse(await readFile(catalogPath,'utf8'));
  assert.equal(manifest.animations.length,6);
  const folder=resolveObjectLibraryFolder('buildings/utility/wind');
  assert.equal(folder?.categoryId,'buildings');
  for(const family of ['windmill','wind_turbine']){
    const defId='objectdef.building.'+family+'.01';
    const def=objectDefinitionCatalogV1.require(defId);
    assert.equal(def.kind,'building');
    assert.equal(def.library.folderId,folder.id);
    assert.equal(def.footprint?.enabled,false);
    assert.deepEqual(def.doorAnchors,[]);
    assert.ok(listSculptPlaceableDefinitions().some(o=>o.id===defId));
    assert.equal(def.visual.variants.length,3);
    const placement=appendSculptPreviewObject([],{definitionId:defId,x:100,y:100});
    assert.equal(placement.length,1);
    for(const view of ['front','three_quarters_left','three_quarters_right']){
      const entry=manifest.animations.find(o=>o.family===family&&o.view===view);
      assert.ok(entry);
      assert.ok(def.visual.variants.some(v=>v.id===view&&v.assetId===entry.id));
      const asset=resolveWorldObjectAsset(entry.id);
      assert.ok(asset);
      assert.equal(asset.kind,'building-visual');
      assert.equal(asset.path,'./'+entry.runtimeAtlas.path);
      assert.deepEqual({...asset.animation},entry.runtimeAtlas.animation);
      assert.equal(worldObjectAnimationFrame(asset,0).index,0);
      assert.equal(worldObjectAnimationFrame(asset,.11).index,1);
      assert.equal(worldObjectAnimationFrame(asset,1.3).index,1);
    }
  }
});
