import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('world-assembler.html');
const js=read('src/builder/world-assembler-main.js');
test('World Builder provides no active entry to the old 2D editor',()=>{
 assert.doesNotMatch(html,/éditeur 2D|id="edit-area-events"|Modifier les événements \(éditeur existant\)/);
 assert.doesNotMatch(js,/openAreaEditor\(['"]\.\/builder[.]html/);
 assert.match(js,/openAreaEditor\(mapPanelUrl\)/);
 assert.match(js,/if\(!url[.]startsWith\('\.\/sculpt-lab[.]html\?'\)\)/);
 assert.match(html,/carte 2,5D/);
});
test('WorldDocument events remain in current canonical inspector without old edit actions',()=>{
 assert.match(js,/draft[.]events\?\?\[\]/);
 assert.match(html,/id="selected-events"/);
 assert.match(html,/événements existants sont conservés/);
});
