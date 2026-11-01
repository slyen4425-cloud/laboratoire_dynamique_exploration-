import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {normalizeSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {saveSculptMapPreset,readSculptMapPresets,importSculptMapPreset,
  addImportedSculptMapPreset,sculptMapPresetFilename,serializeSculptMapPresetForShare}
  from '../src/builder/sculpt-map-preset-library.js';
import {listAvailableSculptMapPresets,builtinSculptMapPresets}
  from '../src/builder/sculpt-builtin-map-presets.js';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {saveSculptWorldArea,sculptWorldAreaScene}
  from '../src/builder/sculpt-world-area-link.js';

function memoryStorage(){
 const map=new Map();
 return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key)};
}
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('personal map exports a named direct-attach file with the existing canonical versioned schema',()=>{
 const storage=memoryStorage();
 const empty=createBlankSculptPreviewScene({width:28,height:20});
 const scene={...empty,surface:normalizeSculptSurface({
   ...empty.surface,baseMaterialId:'ground.mountain_rock',
   baseTerrainFamilyId:'mountain'
 })};
 const personal=saveSculptMapPreset(storage,scene,'Forêt & Château / Été');
 assert.equal(sculptMapPresetFilename(personal),'foret-chateau-ete.map-preset.json');
 const file=serializeSculptMapPresetForShare(personal);
 assert.equal(file,JSON.stringify(personal),'file must be one compact preset, not a debug terrain dump');
 const valid=importSculptMapPreset(file);
 assert.equal(valid.name,personal.name);
 assert.equal(valid.kind,'gensrpg-sculpt-map-preset');
 assert.equal(valid.version,1);
 assert.equal(importSculptPreviewScene(valid.scene).surface.baseMaterialId,'ground.mountain_rock');
 const restoredStorage=memoryStorage();
 addImportedSculptMapPreset(restoredStorage,file);
 assert.equal(readSculptMapPresets(restoredStorage).length,1);
 assert.equal(listAvailableSculptMapPresets(restoredStorage).length,
   builtinSculptMapPresets().length+1);
 assert.equal(JSON.stringify(listAvailableSculptMapPresets(restoredStorage).at(-1).scene),
   JSON.stringify(personal.scene));
});

test('presets save from the canonical WorldArea surface without exporting its Portal or Spawn graph',()=>{
 const original=createBlankWorldBuilderDraft({width:28*28,height:20*21});
 const area=original.areas[0];
 const scene=sculptWorldAreaScene(area);
 const updated=saveSculptWorldArea(original,area.id,{...scene,surface:normalizeSculptSurface({
   ...scene.surface,baseMaterialId:'grass.forest',baseTerrainFamilyId:'forest'
 })});
 const storage=memoryStorage();
 const preset=saveSculptMapPreset(storage,sculptWorldAreaScene(updated.areas[0]),'Mon bois');
 const file=serializeSculptMapPresetForShare(preset);
 const parsed=JSON.parse(file);
 assert.equal(importSculptPreviewScene(parsed.scene).surface.baseMaterialId,'grass.forest');
 assert.ok(!('portals' in parsed)&&!('spawns' in parsed)&&!('areas' in parsed));
 assert.deepEqual(updated.portals,original.portals);
 assert.equal(importSculptMapPreset(file).name,'Mon bois');
});

test('revisions require the same named preset and do not overwrite other personal or builtin maps',()=>{
 const storage=memoryStorage(),scene=createBlankSculptPreviewScene({width:24,height:18});
 const first=saveSculptMapPreset(storage,scene,'Ma clairière');
 saveSculptMapPreset(storage,scene,'Mon marais');
 const revised=saveSculptMapPreset(storage,scene,'Ma clairière');
 assert.equal(first.id,revised.id);
 assert.equal(readSculptMapPresets(storage).length,2);
 assert.equal(builtinSculptMapPresets().length,8);
 assert.throws(()=>importSculptMapPreset('{"kind":"gensrpg-sculpt-map-preset","version":1}'));
});

test('editor shows friendly one-click personal library and hides numeric debug JSON in advanced tools',()=>{
 const html=source('sculpt-lab.html'),main=source('src/sculpt-lab-main.js');
 const builder=source('world-assembler.html'),builderScript=source('src/builder/world-assembler-main.js');
 assert.match(html,/id="sculpt-map-preset-save-share"/);
 assert.match(html,/id="sculpt-map-preset-export"/);
 assert.match(html,/id="sculpt-map-preset-import"/);
 assert.match(html,/<details id="sculpt-advanced-json"/);
 assert.match(html,/id="sculpt-map-preset-panel"/);
 assert.match(main,/serializeSculptMapPresetForShare/);
 assert.match(main,/sculptMapPresetFilename/);
 assert.match(main,/saveSculptMapPreset\(window.localStorage/);
 assert.match(builder,/id="world-map-preset-save-current"/);
 assert.match(builder,/id="world-map-preset-import"/);
 assert.match(builderScript,/addImportedSculptMapPreset/);
 assert.match(builderScript,/saveSculptMapPreset/);
});
