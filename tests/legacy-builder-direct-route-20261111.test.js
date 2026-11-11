import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('legacy builder URL forwards to the canonical World Builder, never boots 2D by default',()=>{
 const html=read('builder.html');
 assert.match(html,/<meta http-equiv="refresh" content="0;url=\.\/world-assembler\.html"/);
 assert.match(html,/window\.location\.replace\(new URL\('\.\/world-assembler\.html', window\.location\.href\)\)/);
 assert.ok(html.indexOf('window.location.replace')<html.indexOf('world-builder-main.js'));
 // Historical source remains intact, for recovery; no WorldDocument migration.
 assert.match(html,/id="world-assembler-back"/);
});
test('new World Builder links only to the 2.5D map and a visible return to its zone graph',()=>{
 const map=read('sculpt-lab.html');
 const world=read('world-assembler.html');
 const controller=read('src/builder/world-assembler-main.js');
 assert.match(map,/<h1>World Builder · Carte 2,5D<\/h1>/);
 assert.match(map,/href="\.\/world-assembler\.html"/);
 assert.match(world,/id="world-workspace-map"/);
 assert.match(controller,/const mapPanelUrl='\.\/sculpt-lab\.html\?worldAssembler=1/);
 assert.doesNotMatch(controller,/openAreaEditor\(['"]\.\/builder\.html/);
});
