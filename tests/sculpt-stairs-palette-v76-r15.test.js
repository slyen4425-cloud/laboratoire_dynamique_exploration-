import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {resolveWorldObjectAsset} from '../src/assets/world-object-asset-adapter.js';
import {resolveWorldObjectPlacement} from '../src/world/world-object-placement-model.js';
import {listSculptPlaceableDefinitions,sculptObjectCanOccupyCell,
  sculptPreviewVariants,appendSculptPreviewObject,updateSculptPreviewObject,
  normalizeSculptPreviewObjects,serializeSculptPreviewScene,importSculptPreviewScene}
  from '../src/world/sculpt-scene-preview.js';

const families=['stone_rustic','stone_temple','wood_rustic','stone_ruins_moss',
  'marble_palace','timber_stone_village','stone_fortress_dark','earth_log_path',
  'stone_cobble_town','stone_cliff_moss'];
const stairId=family=>'objectdef.stairs.'+family+'_2p5d.01';

test('R15: all ten native stair designs appear as placeable Sculpt WorldObjects',()=>{
  const definitions=listSculptPlaceableDefinitions();
  const catalogueIds=new Set(definitions.map(def=>def.id));
  const terrain=createSculptTerrain({width:8,height:8});
  for(const family of families){
    const id=stairId(family);
    assert.ok(catalogueIds.has(id),'visible in the existing Object palette: '+id);
    const definition=objectDefinitionCatalogV1.require(id);
    assert.equal(definition.kind,'stairs');
    assert.equal(definition.library.folderId,'stairs/general');
    const variants=sculptPreviewVariants(id);
    assert.deepEqual(variants.map(v=>v.id),['front','oblique','side']);
    for(const view of variants)
      assert.equal(resolveWorldObjectAsset(view.assetId)?.kind,'stairs-visual');
    assert.equal(sculptObjectCanOccupyCell(terrain,id,3,3),true);
  }
  for(const old of ['objectdef.stairs.stone.simple.01',
    'objectdef.stairs.wood.porch.01','objectdef.stairs.stone.grand.01'])
    assert.ok(catalogueIds.has(old),'historical stairs remain available');
  assert.ok(catalogueIds.has('objectdef.bridge.stone_arch_2p5d.01'),
    'existing bridge remains available');
});

test('R15: stairs use native placement, variant, move and scene save/load',()=>{
  const terrain=createSculptTerrain({width:8,height:8});
  const id=stairId('stone_rustic');
  const initial=appendSculptPreviewObject([],{definitionId:id,x:98,y:73.5,
    scale:.4,variantId:'oblique'});
  assert.equal(initial.length,1);
  assert.equal(initial[0].objectDefinitionId,id);
  assert.equal(initial[0].overrides.visualVariantId,'oblique');
  assert.equal(resolveWorldObjectPlacement(initial[0]).visual.assetId,
    'object.stairs.stone_rustic_2p5d.oblique.01');
  const changed=updateSculptPreviewObject(initial,initial[0].id,
    {x:119,y:90,variantId:'side',rotationDeg:45});
  assert.equal(changed[0].transform.x,119);
  assert.equal(changed[0].transform.y,90);
  assert.equal(resolveWorldObjectPlacement(changed[0]).visual.assetId,'object.stairs.stone_rustic_2p5d.side.01');
  assert.equal(changed[0].transform.rotationDeg,45);
  assert.deepEqual(normalizeSculptPreviewObjects(changed),changed);
  const loaded=importSculptPreviewScene(serializeSculptPreviewScene(terrain,changed));
  assert.equal(loaded.objects[0].objectDefinitionId,id);
  assert.equal(loaded.objects[0].overrides.visualVariantId,'side');
  assert.equal(loaded.objects[0].transform.x,119);
  assert.deepEqual(loaded.terrain.levels,terrain.levels);
});

test('R15: stairs remain dry-ground-only and no terrain or collision owner is changed',()=>{
  const wet=Array(64).fill(-1);wet[3*8+3]=4;
  const terrain=createSculptTerrain({width:8,height:8,waterLevels:wet});
  const id=stairId('marble_palace');
  assert.equal(sculptObjectCanOccupyCell(terrain,id,3,3),false);
  assert.equal(sculptObjectCanOccupyCell(terrain,id,2,3),true);
  assert.equal(sculptObjectCanOccupyCell(terrain,'objectdef.bridge.stone_arch_2p5d.01',3,3),true);
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/<option value="stairs">🪜 Escaliers<\/option>/);
  assert.match(main,/availableObjects=listSculptPlaceableDefinitions\(\)/);
  assert.match(main,/sculpt-scene-preview\.js\?rev=[^']*stairs-visible-r15/);
  assert.match(html,/sculpt-lab-main\.js\?rev=[^"]*stairs-visible-r15/);
});
