import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  WORLD_OBJECT_SHADOW_DEFAULT_V1,
  normalizeWorldObjectShadowProfilesV1,
  worldObjectShadowProfileForAssetV1,
  setWorldObjectShadowProfileV1,
  worldObjectShadowSettingsEqualV1
} from '../src/world/world-object-shadow-settings-v1.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {createBlankSculptPreviewScene,appendSculptPreviewObject,
  serializeSculptPreviewScene,importSculptPreviewScene,updateSculptPreviewObject
} from '../src/world/sculpt-scene-preview.js';
import {createSculptMapPreset,importSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {worldObjectShadowProjectionV1} from '../src/render/world-object-renderer.js';

const PINE='objectdef.tree.forest.pine_dense.01';
const custom={...WORLD_OBJECT_SHADOW_DEFAULT_V1,offsetYPct:-28,widthPct:115};
const second={...WORLD_OBJECT_SHADOW_DEFAULT_V1,offsetYPct:-14};
function trees(count){
 let list=[];
 for(let i=0;i<count;i++){
   list=appendSculptPreviewObject(list,{
     definitionId:PINE,x:28*(2+i%70),y:21*(2+Math.floor(i/70)),scale:.75
   });
 }
 return list;
}
test('same source asset matches all identical pine instances; no per-object copies or manual IDs',()=>{
 const placements=trees(10);
 const assetIds=resolveWorldObjectPlacements(placements,objectDefinitionCatalogV1)
   .map(o=>o.visual?.assetId);
 assert.ok(assetIds[0],'canonical tree asset exists');
 assert.ok(assetIds.every(id=>id===assetIds[0]));
 const profiles=setWorldObjectShadowProfileV1([],assetIds[0],custom);
 assert.equal(profiles.length,1);
 assert.equal(worldObjectShadowProfileForAssetV1(profiles,assetIds[0]).offsetYPct,-28);
 assert.ok(placements.every(o=>!o.overrides.shadow),'authoring 10 trees created no redundant shadow override');
 assert.equal(worldObjectShadowProfileForAssetV1(profiles,'some-other-model'),null);
 // Renderer uses one existing silhouette transform with exactly the same values.
 const shadow=worldObjectShadowProjectionV1({
   width:80,height:130,
   shadow:worldObjectShadowProfileForAssetV1(profiles,assetIds[0])
 });
 assert.equal(shadow.footY,1+130*(-28/100));
});
test('individual per-placement settings take precedence without changing model defaults',()=>{
 const profiles=setWorldObjectShadowProfileV1([],'tree.alpha',custom);
 const list=trees(2);
 const modified=updateSculptPreviewObject(list,list[0].id,{shadow:second});
 assert.equal(modified[0].overrides.shadow.offsetYPct,-14);
 assert.equal(modified[1].overrides.shadow,undefined);
 assert.equal(profiles[0].shadow.offsetYPct,-28);
 assert.equal(modified[0].overrides.shadow.offsetYPct,
   (modified[0].overrides.shadow??
      worldObjectShadowProfileForAssetV1(profiles,'tree.alpha')).offsetYPct);
});
test('model shadow profiles support reset, duplicate guard, and non-destructive updates',()=>{
 const original=setWorldObjectShadowProfileV1([],'tree.alpha',custom);
 const updated=setWorldObjectShadowProfileV1(original,'tree.beta',second);
 assert.equal(updated.length,2);
 const changed=setWorldObjectShadowProfileV1(updated,'tree.alpha',second);
 assert.equal(changed.length,2);
 assert.equal(worldObjectShadowProfileForAssetV1(changed,'tree.beta').offsetYPct,-14);
 assert.equal(worldObjectShadowProfileForAssetV1(changed,'tree.alpha').offsetYPct,-14);
 const restored=setWorldObjectShadowProfileV1(changed,'tree.alpha',null);
 assert.equal(restored.length,1);
 assert.equal(worldObjectShadowProfileForAssetV1(restored,'tree.alpha'),null);
 assert.ok(worldObjectShadowSettingsEqualV1(restored[0].shadow,second));
 assert.equal(original[0].shadow.offsetYPct,-28);
 assert.throws(()=>normalizeWorldObjectShadowProfilesV1([...original,...original]),/double|invalide/i);
 assert.throws(()=>normalizeWorldObjectShadowProfilesV1('garbage'),/invalide/i);
});
test('historical WorldDocument shape stays unchanged without profiles; world + save reimport retains profiles once',()=>{
 const plain=createBlankWorldBuilderDraft({width:56*28,height:40*21});
 assert.equal(Object.hasOwn(plain,'objectShadowProfiles'),false);
 const baseline=importWorldBuilderDocument(serializeWorldBuilderDraft(plain));
 assert.equal(Object.hasOwn(baseline,'objectShadowProfiles'),false);
 const next={...plain,objectShadowProfiles:
   setWorldObjectShadowProfileV1([],'tree.alpha',custom)};
 const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(next));
 assert.equal(restored.objectShadowProfiles.length,1);
 assert.equal(restored.objectShadowProfiles[0].assetId,'tree.alpha');
 assert.equal(restored.objectShadowProfiles[0].shadow.offsetYPct,-28);
 assert.equal(restored.areas.length,plain.areas.length);
 assert.deepEqual(restored.areas,baseline.areas);
 assert.deepEqual(restored.portals,baseline.portals);
});
test('standalone scene and map presets keep the same profile format through export/import',()=>{
 const scene=createBlankSculptPreviewScene({width:48,height:32});
 const list=trees(3);
 const profiles=setWorldObjectShadowProfileV1([],'tree.alpha',custom);
 const serialized=serializeSculptPreviewScene(scene.terrain,list,scene.surface,
   scene.actors,null,profiles);
 const reloaded=importSculptPreviewScene(serialized);
 assert.equal(reloaded.objectShadowProfiles.length,1);
 assert.equal(reloaded.objects.length,3);
 assert.equal(reloaded.objects[0].id,list[0].id);
 const preset=createSculptMapPreset({...scene,objects:list,
   objectShadowProfiles:profiles},{name:'Forêt ombrée'});
 const imported=importSculptMapPreset(JSON.stringify(preset));
 assert.equal(imported.scene.objectShadowProfiles.length,1);
 assert.equal(imported.scene.objects.length,3);
});
test('native 2.5D shadow UI is a collapsed object inspector with model/individual scopes',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const model=readFileSync(new URL('../src/world/world-document-model.js',import.meta.url),'utf8');
 assert.match(html,/<details id="object-shadow-details" hidden>/);
 assert.match(html,/<select id="object-shadow-scope"/);
 assert.match(html,/value="model">Tous les objets du même visuel/);
 assert.match(html,/object-shadow-profile-undo/);
 assert.match(main,/currentWorldShadowProfiles\(\)/);
 assert.match(main,/sculptWorldDraft=createWorldBuilderDraft\(\{\.\.\.sculptWorldDraft/);
 assert.match(main,/object\.shadow\?\?modelShadow/);
 assert.match(model,/objectShadowProfiles/);
 assert.doesNotMatch(main,/localStorage\.setItem\('shadow-profiles/);
});