import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {builtinSculptMapPresets,listAvailableSculptMapPresets}
  from '../src/builder/sculpt-builtin-map-presets.js';
import {importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft}
  from '../src/builder/world-builder-draft.js';
import {createWorldAreaFromSculptMapPreset}
  from '../src/builder/sculpt-map-preset-library.js';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('only the two authored 80x60 maps are built-in and create real editable WorldAreas',()=>{
 const entries=builtinSculptMapPresets();
 assert.equal(entries.length,2);
 assert.deepEqual(entries.map(p=>p.name),['Forêt 1 · projet','Plaine 1 · projet']);
 assert.equal(new Set(entries.map(p=>p.id)).size,2);
 for(const preset of entries){
   const scene=importSculptPreviewScene(preset.scene);
   assert.ok(Object.isFrozen(preset));
   assert.equal(scene.terrain.width,80);
   assert.equal(scene.terrain.height,60);
   assert.ok(scene.objects.length>0);
   assert.ok(scene.surface.routes.length>0);
   assert.ok(!('portals' in preset.scene)&&!('spawns' in preset.scene));
   const base=createBlankWorldBuilderDraft({id:'test-'+preset.id,width:36*28,height:24*21});
   const result=createWorldAreaFromSculptMapPreset(base,preset,{name:preset.name,kind:'exterior'});
   const houses=scene.objects.filter(o=>o.objectDefinitionId.startsWith('objectdef.building.')).length;
   assert.equal(result.areas.length,2+houses,'each building gets its own interior');
   assert.equal(result.areas[1].sculptTerrain.width,80);
   assert.ok(serializeWorldBuilderDraft(result).length>1000);
 }
});
test('built-in catalogue is exactly two author maps on a fresh browser',()=>{
 const store={getItem:()=>null};
 const entries=listAvailableSculptMapPresets(store);
 assert.equal(entries.length,2);
 assert.equal(entries[0].id,builtinSculptMapPresets()[0].id);
 assert.equal(entries[0].kind,'gensrpg-sculpt-map-preset');
});

test('World return survives fullscreen and refresh without a parallel world-state owner',()=>{
 const html=source('sculpt-lab.html');
 const main=source('src/sculpt-lab-main.js');
 const assembler=source('src/builder/world-assembler-main.js');
 assert.match(html,/id="world-workspace-return-float"/);
 assert.match(html,/#world-workspace-return-float\s*\{[^}]*position:absolute/);
 assert.match(html,/body\.world-area-editing\.sculpt-immersive\s+#world-workspace-return-float/);
 assert.match(main,/world-workspace-return-float'\)\.addEventListener\('click'/);
 assert.match(main,/readWorldAssemblerDraft\(window\.localStorage\)/);
 assert.match(main,/saveWorldAssemblerDraft\(window\.localStorage,sculptWorldDraft\)/);
 assert.match(assembler,/areaId=\s*'\+encodeURIComponent\(areaToOpen\)/);
 assert.match(assembler,/saveWorldAssemblerHandoff\(window\.sessionStorage,draft,areaToOpen\)/);
 assert.match(html,/id="sculpt-map-preset-select"/);
 assert.match(assembler,/listAvailableSculptMapPresets/);
});
