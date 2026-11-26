import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
test('contextual interior controls remain single and outside terrain quickbar',()=>{
 const bar=html.indexOf('<section id="interior-area-bar"');
 assert.ok(bar>html.indexOf('<div id="brush-info"'));
 assert.match(html, /id="interior-tools-toggle" hidden aria-expanded="false" aria-controls="interior-controls-details"/);
 for(const id of ['interior-area-bar','interior-controls-details','interior-area-return','interior-level-add','interior-layout-apply','interior-wall-toggle','interior-wall-remove','interior-wall-undo','interior-wall-redo','interior-door-move','interior-floor-base','interior-template-save','interior-template-apply','interior-connector-place']){
  assert.equal(html.split('id="'+id+'"').length,2,id);
  assert.ok(html.indexOf('id="'+id+'"')>=bar,id);
 }
 assert.match(js,/interiorToolsToggle.hidden=!inInterior/);
 assert.match(js,/if\(!inInterior\)setInteriorInspectorOpen\(false\)/);
});
