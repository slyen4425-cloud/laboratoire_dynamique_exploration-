import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('legacy 2D builder URL redirects to one canonical World Builder without loading its old interface',()=>{
 const legacy=read('builder.html');
 const newWorld=read('world-assembler.html');
 const router=read('src/builder/world-assembler-main.js');
 assert.match(legacy,/<meta http-equiv="refresh" content="0; url=\.\/world-assembler\.html"/);
 assert.match(legacy,/window\.location\.replace\(new URL\('\.\/world-assembler\.html', window\.location\.href\)\)/);
 assert.ok(legacy.indexOf('window.location.replace(')<legacy.indexOf('<body>'),'legacy redirect before body/old editor render');
 assert.match(newWorld,/id="world-workspace-map"/);
 assert.match(router,/mapPanelUrl='\.\/sculpt-lab\.html\?/);
 assert.doesNotMatch(newWorld,/href="\.\/builder\.html"/);
});
test('Sculpt keeps a direct return to World Builder and legacy files are retained for rollback',()=>{
 const sculpt=read('sculpt-lab.html');
 assert.match(sculpt,/href="\.\/world-assembler\.html"/);
 assert.match(read('builder.html'),/id="builder-status"/);
});
