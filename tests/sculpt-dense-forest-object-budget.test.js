import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankSculptPreviewScene,SCULPT_OBJECT_LIMIT,
  appendSculptPreviewObject,normalizeSculptPreviewObjects,
  serializeSculptPreviewScene,importSculptPreviewScene}
  from '../src/world/sculpt-scene-preview.js';
import {importSculptMapPreset,serializeSculptMapPresetForShare}
  from '../src/builder/sculpt-map-preset-library.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument}
  from '../src/builder/world-builder-draft.js';
import {saveSculptWorldArea,sculptWorldAreaScene}
  from '../src/builder/sculpt-world-area-link.js';

// Regression from a real 80x60 forest preset: object #129 was rejected.
const PINE='objectdef.tree.forest.pine_dense.01';
function forestObjects(count){
  const template=appendSculptPreviewObject([],{
    definitionId:PINE,x:98,y:1081.5,scale:.75
  })[0];
  assert.ok(template,'the canonical tree definition must exist');
  return Array.from({length:count},(_,i)=>({
    ...template,id:'sculpt-object-'+(i+1),
    transform:{...template.transform,
      x:28*(1+i%78),y:21*(1+Math.floor(i/78)%50)}
  }));
}
test('an 80x60 forest can place tree 129 and preserve a dense 513-tree scene',()=>{
  assert.ok(SCULPT_OBJECT_LIMIT>=1024,'128 objects is too low for a dense forest');
  const initial=forestObjects(128);
  const placed=appendSculptPreviewObject(initial,{
    definitionId:PINE,x:2100,y:840,scale:.7
  });
  assert.equal(placed.length,129);
  assert.equal(placed.at(-1).id,'sculpt-object-129');
  const scene=createBlankSculptPreviewScene({width:80,height:60});
  const large=forestObjects(513);
  const json=serializeSculptPreviewScene(scene.terrain,large,scene.surface);
  const loaded=importSculptPreviewScene(json);
  assert.equal(loaded.objects.length,513);
  assert.equal(loaded.objects.at(-1).id,'sculpt-object-513');
  const preset={kind:'gensrpg-sculpt-map-preset',version:1,
    id:'map-preset-1',name:'foret_1',scene:JSON.parse(json)};
  const shared=serializeSculptMapPresetForShare(preset);
  const restored=importSculptMapPreset(shared);
  assert.equal(restored.scene.objects.length,513,
    'the map preset export must not silently drop trees');
  assert.deepEqual(restored.scene.objects[0],loaded.objects[0]);
});
test('over-budget imports are rejected rather than silently cropping objects',()=>{
  const tooMany=forestObjects(SCULPT_OBJECT_LIMIT+1);
  assert.throws(()=>normalizeSculptPreviewObjects(tooMany),/limit|limite|maximum/i);
  const scene=createBlankSculptPreviewScene({width:80,height:60});
  const valid=JSON.parse(serializeSculptPreviewScene(scene.terrain,[]));
  valid.objects=tooMany;
  assert.throws(()=>importSculptPreviewScene(valid),/invalid|invalide|limite|maximum/i);
});
test('the Sculpt UI reflects the actual canonical object budget',()=>{
  const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(source,/SCULPT_OBJECT_LIMIT/);
  assert.doesNotMatch(source,/Limite de 128 objets atteinte/);
});

test('the same 513 trees survive canonical WorldArea save and WorldDocument reload',()=>{
  const draft=createBlankWorldBuilderDraft({width:80*28,height:60*21});
  const area=draft.areas[0];
  const source=sculptWorldAreaScene(area);
  const populated=saveSculptWorldArea(draft,area.id,{
    ...source,objects:forestObjects(513)
  });
  assert.equal(populated.areas[0].objects.length,513);
  const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(populated));
  assert.equal(sculptWorldAreaScene(restored.areas[0]).objects.length,513);
  assert.equal(restored.areas[0].objects[512].id,'sculpt-object-513');
});
