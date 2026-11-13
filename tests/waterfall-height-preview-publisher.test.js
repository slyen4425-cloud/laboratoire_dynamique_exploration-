import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const flow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
const prune=readFileSync(new URL('../scripts/prune-pages-duplicate-previews.mjs',import.meta.url),'utf8');
test('historical waterfall source is not downloaded as secondary runtime',()=>{
 assert.doesNotMatch(flow,/waterfall-source|ref: d4b9d8c804e592392c5b7a2ec7cc2f160291a076/);
 assert.match(prune,/'waterfall-height-pr320'/);
});
test('waterfalls and native Sculpt integration are tested from exact main source',()=>{
 assert.match(flow,/EXPLORATION_SOURCE_SHA/);
 assert.match(flow,/node scripts\/smoke-sculpt-terrain-lab\.mjs/);
 assert.match(flow,/release-provenance\.v1\.json/);
});
