import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL('../'+p, import.meta.url),'utf8');

test('terrain control renderer defines paint families before first use, including a blank map',async()=>{
 const js=await read('src/builder/world-builder-main.js');
 const segment=js.split('function refreshTerrainControls() {')[1].split('\nfunction ')[0];
 const declaration=segment.indexOf("const paintableTerrainFamilies =");
 const selection=segment.indexOf("paintableTerrainFamilies.some");
 assert.ok(declaration>=0 && selection>declaration,
   'Initializing any fresh map must not throw TDZ ReferenceError for paintableTerrainFamilies');
});

test('painting controls are shown before advanced family editing and encounters',async()=>{
 const html=await read('builder.html');
 const terrain=html.split('data-panel="terrain"')[1].split('data-panel="objects"')[0];
 assert.ok(terrain.indexOf('id="terrain-paint-material"')<terrain.indexOf('id="terrain-family-definition-select"'));
 assert.ok(terrain.indexOf('id="terrain-paint-material"')<terrain.indexOf('id="family-encounter-family"'));
 assert.match(terrain,/id="terrain-paint-toggle"/);
 assert.match(terrain,/id="terrain-paint-guide"/);
 assert.match(terrain,/<details[^>]*class="terrain-advanced"/);
});

test('touch paint works without forcing a fullscreen transition on first gesture',async()=>{
 const js=await read('src/builder/world-builder-main.js');
 const start=js.indexOf("canvas.addEventListener('pointerdown'");
 const input=js.slice(start,start+500);
 assert.match(input,/!isPaintKind\(mapTool\)/);
});

test('painting a brush stroke does not force editing the last drawn stroke',async()=>{
 const js=await read('src/builder/world-builder-main.js');
 const end=js.split('function endPointer(event) {')[1].split("canvas.addEventListener('pointerup'")[0];
 assert.match(end,/selectedSurfacePathId = null/);
 assert.match(end,/selectedSurfaceKind = null/);
});
