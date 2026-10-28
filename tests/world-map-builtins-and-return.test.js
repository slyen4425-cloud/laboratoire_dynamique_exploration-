import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {builtinSculptMapPresets,listAvailableSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {sculptWaterAt} from '../src/world/sculpt-height-model.js';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('eight native editable presets with real water, routes, assets and safe initial center',()=>{
 const entries=builtinSculptMapPresets();
 assert.equal(entries.length,8);
 assert.equal(new Set(entries.map(p=>p.id)).size,8);
 assert.equal(new Set(entries.map(p=>p.name)).size,8);
 let ponds=0,snow=0,roads=0,buildings=0,trees=0;
 for(const preset of entries){
   const scene=importSculptPreviewScene(preset.scene);
   assert.ok(Object.isFrozen(preset));
   assert.ok(scene.terrain.width>=24&&scene.terrain.height>=18);
   assert.ok(scene.objects.length>=3,preset.name+' needs real terrain decorations');
   assert.equal(scene.actors.length,0);
   assert.ok(!('portals' in preset.scene));
   assert.ok(!('spawns' in preset.scene));
   const centerX=Math.floor(scene.terrain.width/2),centerY=Math.floor(scene.terrain.height/2);
   assert.equal(sculptWaterAt(scene.terrain,centerX,centerY),0,preset.name+' spawn wet');
   assert.ok(scene.objects.every(obj=>Math.hypot(obj.transform.x-(centerX+.5)*28,
     obj.transform.y-(centerY+.5)*21)>65),preset.name+' blocked spawn');
   if(scene.terrain.waterLevels.some((w,i)=>w>scene.terrain.levels[i]))ponds++;
   if(scene.surface.baseMaterialId==='ground.snow')snow++;
   roads+=scene.surface.routes.length;
   buildings+=scene.objects.filter(o=>o.objectDefinitionId.includes('.building.')).length;
   trees+=scene.objects.filter(o=>o.objectDefinitionId.includes('.tree.')).length;
   const base=createBlankWorldBuilderDraft({id:'test-'+preset.id,width:36*28,height:24*21});
   const result=createWorldAreaFromSculptMapPreset(base,preset,{name:preset.name,kind:'exterior'});
   const houses=scene.objects.filter(o=>o.objectDefinitionId.includes('.building.')).length;
   assert.equal(result.areas.length,2+houses,'each house instantiates an independent WorldArea');
   assert.equal(result.areas[1].sculptTerrain.width,scene.terrain.width);
   assert.ok(serializeWorldBuilderDraft(result).length>1000);
 }
 assert.ok(ponds>=2,'multiple real ponds');
 assert.ok(snow>=2,'winter maps');
 assert.ok(roads>=5,'usable paths');
 assert.ok(buildings>=3,'habitable maps');
 assert.ok(trees>=30,'forested map variation');
});
test('native presets remain read-only, separate from user library, and prelisted',()=>{
 const store={getItem:()=>null};
 const presets=listAvailableSculptMapPresets(store);
 assert.equal(presets.length,8);
 assert.equal(presets[0].id,builtinSculptMapPresets()[0].id);
 assert.equal(presets[0].kind,'gensrpg-sculpt-map-preset');
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
 assert.match(assembler,/areaId=\s*'\+encodeURIComponent\(selectedId\)/);
 assert.match(html,/id="sculpt-map-preset-select"/);
 assert.match(assembler,/listAvailableSculptMapPresets/);
});
