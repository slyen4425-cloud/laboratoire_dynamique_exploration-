import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORLD_OBJECT_SHADOW_DEFAULT_V1,normalizeWorldObjectShadowSettingsV1}
 from '../src/world/world-object-shadow-settings-v1.js';
import {worldObjectShadowProjectionV1,drawWorldObjectContactShadowV1}
 from '../src/render/world-object-renderer.js';
import {normalizeWorldObjectPlacement,resolveWorldObjectPlacement}
 from '../src/world/world-object-placement-model.js';
import {listSculptPlaceableDefinitions,appendSculptPreviewObject,
 updateSculptPreviewObject,serializeSculptPreviewScene,importSculptPreviewScene,
 createBlankSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const building=listSculptPlaceableDefinitions().find(d=>d.kind==='building');
const custom={mode:'custom',widthPct:145,heightPct:70,offsetXPct:12,
 offsetYPct:-7,opacityPct:40};
test('older placements stay unchanged; shadow settings belong to ONE WorldObject override',()=>{
 assert.ok(building);
 const old=normalizeWorldObjectPlacement({id:'house-old',
  objectDefinitionId:building.id,
  transform:{x:100,y:120,scaleX:.4,scaleY:.4,rotationDeg:0},
  overrides:{visualVariantId:null}});
 assert.equal(Object.hasOwn(old.overrides,'shadow'),false);
 assert.equal(Object.hasOwn(resolveWorldObjectPlacement(old),'shadow'),false);
 const edited=normalizeWorldObjectPlacement({...old,
  overrides:{...old.overrides,shadow:custom}});
 assert.deepEqual(edited.overrides.shadow,custom);
 assert.deepEqual(resolveWorldObjectPlacement(edited).shadow,custom);
 const reverted=normalizeWorldObjectPlacement({...edited,
  overrides:{...edited.overrides,shadow:null}});
 assert.equal(Object.hasOwn(reverted.overrides,'shadow'),false,
  'Auto never adds a second persistent shadow record');
});
test('normalization prevents NaN/huge values and keeps documented defaults',()=>{
 assert.equal(normalizeWorldObjectShadowSettingsV1(null),null);
 assert.equal(normalizeWorldObjectShadowSettingsV1({mode:'auto'}),null);
 assert.deepEqual(normalizeWorldObjectShadowSettingsV1({mode:'custom'}),WORLD_OBJECT_SHADOW_DEFAULT_V1);
 const bounded=normalizeWorldObjectShadowSettingsV1({mode:'custom',
  widthPct:100000,heightPct:-20,offsetXPct:-10000,offsetYPct:Infinity,opacityPct:800});
 assert.deepEqual(bounded,{mode:'custom',widthPct:200,heightPct:30,
  offsetXPct:-60,offsetYPct:0,opacityPct:65});
});
test('a house shadow survives preview update, export/import and resets without losing other placements',()=>{
 const scene=createBlankSculptPreviewScene({width:36,height:24});
 const objects=appendSculptPreviewObject([],{
  definitionId:building.id,x:90,y:120,scale:.4
 });
 assert.equal(objects.length,1);
 const edited=updateSculptPreviewObject(objects,objects[0].id,{shadow:custom});
 assert.deepEqual(edited[0].overrides.shadow,custom);
 assert.equal(edited[0].transform.x,objects[0].transform.x);
 const exportJson=serializeSculptPreviewScene(scene.terrain,edited,scene.surface);
 const imported=importSculptPreviewScene(exportJson);
 assert.deepEqual(imported.objects[0].overrides.shadow,custom);
 const reset=updateSculptPreviewObject(imported.objects,objects[0].id,{shadow:null});
 assert.equal(reset[0].overrides.shadow,undefined);
 assert.equal(reset[0].id,objects[0].id,'same object not duplicated');
});
test('the same native shadow projection scales and offsets real silhouettes',()=>{
 const auto=worldObjectShadowProjectionV1({width:120,height:100,footOffset:10,pitch:.6});
 const tuned=worldObjectShadowProjectionV1({width:120,height:100,footOffset:10,pitch:.6,shadow:custom});
 assert.equal(auto.x,0);assert.equal(auto.footY,11);
 assert.equal(auto.scaleX,1);assert.equal(auto.opacity,.25);
 assert.equal(tuned.x,14.4);assert.equal(tuned.footY,4);
 assert.equal(tuned.scaleX,1.45);assert.equal(tuned.opacity,.4);
 assert.equal(Math.round(tuned.flatten/auto.flatten*100),70);
 const width=12,height=10,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=2;x<10;x++)data[(y*width+x)*4+3]=255;
 const scratch={drawImage(){},getImageData(){return {data}},
  fillRect(){},set globalCompositeOperation(v){},set fillStyle(v){}};
 const doc={createElement:()=>({getContext:()=>scratch})};
 const image={naturalWidth:width,naturalHeight:height,ownerDocument:doc};
 const transforms=[],positions=[],draws=[];
 const ctx={save(){},restore(){},translate(...args){positions.push(args)},
  transform(...args){transforms.push(args)},drawImage(...args){draws.push(args)},
  set globalAlpha(v){this.alpha=v}};
 assert.equal(drawWorldObjectContactShadowV1(ctx,{kind:'building',width:120,height:100,
  image,shadow:custom}),true);
 assert.equal(draws.length,1,'real alpha shadow only');
 assert.equal(positions[0][0],14.4);
 assert.equal(transforms[0][0],1.45);
 assert.equal(ctx.alpha,.4);
});
test('the editor offers one CLOSED shadow group with five sliders and native reset',()=>{
 const html=read('sculpt-lab.html'),main=read('src/sculpt-lab-main.js');
 assert.equal((html.match(/id="object-shadow-details"/g)||[]).length,1);
 assert.match(html,/<details id="object-shadow-details" hidden>/);
 assert.doesNotMatch(html,/<details id="object-shadow-details"[^>]+open/);
 assert.match(html,/id="object-shadow-mode"/);
 for(const id of ['width','height','x','y','opacity'])
  assert.match(html,new RegExp('id="object-shadow-'+id+'"'));
 assert.match(html,/id="object-shadow-reset"/);
 assert.match(main,/details\.open=false/);
 assert.match(main,/readSelectedObjectShadowControlsV1\(\)/);
 assert.match(main,/shadow:objectEditing&&objectSelectedId===object\.id&&\$\('object-shadow-details'\)/);
 assert.match(main,/if\(!details\)return;/,'frozen V80 no longer crashes on optional editor controls');
 assert.match(main,/if\(\$\('object-shadow-details'\)\)\{/,'only the modern editor binds new listeners');
 assert.match(main,/function applySelectedShadowControl\(\)/);
 assert.match(main,/if\(\$\('object-shadow-scope'\)\.value==='model'\)/);
 assert.match(main,/commitShadowModelProfile\(shadow\)/);
 assert.match(main,/else editSelectedObject\(\{shadow\}\)/);
 assert.match(main,/object-shadow-reset'\)\.addEventListener\('click',[\s\S]*applySelectedShadowControl\(\)/);
 assert.match(main,/input\.addEventListener\('input',[\s\S]*scheduleDraw\(\)/);
 assert.match(main,/objectHistory\.push\(placedObjects\)/);
});
test('walkable terrain and bridges have no shadow in the same renderer',()=>{
 for(const kind of ['bridge','stairs','ramp','waterfall','ground','water'])
  assert.equal(drawWorldObjectContactShadowV1({},{
   kind,width:120,height:80,shadow:custom}),false);
});
