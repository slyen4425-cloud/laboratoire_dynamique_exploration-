import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('V80 frozen Sculpt safely boots without WorldArea-only indoor floor UI',()=>{
 const source=read('src/sculpt-lab-main.js'),v80=read('sculpt-lab-v80.html');
 assert.doesNotMatch(v80,/id="world-interior-floor-base"/);
 assert.match(source,/if\(worldInteriorFloorBase\)worldInteriorFloorBase\.replaceChildren/);
 assert.match(source,/if\(worldInteriorFloorBase\)worldInteriorFloorBase\.value=base/);
 assert.match(source,/if\(worldInteriorFloorRow\)worldInteriorFloorRow\.hidden/);
 assert.match(source,/worldInteriorFloorBase\?\.addEventListener/);
});
