import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const flow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
const prune=readFileSync(new URL('../scripts/prune-pages-duplicate-previews.mjs',import.meta.url),'utf8');
test('unified candidate is historical link only; main is the unique authority',()=>{
 assert.doesNotMatch(flow,/path: unified-source|ref: 77607520574c8509becf91a6dc55783e29c1570c/);
 assert.match(flow,/checkout@v4/);
 assert.match(flow,/EXPLORATION_SOURCE_SHA/);
 assert.match(prune,/'unified-candidate'/);
});
test('release still verifies browser before deduplication and preserves old redirects',()=>{
 assert.ok(flow.indexOf('Real Chromium on canonical Exploration')<flow.indexOf('prune-pages-duplicate-previews.mjs'));
 assert.match(flow,/node scripts\/smoke-sculpt-terrain-lab\.mjs/);
 assert.match(flow,/preview\/encounters-v80\/sculpt-lab\.html/);
 assert.match(flow,/release-provenance\.v1\.json/);
});
