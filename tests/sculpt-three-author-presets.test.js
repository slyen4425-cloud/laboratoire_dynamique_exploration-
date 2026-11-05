import test from 'node:test';
import assert from 'node:assert/strict';
import {builtinSculptMapPresets,listAvailableSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {importSculptMapPreset,createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';

test('only the three original author maps are selectable, without the obsolete eight demos',()=>{
 const entries=builtinSculptMapPresets();
 assert.deepEqual(entries.map(p=>p.name),['Forêt 1 · projet','Plaine 1 · projet','Neige 1 · projet']);
 assert.deepEqual(entries.map(p=>p.id),['map-preset-109','map-preset-110','map-preset-111']);
 assert.deepEqual(entries.map(p=>[p.scene.terrain.width,p.scene.terrain.height]),[[80,60],[80,60],[80,64]]);
 assert.deepEqual(entries.map(p=>p.scene.objects.length),[142,64,0]);
 assert.deepEqual(entries.map(p=>p.scene.surface.routes.length),[5,14,5]);
 assert.deepEqual(entries.map(p=>p.scene.terrain.ramps.length),[0,7,0]);
 assert.deepEqual(listAvailableSculptMapPresets({getItem:()=>null}).map(p=>p.id),entries.map(p=>p.id));
 for(const preset of entries){
   assert.deepEqual(importSculptMapPreset(JSON.stringify(preset)),preset);
   const before=JSON.stringify(preset.scene);
   const world=createBlankWorldBuilderDraft({id:'author-test-'+preset.id,width:36*28,height:24*21});
   const built=createWorldAreaFromSculptMapPreset(world,preset,{name:preset.name,kind:'exterior'});
   const area=built.areas.find(a=>a.label===preset.name);
   assert.ok(area);
   assert.equal(area.sculptTerrain.width,preset.scene.terrain.width);
   assert.equal(area.sculptTerrain.height,preset.scene.terrain.height);
   assert.equal(JSON.stringify(preset.scene),before);
 }
});
