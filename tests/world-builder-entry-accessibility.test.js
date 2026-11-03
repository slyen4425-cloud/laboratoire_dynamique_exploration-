import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the official Labo Exploration home opens the canonical 2.5D World Builder, not legacy Builder 2D',()=>{
  const home=read('index.html');
  assert.match(home,/<a id="builder-shortcut"[^>]+href="\.\/world-assembler\.html"[^>]*>World Builder<\/a>/);
  assert.doesNotMatch(home,/<a id="builder-shortcut"[^>]+href="\.\/builder\.html"/);
  const world=read('world-assembler.html');
  assert.match(world,/<button id="world-workspace-map"/);
  assert.match(world,/<script type="module" src="\.\/src\/builder\/world-assembler-main\.js/);
});

test('direct 2.5D terrain link retains an accessible World Builder entry in landscape immersive editing',()=>{
  const html=read('sculpt-lab.html');
  assert.match(html,/<a id="world-assembler-shortcut-float"[^>]+href="\.\/world-assembler\.html"[^>]*>🌍 Monde<\/a>/);
  assert.match(html,/#world-assembler-shortcut-float\{display:none!important\}/);
  assert.match(html,/body\.sculpt-immersive:not\(\.world-area-editing\):not\(\.navigation-testing\) #world-assembler-shortcut-float\{/);
  assert.match(html,/#world-workspace-return-float/);
  assert.match(html,/<a href="\.\/world-assembler\.html" aria-label="Ouvrir le constructeur de mondes">/);
});

test('the current WorldDocument remains the only owner of area transfers',()=>{
  const app=read('src/sculpt-lab-main.js');
  assert.match(app,/saveAndReturnWorldArea/);
  assert.match(app,/world-assembler\.html\?return=1/);
});
