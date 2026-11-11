import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('WorldArea interior surfaces are authored by official Sculpt 2.5D, not a second Builder',()=>{
 const js=read('src/sculpt-lab-main.js'),html=read('sculpt-lab.html');
 assert.match(html,/id="world-interior-floor-base"/);
 assert.match(js,/worldInteriorFloorBase\.replaceChildren/);
 assert.match(js,/const worldInterior=!entry&&sculptWorldCurrentInterior\(\)/);
 assert.match(js,/function setCurrentInteriorBaseMaterial/);
 assert.match(js,/surface=\{\.\.\.surface,baseMaterialId:materialId\}/);
 assert.match(js,/saveSculptWorldArea\(sculptWorldDraft,sculptWorldAreaId,captureSculptArea\(\)\)/);
});
test('native browser floor smoke uses real pointer and never boots old Builder',()=>{
 const source=read('scripts/smoke-interior-floor-brush.mjs');
 assert.match(source,/world-assembler\.html/);
 assert.match(source,/sculpt-lab\.html/);
 assert.match(source,/Input\.dispatchMouseEvent/);
 assert.doesNotMatch(source,/\/builder\.html/);
});
