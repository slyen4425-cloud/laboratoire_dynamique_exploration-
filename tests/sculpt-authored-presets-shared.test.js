import test from 'node:test';
import assert from 'node:assert/strict';
import {builtinSculptMapPresets,listAvailableSculptMapPresets}
  from '../src/builder/sculpt-builtin-map-presets.js';
import {importSculptMapPreset,createWorldAreaFromSculptMapPreset}
  from '../src/builder/sculpt-map-preset-library.js';
import {createBlankWorldBuilderDraft}
  from '../src/builder/world-builder-draft.js';

test('fresh browser includes the unchanged 8 originals plus Forêt 1 and Plaine 1 as shipped assets',()=>{
  const presets=builtinSculptMapPresets();
  assert.equal(presets.length,10,'two authored maps must be shipped in code, not localStorage');
  assert.deepEqual(presets.slice(0,8).map(p=>p.id),
    Array.from({length:8},(_,i)=>'map-preset-'+(101+i)),
    'existing built-in IDs must not change');
  const personal=presets.slice(8);
  assert.deepEqual(personal.map(p=>p.name),['Forêt 1 · projet','Plaine 1 · projet']);
  assert.deepEqual(personal.map(p=>p.id),['map-preset-109','map-preset-110']);
  assert.deepEqual(personal.map(p=>[p.scene.terrain.width,p.scene.terrain.height]),
    [[80,60],[80,60]]);
  assert.deepEqual(personal.map(p=>p.scene.objects.length),[142,64]);
  assert.deepEqual(personal.map(p=>p.scene.surface.routes.length),[5,14]);
  assert.deepEqual(personal.map(p=>p.scene.terrain.ramps.length),[0,7]);
  for(const p of personal){
    assert.deepEqual(importSculptMapPreset(JSON.stringify(p)),p);
    assert.ok(!('portals' in p)&&!('spawns' in p)&&!('areas' in p),
      'presets are scene snapshots, never duplicate WorldDocuments');
  }
  const virginBrowser={getItem:()=>null};
  assert.deepEqual(listAvailableSculptMapPresets(virginBrowser).map(p=>p.id),
    presets.map(p=>p.id));
});

test('the two authored maps instantiate as canonical WorldAreas without changing the source scene',()=>{
  for(const preset of builtinSculptMapPresets().slice(8)){
    const before=JSON.stringify(preset.scene);
    const world=createBlankWorldBuilderDraft({
      id:'authored-preset-'+preset.id,width:36*28,height:24*21
    });
    const withMap=createWorldAreaFromSculptMapPreset(world,preset,{
      name:preset.name,hostAreaId:null
    });
    const area=withMap.areas.find(a=>a.label===preset.name);
    assert.ok(area,preset.name+' area can be created from its snapshot');
    assert.equal(area.sculptTerrain.width,80);
    assert.equal(area.sculptTerrain.height,60);
    assert.equal(area.objects.length,preset.scene.objects.length);
    assert.equal(area.surface.routes.length,preset.scene.surface.routes.length);
    assert.equal(JSON.stringify(preset.scene),before,'template must stay read-only');
    assert.equal(withMap.areas[0].id,world.areas[0].id);
  }
});
