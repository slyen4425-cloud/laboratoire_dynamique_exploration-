import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const flow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
test('PR318 corrected ramps now come from official main, not an obsolete pinned preview',()=>{
 assert.doesNotMatch(flow,/ramp-source|ref: 0dc90b9778b0a9e530adf7e90ac6d2506599c952/);
 assert.match(flow,/EXPLORATION_SOURCE_SHA/);
 assert.match(flow,/node scripts\/smoke-sculpt-terrain-lab\.mjs/);
});
test('only the authoritative main root is published',()=>{
 assert.match(flow,/path: site/);
 assert.match(flow,/actions\/upload-pages-artifact@v3/);
 assert.match(flow,/actions\/deploy-pages@v4/);
});
