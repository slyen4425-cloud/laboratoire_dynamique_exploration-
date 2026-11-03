import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {AUTHOR_SCULPT_MAP_SNAPSHOTS} from '../src/builder/sculpt-author-map-snapshots.js';
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

test('the immutable snapshot files exactly match the author-supplied 2026-11-03 scenes',()=>{
  const expected=[
    'a090ac1436399eab27b6ae41df803ceabe797b0de048fd6fee79d14d7179b58b',
    '7292ab0c8a2394fa894ecc36d06bb87aeabae301d1d6bd113f3b93b8eece361d'
  ];
  for(const [i,item] of AUTHOR_SCULPT_MAP_SNAPSHOTS.entries()){
    const actual=createHash('sha256').update(JSON.stringify(item.scene)).digest('hex');
    assert.equal(actual,expected[i],item.name+' must not be altered before creator editing');
  }
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
