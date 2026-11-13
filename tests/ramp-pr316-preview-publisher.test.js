import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const flow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
const prune=readFileSync(new URL('../scripts/prune-pages-duplicate-previews.mjs',import.meta.url),'utf8');
test('PR316 old ramp preview is not an engine deployment or pinned checkout',()=>{
 assert.doesNotMatch(flow,/ramp-source|ref: 0dc90b9778b0a9e530adf7e90ac6d2506599c952/);
 assert.match(prune,/'ramp-pr316'/);
 assert.match(flow,/actions\/deploy-pages@v4/);
});
test('actual current Sculpt source is tested before pruning old URLs',()=>{
 assert.ok(flow.indexOf('node scripts/smoke-sculpt-terrain-lab.mjs')<flow.indexOf('prune-pages-duplicate-previews.mjs'));
 assert.match(flow,/path: site/);
});
