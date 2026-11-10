import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('world-assembler.html'),css=read('src/builder/world-assembler.css'),js=read('src/builder/world-assembler-main.js');
test('landscape layout retains one authoritative control per action',()=>{
  for(const id of ['world-structure-panel','toggle-world-structure','export-world','import-world',
    'open-selected-area','center-world','toggle-graph-links','reset-graph-layout',
    'world-playable-route','reset-world','world-workspace-map']){
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
  }
  assert.match(html,/class="world-file-actions"/);
  assert.match(html,/class="world-canvas-tools"/);
  assert.match(css,/@media \(orientation:landscape\) and \(max-height:700px\)/);
  assert.match(css,/\.workspace\.structure-open \.left-rail/);
  assert.match(js,/structureToggle\.setAttribute\('aria-expanded'/);
  assert.match(js,/on\(byId\('area-list'\),'click',\(\)=>setStructureOpen\(false\)\)/);
});
test('event editing remains connected to its existing editor until the separate Sculpt lot',()=>{
  assert.match(js,/on\(byId\('edit-area-events'\),'click'/);
  assert.match(js,/openAreaEditor\('\.\/builder\.html\?worldAssembler=1'\)/);
});
