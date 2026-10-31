import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('landscape World Builder keeps the WorldGraph full width and provides two accessible real side panels',()=>{
 const html=read('world-assembler.html');
 const css=read('src/builder/world-assembler.css');
 const js=read('src/builder/world-assembler-main.js');
 for(const id of ['world-panel-zones','world-panel-details','world-structure-panel','world-inspector-panel','world-workspace-layout'])
   assert.match(html,new RegExp('id="'+id+'"'),'Missing real workspace control '+id);
 assert.match(html,/aria-controls="world-structure-panel"/);
 assert.match(html,/aria-controls="world-inspector-panel"/);
 assert.match(html,/aria-expanded="false"/);
 assert.match(css,/@media\s*\(orientation:landscape\)\s*and\s*\(max-width:1250px\)/);
 assert.match(css,/\.workspace\[data-panel="zones"\]\s+\.left-rail/);
 assert.match(css,/\.workspace\[data-panel="details"\]\s+\.inspector/);
 assert.match(css,/\.center-panel\{height:100%/);
 assert.match(js,/function setWorkspacePanel\(/);
 assert.match(js,/world-panel-zones/);
 assert.match(js,/world-panel-details/);
 assert.match(js,/aria-expanded/);
 assert.match(js,/isLandscapeCompact/);
});
