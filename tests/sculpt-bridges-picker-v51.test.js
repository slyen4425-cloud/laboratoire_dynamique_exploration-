import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {listSculptPlaceableDefinitions,sculptPreviewVariants,
  appendSculptPreviewObject,updateSculptPreviewObject,
  serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {resolveWorldObjectAsset} from '../src/assets/world-object-asset-adapter.js';

const families=['wood_rustic','stone_arch','old_wood','elegant','castle','cobblestone','earth_crossing'];
const views=['horizontal','vertical','diagonal_left','diagonal_right'];

test('V51 Sculpt palette exposes seven canonical multi-view bridges, not a duplicate registry',()=>{
  const definitions=listSculptPlaceableDefinitions();
  const bridges=definitions.filter(def=>def.kind==='bridge');
  for(const family of families){
    const id='objectdef.bridge.'+family+'_2p5d.01';
    const definition=bridges.find(def=>def.id===id);
    assert.ok(definition,'missing bridge '+family);
    assert.equal(definition,objectDefinitionCatalogV1.get(id));
    assert.deepEqual(sculptPreviewVariants(id).map(v=>v.id),views);
    for(const view of sculptPreviewVariants(id))
      assert.ok(resolveWorldObjectAsset(view.assetId),'missing bridge art '+view.assetId);
  }
  for(const kind of ['building','tree','rock'])
    assert.ok(definitions.some(def=>def.kind===kind),'legacy kind preserved '+kind);
  assert.ok(!definitions.some(def=>def.id.startsWith('objectdef.relief.')));
});

test('V51 bridge placements keep canonical WorldObject variant, rotation, undo-compatible JSON',()=>{
  const terrain=createSculptTerrain({width:20,height:16});
  const legacy=serializeSculptTerrain(terrain);
  const id='objectdef.bridge.wood_rustic_2p5d.01';
  let placements=appendSculptPreviewObject([],{definitionId:id,x:170,y:140,scale:.6,
    rotationDeg:45,variantId:'diagonal_left'});
  assert.equal(placements.length,1);
  assert.equal(placements[0].overrides.visualVariantId,'diagonal_left');
  assert.equal(resolveWorldObjectPlacements(placements,objectDefinitionCatalogV1)[0].visual.assetId,
    'object.bridge.wood_rustic_2p5d.diagonal_left.01');
  placements=updateSculptPreviewObject(placements,placements[0].id,{variantId:'vertical'});
  assert.equal(resolveWorldObjectPlacements(placements,objectDefinitionCatalogV1)[0].visual.assetId,
    'object.bridge.wood_rustic_2p5d.vertical.01');
  const imported=importSculptPreviewScene(serializeSculptPreviewScene(terrain,placements));
  assert.deepEqual(imported.objects,placements);
  assert.equal(serializeSculptTerrain(imported.terrain),legacy);
  assert.equal(importSculptPreviewScene(legacy).objects.length,0);
});

test('V51 mobile object picker includes bridges and native placement over authored water',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/<option value="bridge">[^<]*Ponts<\/option>/);
  assert.match(html,/id="object-variant-wrap"[^>]*>Vue \/ orientation/);
  assert.match(js,/const definition=objectDefinitionCatalogV1.get\(definitionId\)/);
  assert.match(js,/sculptObjectCanOccupyCell\\(terrain,definitionId,cell\\.x,cell\\.y\\)/);
  assert.match(js,/sculptPreviewVariants\(definitionId\)/);
  assert.match(js,/categories:\[\.\.\.\$\('object-category'\)\.options\]/);
});
