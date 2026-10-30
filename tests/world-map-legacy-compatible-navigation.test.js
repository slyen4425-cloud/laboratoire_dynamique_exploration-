import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {resolveSculptAreaForEditor} from '../src/builder/sculpt-playable-zone-route.js';

const presets=builtinSculptMapPresets();

test('World/Map navigation offers an existing playable Area instead of blocking on the 2400x1600 legacy start',()=>{
  const legacy=createBlankWorldBuilderDraft({id:'capture-old',width:2400,height:1600});
  const withIsland=createWorldAreaFromSculptMapPreset(legacy,presets[0],{name:'Ile',hostAreaId:null});
  const world=createWorldAreaFromSculptMapPreset(withIsland,presets[3],{name:'Forêt',hostAreaId:null});
  const before=serializeWorldBuilderDraft(world);
  const target=resolveSculptAreaForEditor(world,legacy.initialAreaId);
  assert.equal(target?.areaId,world.areas[1].id);
  assert.equal(target?.redirected,true);
  assert.equal(world.initialAreaId,legacy.initialAreaId);
  assert.equal(world.areas[0].width,2400);
  assert.equal(world.areas[0].height,1600);
  assert.equal(serializeWorldBuilderDraft(world),before,'navigation must not modify the canonical WorldDocument');
});

test('already playable map, including an interior, is retained without redirect',()=>{
  const legacy=createBlankWorldBuilderDraft({id:'capture-old',width:2400,height:1600});
  const world=createWorldAreaFromSculptMapPreset(legacy,presets[0],{name:'Ile',hostAreaId:null});
  assert.deepEqual(resolveSculptAreaForEditor(world,world.areas[1].id),{
    areaId:world.areas[1].id,redirected:false
  });
});

test('no playable Area means no fictitious redirect, and unknown selection is refused',()=>{
  const world=createBlankWorldBuilderDraft({id:'capture-old',width:2400,height:1600});
  assert.equal(resolveSculptAreaForEditor(world,world.initialAreaId),null);
  assert.equal(resolveSculptAreaForEditor(world,'no-such-area'),null);
});

test('World Builder uses resolved Area in actual Sculpt handoff and asks before switching',()=>{
  const js=readFileSync(new URL('../src/builder/world-assembler-main.js',import.meta.url),'utf8');
  assert.match(js,/resolveSculptAreaForEditor\(draft,selectedId\)/);
  assert.match(js,/window\.confirm\('La zone/);
  assert.match(js,/saveWorldAssemblerHandoff\(window\.sessionStorage,draft,areaToOpen\)/);
  assert.match(js,/encodeURIComponent\(areaToOpen\)/);
  assert.match(js,/openAreaEditor\('\.\/builder\.html\?worldAssembler=1'\)/);
});
