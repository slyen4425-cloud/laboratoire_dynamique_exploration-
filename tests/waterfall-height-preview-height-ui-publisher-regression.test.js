import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const flow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
const prune=readFileSync(new URL('../scripts/prune-pages-duplicate-previews.mjs',import.meta.url),'utf8');
test('16-level UI no longer relies on pinned PR325 copied release',()=>{
 assert.doesNotMatch(flow,/waterfall-source|path: ramp-source|ref: d4b9d8c804e592392c5b7a2ec7cc2f160291a076/);
 assert.match(flow,/node scripts\/smoke-sculpt-terrain-lab\.mjs/);
});
test('retired URLs are compact redirects to the single modern entry',()=>{
 assert.match(prune,/'waterfall-height-pr320'/);
 assert.match(prune,/\.\.\/\.\.\/.*target/);
 assert.match(flow,/prune-pages-duplicate-previews\.mjs/);
});
