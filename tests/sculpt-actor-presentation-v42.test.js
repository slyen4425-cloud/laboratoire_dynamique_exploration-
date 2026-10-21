import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldActorPlacement} from '../src/actors/world-actor-placement-model.js';
import {createPlacedMapActorView} from '../src/actors/placed-map-actor-view.js';
import {createCaptureActorDefinitionProviderV1} from '../src/capture/capture-actor-definition-provider-v1.js';
import {createMapActorRenderer} from '../src/render/map-actor-renderer.js';
import {createBlankSculptPreviewScene,appendSculptPreviewActor,updateSculptPreviewActor,
  findSculptPreviewActorNear,serializeSculptPreviewScene,importSculptPreviewScene}
  from '../src/world/sculpt-scene-preview.js';

const DEF='capture:creature:crea-loup',front='pack:front-loup',back='pack:back-loup';
const transfer={schema:'capture-creature-transfer-v1',draft:{
  id:'crea-loup',displayName:'Loup volcanique',presentation:{
    visual:{front:{assetId:front},back:{assetId:back}}
  }
}};
const catalog={assets:[
  {id:front,resource:{file:'creatures/loup_front.webp'}},
  {id:back,resource:{file:'creatures/loup_back.webp'}}
]};
const provider=()=>createCaptureActorDefinitionProviderV1({
  creatureTransfers:[transfer],visualAssetCatalog:catalog,assetRoot:'./library/'
});

test('V42 native actor placement keeps V30 shape for old scenes and stores optional size/view',()=>{
  const legacy=normalizeWorldActorPlacement({id:'old',actorDefinitionId:DEF,x:70,y:90,facingX:-1});
  assert.deepEqual(legacy,{schemaVersion:1,id:'old',actorDefinitionId:DEF,x:70,y:90,facingX:-1});
  const newPlacement=normalizeWorldActorPlacement({
    id:'new',actorDefinitionId:DEF,x:70,y:90,facingX:-1,visualScale:1.5,visualView:'back'});
  assert.equal(newPlacement.visualScale,1.5);
  assert.equal(newPlacement.visualView,'back');
  assert.equal(normalizeWorldActorPlacement({...newPlacement,visualScale:99}).visualScale,undefined);
  assert.equal(normalizeWorldActorPlacement({...newPlacement,visualView:'side'}).visualView,undefined);
  assert.equal('assetId' in newPlacement,false);
  assert.equal('mapVisual' in newPlacement,false);
});

test('V42 real Capture front/back assets resolve independently without duplicating actor model',()=>{
  const p=provider(),d=p.resolveDefinition(DEF);
  assert.equal(p.listAssets().length,2);
  assert.equal(d.mapVisual.assetId,front);
  assert.equal(d.mapVisualByView.front.assetId,front);
  assert.equal(d.mapVisualByView.back.assetId,back);
  assert.equal(p.resolveAsset(back).path,'./library/creatures/loup_back.webp');
  const a=createPlacedMapActorView(normalizeWorldActorPlacement({
    id:'a',actorDefinitionId:DEF,x:95,y:150,facingX:-1,visualView:'back',visualScale:1.5
  }),p.resolveDefinition);
  assert.equal(a.mapVisual.assetId,back);
  assert.equal(a.visualScale,1.5);
  assert.equal(a.x,95);assert.equal(a.y,150);
  const b=createPlacedMapActorView(normalizeWorldActorPlacement({
    id:'b',actorDefinitionId:DEF,x:95,y:150,facingX:1
  }),p.resolveDefinition);
  assert.equal(b.mapVisual.assetId,front);
  assert.equal(b.visualScale,1);
});

test('V42 scene editor appends, finds, updates actor visual, exports/imports & preserves legacy',()=>{
  const scene=createBlankSculptPreviewScene({width:12,height:10});
  const old=appendSculptPreviewActor(scene.actors,{definitionId:DEF,x:90,y:90,facingX:1});
  assert.equal('visualScale' in old[0],false,'default 100% never migrates old scene');
  assert.equal('visualView' in old[0],false,'default front never migrates old scene');
  const found=findSculptPreviewActorNear(old,90,46);
  assert.equal(found?.id,old[0].id,'tap high sprite body finds its anchor');
  const edited=updateSculptPreviewActor(old,found.id,{
    facingX:-1,visualScale:1.65,visualView:'back'
  });
  assert.equal(edited[0].facingX,-1);
  assert.equal(edited[0].visualScale,1.65);
  assert.equal(edited[0].visualView,'back');
  assert.equal(old[0].facingX,1,'edit immutable for undo');
  const exported=serializeSculptPreviewScene(scene.terrain,[],scene.surface,edited);
  const imported=importSculptPreviewScene(exported);
  assert.deepEqual(imported.actors,edited);
  assert.equal(updateSculptPreviewActor(imported.actors,'missing',{visualScale:1.5}).length,1);
});

test('V42 shared actor renderer scales art and contact shadow only, native coordinates stay fixed',()=>{
  const p=provider(),placement=normalizeWorldActorPlacement({
    id:'a',actorDefinitionId:DEF,x:95,y:150,visualScale:1.5,visualView:'back'
  });
  const a=createPlacedMapActorView(placement,p.resolveDefinition);
  const paints=[],ellipses=[];
  const ctx={
    save(){},restore(){},beginPath(){},fill(){},translate(){},scale(){},
    ellipse(...args){ellipses.push(args)},
    drawImage(...args){paints.push(args)}
  };
  const renderer=createMapActorRenderer({preparedVisuals:{get(id){
    assert.equal(id,back);
    return {source:{tag:'true Capture back'},aspectRatio:1.2,anchor:{x:.5,y:1}};
  }}});
  renderer.draw(ctx,{camera:{x:0,y:0},actors:[a],timeSeconds:0});
  assert.equal(paints.length,1);
  assert.equal(paints[0][4],84*1.5);
  assert.equal(paints[0][3],84*1.5*1.2);
  assert.equal(ellipses.length,1);
  assert.equal(placement.x,95);assert.equal(placement.y,150);
});

test('V42 UI owns exactly one actor presentation palette and all relevant actions',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  for(const id of ['actor-scale','actor-scale-value','actor-view','actor-facing',
    'actor-action','actor-selected']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1,id);
  }
  assert.match(html,/value="select">Sélectionner \/ modifier/);
  assert.match(html,/rev=sculpt-(?:actor-presentation-v42|continuous-cliff-v53|rounded-hills-v54|bridge-crossing-v55|bridge-polish-v56|bridge-deck-v57|bridge-foot-clean-v58|hill-shoulder-v59|bridge-crossing-v60|whole-hill-v61|bridge-bank-v62|high-platform-bridge-v63|bridge-tactile-v64|bridge-camera-v65|bridge-input-v66|bridge-deck-anchor-v67)/);
  assert.match(app,/findSculptPreviewActorNear\(placedActors,x,y\)/);
  assert.match(app,/updateSculptPreviewActor\(placedActors,actorSelectedId,patch\)/);
  assert.match(app,/syncActorSelectedControls\(\)/);
});
