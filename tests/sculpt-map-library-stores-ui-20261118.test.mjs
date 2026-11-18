import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  SCULPT_MAP_PRESET_KEY,readSculptMapPresets,saveSculptMapPreset,
  deleteSculptMapPreset,clearPersonalSculptMapPresets,importSculptMapPreset
} from '../src/builder/sculpt-map-preset-library.js';
import {builtinSculptMapPresets,listAvailableSculptMapPresets}
  from '../src/builder/sculpt-builtin-map-presets.js';
import {importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';

const makeStorage=()=>{
  const data=new Map();
  return {data,getItem:key=>data.get(key)??null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key)};
};
const builtins=builtinSculptMapPresets();
const scene=()=>importSculptPreviewScene(builtins[0].scene);

test('official candidate maps and personal saves are distinct, without migrating any preset',()=>{
  const storage=makeStorage();
  const initial=listAvailableSculptMapPresets(storage);
  assert.deepEqual(initial.map(p=>p.id),builtins.map(p=>p.id));
  const saved=saveSculptMapPreset(storage,scene(),'Brouillon de test');
  assert.equal(readSculptMapPresets(storage).length,1);
  assert.equal(listAvailableSculptMapPresets(storage).length,builtins.length+1);
  assert.deepEqual(importSculptMapPreset(JSON.stringify(saved)),saved,'old JSON remains readable');
  assert.ok(!builtins.some(p=>p.id===saved.id||p.name===saved.name));
});

test('delete one personal preset touches no other local storage, world, save, or official map',()=>{
  const storage=makeStorage();
  const officialBefore=JSON.stringify(builtins);
  storage.setItem('gensrpg.world-assembler.draft','SAVED-WORLD-DO-NOT-ERASE');
  storage.setItem('gensrpg.exploration.play.save','SAVED-GAME-DO-NOT-ERASE');
  const first=saveSculptMapPreset(storage,scene(),'Essai A');
  const second=saveSculptMapPreset(storage,scene(),'Essai B');
  assert.deepEqual(deleteSculptMapPreset(storage,first.id),{removed:1,remaining:1});
  assert.deepEqual(readSculptMapPresets(storage).map(p=>p.id),[second.id]);
  assert.throws(()=>deleteSculptMapPreset(storage,builtins[0].id),/introuvable/);
  assert.throws(()=>deleteSculptMapPreset(storage,'not-here'),/introuvable/);
  assert.equal(JSON.stringify(builtinSculptMapPresets()),officialBefore);
  assert.equal(storage.getItem('gensrpg.world-assembler.draft'),'SAVED-WORLD-DO-NOT-ERASE');
  assert.equal(storage.getItem('gensrpg.exploration.play.save'),'SAVED-GAME-DO-NOT-ERASE');
  assert.equal(clearPersonalSculptMapPresets(storage),1);
  assert.equal(storage.getItem(SCULPT_MAP_PRESET_KEY),null);
  assert.deepEqual(listAvailableSculptMapPresets(storage).map(p=>p.id),
    builtins.map(p=>p.id));
  assert.equal(storage.getItem('gensrpg.world-assembler.draft'),'SAVED-WORLD-DO-NOT-ERASE');
  assert.equal(storage.getItem('gensrpg.exploration.play.save'),'SAVED-GAME-DO-NOT-ERASE');
});

test('local preset deletion refuses inaccessible storage and malformed persisted data',()=>{
  const storage=makeStorage(),stored=saveSculptMapPreset(storage,scene(),'Essai');
  assert.throws(()=>deleteSculptMapPreset({getItem:storage.getItem,
    setItem:storage.setItem},stored.id),/indisponible/);
  assert.throws(()=>clearPersonalSculptMapPresets({getItem:storage.getItem,
    setItem:storage.setItem}),/indisponible/);
  storage.setItem(SCULPT_MAP_PRESET_KEY,'not-json');
  assert.throws(()=>clearPersonalSculptMapPresets(storage),/corrompue/);
  assert.equal(storage.getItem(SCULPT_MAP_PRESET_KEY),'not-json',
    'corrupt local library cannot be silently wiped');
});

test('both editors show the native official and personal card shelves, with guarded purge UI',()=>{
  const ui=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const world=readFileSync(new URL('../world-assembler.html',import.meta.url),'utf8');
  const mapJS=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const worldJS=readFileSync(new URL('../src/builder/world-assembler-main.js',import.meta.url),'utf8');
  const gallery=readFileSync(new URL('../src/builder/sculpt-map-preset-choices-ui-v1.js',import.meta.url),'utf8');
  assert.match(ui,/id="sculpt-map-preset-gallery"/);
  assert.match(world,/id="world-map-preset-gallery"/);
  assert.match(gallery,/Cartes fournies · vitrine du projet/);
  assert.match(gallery,/Mes créations · sur cet appareil/);
  assert.match(mapJS,/renderSculptMapPresetChoicesV1/);
  assert.match(worldJS,/renderSculptMapPresetChoicesV1/);
  assert.match(mapJS,/clearPersonalSculptMapPresets/);
  assert.match(mapJS,/deleteSculptMapPreset/);
  assert.match(mapJS,/window\.confirm\('Supprimer les '/);
  assert.match(ui,/id="sculpt-map-presets-clear"/);
  assert.match(ui,/id="sculpt-map-preset-delete"/);
  assert.match(ui,/<details class="map-preset-create-group"/);
  assert.match(ui,/<details class="sculpt-tool-group"/);
  assert.match(ui,/id="ground-tools"/);
  assert.match(ui,/id="water-tools"/);
  assert.match(ui,/id="sculpt-settings"/);
  assert.match(ui,/id="object-shadow-details"/);
  assert.match(mapJS,/closest\('\.sculpt-tool-group'\)/);
});
