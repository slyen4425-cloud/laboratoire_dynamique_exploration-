import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,addWorldArea} from '../src/builder/world-builder-draft.js';
import {worldAreaSizeFromTiles} from '../src/builder/world-area-size-command.js';
const code=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('one canonical size command converts selected tile counts to the existing WorldArea dimensions',()=>{
 assert.deepEqual(worldAreaSizeFromTiles({width:40,height:31}),{width:40*28,height:31*21});
 for(const [w,h] of [[7,24],[81,24],[36,7],[36,65],[9.1,24],['',24]]){
   assert.throws(()=>worldAreaSizeFromTiles({width:w,height:h}),/cases|dimensions|taille/i);
 }
 let doc=createBlankWorldBuilderDraft({id:'same-world',width:36*28,height:24*21});
 doc=addWorldArea(doc,{name:'Grand donjon',kind:'dungeon',
   ...worldAreaSizeFromTiles({width:42,height:27})});
 assert.equal(doc.areas[1].width,42*28);
 assert.equal(doc.areas[1].height,27*21);
 assert.equal(doc.areas[0].width,36*28);
});
test('World Builder exposes size choice in same world and no link ever opens an unbound scene',()=>{
 const html=code('world-assembler.html'),source=code('src/builder/world-assembler-main.js');
 assert.match(html,/id="area-width"[^>]*min="8"[^>]*max="80"/);
 assert.match(html,/id="area-height"[^>]*min="8"[^>]*max="64"/);
 assert.match(source,/worldAreaSizeFromTiles\(\{width:.*area-width/);
 assert.match(source,/\.\.\.worldAreaSizeFromTiles\(/);
 assert.match(html,/id="world-workspace-map"/);
 assert.doesNotMatch(html,/href="\.\/sculpt-lab\.html"\s+class="go-back"/);
});
test('the World and Map panels use the same selected WorldArea handoff, not two map saves',()=>{
 const html=code('sculpt-lab.html'),main=code('src/sculpt-lab-main.js'),
   assembler=code('src/builder/world-assembler-main.js');
 assert.match(html,/id="world-workspace-world"/);
 assert.match(html,/id="world-workspace-map-active"/);
 assert.match(assembler,/world-workspace-map/);
 assert.match(main,/world-workspace-world/);
 assert.match(main,/saveAndReturnWorldArea/);
 assert.match(main,/saveWorldAssemblerHandoff/);
 assert.match(assembler,/saveWorldAssemblerHandoff/);
 assert.match(html,/id="world-area-create-another"/);
});
