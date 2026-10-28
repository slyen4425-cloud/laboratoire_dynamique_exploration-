import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('the Portal inspector starts collapsed and keeps its existing native details UI',()=>{
  assert.match(html,/<details\s+id="world-area-portal-panel"\s+class="world-area-portal-panel"\s+hidden\s*>/);
  assert.match(html,/<summary[^>]*>.*Passages.*<\/summary>/);
  for(const id of ['world-area-return','world-area-portal-place','world-area-portal-save',
    'world-area-spawn-place','world-area-spawn-save'])
    assert.match(html,new RegExp('id="'+id+'"'));
});

test('the fullscreen action is one existing button, reused in the 2.5D world editor',()=>{
  assert.equal([...html.matchAll(/id="fullscreen-toggle"/g)].length,1);
  assert.match(main,/\$\('fullscreen-toggle'\)\.addEventListener\('click',toggleImmersive\)/);
  assert.match(html,/body\.world-area-editing[^{]*#fullscreen-toggle/);
  assert.match(main,/document\.body\.classList\.add\('world-area-editing'\)/);
});

test('the Portal inspector is a compact canvas overlay with scroll, not a fixed screen-blocking drawer',()=>{
  assert.match(html,/body\.world-area-editing\s+\.world-area-portal-panel\{[^}]*position:absolute/);
  assert.match(html,/\.world-area-portal-panel:not\(\[open\]\)/);
  assert.match(html,/body\.world-area-editing\.navigation-testing\s+\.world-area-portal-panel/);
  assert.match(main,/sculptWorldPortalPlacement=sculptWorldPortalPlacement===mode\?null:mode;/);
  assert.match(main,/if\(sculptWorldPortalPlacement\)\s*\$\('world-area-portal-panel'\)\.open=false;/);
});
