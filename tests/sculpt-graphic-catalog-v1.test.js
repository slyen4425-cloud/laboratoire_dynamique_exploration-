import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptGraphicCatalog,loadSculptGraphicCatalog,assertSculptWorldGraphicsAvailableV1} from '../src/assets/sculpt-graphic-catalog-v1.js';
import {createUserWorldObjectRecord} from '../src/objects/user-object-library.js';
import {createUserMaterialRecord} from '../src/materials/user-material-library.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument,validateWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createExplorationWorldDocumentLibraryV1} from '../src/builder/exploration-world-document-library-v1.js';
import {sculptWorldAreaScene,saveSculptWorldArea,snapshotSculptWorldAreaForRecovery} from '../src/builder/sculpt-world-area-link.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {appendSculptSurfaceStroke} from '../src/world/sculpt-surface-paint.js';
const blob=new Blob(['fixture'],{type:'image/png'}),image={blob,bytes:blob.size,mimeType:blob.type,width:32,height:32};
const object=createUserWorldObjectRecord({...image,idToken:'personal',kind:'decor',label:'Statue',categoryId:'decor',folderId:'decor/general',collisionRole:'obstacle'});
const material=createUserMaterialRecord({...image,idToken:'personal',kind:'surface',label:'Herbe',terrainFamilyId:'forest'});
function urls(){let serial=0;const revoked=[];return {revoked,createObjectURL:()=> 'blob:fixture-'+ ++serial,revokeObjectURL:u=>revoked.push(u)};}
test('one composed projection serves native and user assets, collision and materials; dispose releases URLs',async()=>{
 const urlApi=urls();
 const g=await loadSculptGraphicCatalog({objectStore:{list:async()=>[object]},materialStore:{list:async()=>[material]},urlApi});
 assert.ok(g.catalog.get('objectdef.building.house.blue_cottage.01'));
 assert.equal(g.catalog.get(object.definitionId).collision.role,'obstacle');
 assert.deepEqual(g.collisionCatalog.get(object.definitionId),g.catalog.get(object.definitionId));
 assert.equal(g.resolveObjectAsset(object.assetId).path,'blob:fixture-1');
 assert.equal(g.resolveMaterialAsset(material.assetId).path,'blob:fixture-2');
 assert.equal(g.personalSurfaceChoices[0].id,material.id);
 g.dispose();assert.equal(urlApi.revoked.length,2);
 await assert.rejects(loadSculptGraphicCatalog({objectStore:{list:async()=>{throw Error('store unavailable');}},materialStore:{list:async()=>[]},urlApi}),/store unavailable/);
});
test('WorldArea adapter preserves personal references and refuses missing resources without modifying original world',()=>{
 const g=createSculptGraphicCatalog({objectRecords:[object],materialRecords:[material],urlApi:urls()});
 try{
  const world=createBlankWorldBuilderDraft({id:'personal-test',width:8*28,height:8*21});
  const area=world.areas[0],scene=sculptWorldAreaScene(area,g);
  const edited={...scene,objects:appendSculptPreviewObject(scene.objects,{definitionId:object.definitionId,x:100,y:80},g.catalog),
   surface:appendSculptSurfaceStroke(scene.surface,{materialId:material.id,points:[{x:40,y:50}]},g.materialRegistry)};
  const saved=saveSculptWorldArea(world,area.id,edited,g);
  assert.deepEqual(sculptWorldAreaScene(saved.areas[0],g).objects,edited.objects);
  assert.deepEqual(sculptWorldAreaScene(saved.areas[0],g).surface,edited.surface);
  assert.deepEqual(saved.portals,world.portals);
  assert.equal(world.areas[0].objects.length,0);
  assert.throws(()=>sculptWorldAreaScene(saved.areas[0]),/personnelle manquante/);
  assert.throws(()=>snapshotSculptWorldAreaForRecovery(world,area.id,edited),/personnelle manquante/);
 }finally{g.dispose();}
});

test('portable WorldDocument archive preserves personal IDs before library restoration; explicit runtime validation remains strict',()=>{
 const g=createSculptGraphicCatalog({objectRecords:[object],materialRecords:[material],urlApi:urls()});
 try{
  const world=createBlankWorldBuilderDraft({id:'personal-portable-test',width:8*28,height:8*21});
  const area=world.areas[0],scene=sculptWorldAreaScene(area,g);
  const edited={...scene,objects:appendSculptPreviewObject(scene.objects,{definitionId:object.definitionId,x:100,y:80},g.catalog),
   surface:appendSculptSurfaceStroke(scene.surface,{materialId:material.id,points:[{x:40,y:50}]},g.materialRegistry)};
  const saved=saveSculptWorldArea(world,area.id,edited,g);
  const serialized=serializeWorldBuilderDraft(saved);
  const imported=importWorldBuilderDocument(serialized);
  assert.deepEqual(imported.areas[0].objects,edited.objects);
  assert.deepEqual(imported.areas[0].surface,edited.surface);
  const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),get length(){return map.size;},key:i=>[...map.keys()][i]??null};
  const archive=createExplorationWorldDocumentLibraryV1({storage});
  archive.save(imported);
  const restored=archive.load(imported.id);
  assert.deepEqual(restored.areas[0].objects,edited.objects);
  assert.equal(validateWorldBuilderDraft(restored,{objectCatalog:g.catalog}).valid,true);
  assert.equal(validateWorldBuilderDraft(restored,{objectCatalog:{get:()=>null}}).valid,false);
  assert.throws(()=>sculptWorldAreaScene(restored.areas[0]),/personnelle manquante/);
  const wrong={...restored,areas:restored.areas.map(a=>({...a,objects:a.objects.map(o=>({...o,objectDefinitionId:'user.objectdef.unknown.fake'}))}))};
  assert.equal(validateWorldBuilderDraft(wrong).valid,false);
  assert.throws(()=>serializeWorldBuilderDraft(wrong),/object-definition-unknown/);
  assert.deepEqual(sculptWorldAreaScene(restored.areas[0],g).objects,edited.objects);
 }finally{g.dispose();}
});

test('all world areas require personal resources before editor or play; missing library never alters references',()=>{
 const g=createSculptGraphicCatalog({objectRecords:[object],materialRecords:[material],urlApi:urls()});
 try{
  const world=createBlankWorldBuilderDraft({id:'graphic-all-areas',width:224,height:168});
  const area=world.areas[0],scene=sculptWorldAreaScene(area,g);
  const edited={...scene,objects:appendSculptPreviewObject(scene.objects,{definitionId:object.definitionId,x:100,y:80},g.catalog),surface:appendSculptSurfaceStroke(scene.surface,{materialId:material.id,points:[{x:40,y:50}]},g.materialRegistry)};
  const saved=saveSculptWorldArea(world,area.id,edited,g),serialized=serializeWorldBuilderDraft(saved);
  assert.equal(assertSculptWorldGraphicsAvailableV1(saved,g),true);
  assert.throws(()=>assertSculptWorldGraphicsAvailableV1(saved,null),/personnelle manquante/);
  const partial=createSculptGraphicCatalog({objectRecords:[object],urlApi:urls()});
  try{assert.throws(()=>assertSculptWorldGraphicsAvailableV1(saved,partial),/Texture personnelle manquante/);}finally{partial.dispose();}
  assert.equal(serializeWorldBuilderDraft(saved),serialized);
 }finally{g.dispose();}
});
