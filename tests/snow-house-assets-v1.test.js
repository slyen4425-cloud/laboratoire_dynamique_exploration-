import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {resolveWorldObjectAsset} from '../src/assets/world-object-asset-adapter.js';
import {resolveObjectLibraryFolder} from '../src/objects/object-library-taxonomy.js';
import {appendSculptPreviewObject, listSculptPlaceableDefinitions, normalizeSculptPreviewObjects,
  serializeSculptPreviewScene, createBlankSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacement} from '../src/world/world-object-placement-model.js';
import {buildingFootprintRect,buildingDoorAnchorWorld} from '../src/world/world-object-model.js';

const manifestUrl = new URL('../assets/exploration/objects/buildings/manifest.snow-houses.v1.json',import.meta.url);
const views=['front','side','back'];

test('10 native winter houses resolve uniquely under Bâtiments > Maisons Neige with 3 canonical views',async()=>{
  const m=JSON.parse(await readFile(manifestUrl,'utf8'));
  assert.equal(m.schemaVersion,1);
  assert.equal(m.packId,'winter-houses-2p5d-10x3-v1');
  assert.equal(m.models.length,10);
  assert.equal(m.files.length,30);
  assert.equal(resolveObjectLibraryFolder('buildings/houses/snow').categoryId,'buildings');
  const ids=new Set();
  const assetPaths=new Set();
  for (const model of m.models) {
    assert.match(model.id,/^[a-z_]+$/);
    const id='objectdef.building.house.snow_'+model.id+'_2p5d.01';
    const def=objectDefinitionCatalogV1.require(id);
    assert.equal(def.kind,'building',id);
    assert.equal(def.library.categoryId,'buildings',id);
    assert.equal(def.library.folderId,'buildings/houses/snow',id);
    assert.equal(def.library.provenance,'native',id);
    assert.equal(def.label.includes('2,5D'),true,id);
    assert.equal(def.visual.defaultVariantId,'front');
    assert.deepEqual(def.visual.variants.map(v=>v.id),views);
    assert.equal(def.visual.assetId,def.visual.variants[0].assetId);
    assert.equal(def.footprint.enabled,true);
    assert.ok(def.footprint.widthRatio>0 && def.footprint.widthRatio<=1);
    assert.ok(def.footprint.heightRatio>0 && def.footprint.heightRatio<=1);
    assert.equal(def.doorAnchors[0].id,'main-door');
    assert.ok(def.baseSize.width>0 && def.baseSize.height>0);
    assert.ok(listSculptPlaceableDefinitions().some(d=>d.id===id));
    const placed=appendSculptPreviewObject([],{definitionId:id,x:120,y:90,scale:.38,variantId:'side'});
    assert.equal(placed.length,1);
    assert.equal(placed[0].overrides.visualVariantId,'side');
    const building=resolveWorldObjectPlacement(placed[0]);
    assert.ok(buildingFootprintRect(building).length>0);
    assert.ok(Number.isFinite(buildingDoorAnchorWorld(building,'main-door').x));
    const scene=createBlankSculptPreviewScene();
    const json=serializeSculptPreviewScene(scene.terrain,placed);
    assert.equal(JSON.parse(json).objects[0].objectDefinitionId,id);
    assert.equal(normalizeSculptPreviewObjects(JSON.parse(json).objects)[0].overrides.visualVariantId,'side');
    for(const view of views){
      const assetId='object.building.house.snow_'+model.id+'_2p5d.'+view+'.01';
      const entry=m.files.find(x=>x.assetId===assetId);
      assert.ok(entry,assetId+': manifest missing');
      assert.equal(entry.view,view);
      assert.equal(entry.perspective,'three-quarter-2.5d');
      assert.equal(entry.width,384);
      assert.equal(entry.height,384);
      assert.equal(ids.has(assetId),false,assetId+': duplicate asset ID');
      assert.equal(assetPaths.has(entry.path),false,entry.path+': duplicate path');
      ids.add(assetId);assetPaths.add(entry.path);
      assert.equal(def.visual.variants.find(v=>v.id===view)?.assetId,assetId);
      const visual=resolveWorldObjectAsset(assetId);
      assert.ok(visual,assetId+': no visual');
      assert.equal(visual.kind,'building-visual');
      assert.equal(visual.path,'./'+entry.path);
    }
  }
  assert.equal(ids.size,30);
});

test('approved ZIP WebPs are exactly the 30 transparent 384x384 RGBA assets, with matching SHA256',async()=>{
 const m=JSON.parse(await readFile(manifestUrl,'utf8'));
 for(const entry of m.files){
   const raw=await readFile(new URL('../'+entry.path,import.meta.url));
   assert.equal(raw.length,entry.bytes,entry.assetId+': bytes');
   assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256,entry.assetId+': hash');
   assert.equal(raw.toString('ascii',0,4),'RIFF');
   assert.equal(raw.toString('ascii',8,12),'WEBP');
   assert.equal(raw.toString('ascii',12,16),'VP8X');
   assert.equal(raw.readUInt32LE(4)+8,raw.length);
   assert.equal((raw[20]&0x10)!==0,true,entry.assetId+': transparency');
   assert.equal(raw.readUIntLE(24,3)+1,384,entry.assetId+': width');
   assert.equal(raw.readUIntLE(27,3)+1,384,entry.assetId+': height');
 }
});

test('existing temperate houses and multi-view 2.5D definitions are preserved',()=>{
 const former=['objectdef.building.house.blue_cottage_2p5d.01',
   'objectdef.building.house.green_moss_2p5d.01',
   'objectdef.building.house.red_tile_2p5d.01',
   'objectdef.building.inn.golden_thatch_2p5d.01'];
 for(const id of former){
   const def=objectDefinitionCatalogV1.require(id);
   assert.equal(def.kind,'building');
   assert.ok(resolveWorldObjectAsset(def.visual.assetId));
   assert.ok(def.visual.variants.length>=3);
 }
});
