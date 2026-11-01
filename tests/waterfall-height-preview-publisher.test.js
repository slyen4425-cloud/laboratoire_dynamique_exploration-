import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const published=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const source='c6ab2df548f5bcb0fe797d3f851d5ca10b1a1c1d';
test('independent GREEN waterfall/16-level preview uses exact pinned source and preserves old test links',()=>{
 assert.ok(published.includes('ref: '+source));
 assert.match(published,/path: waterfall-source/);
 assert.match(published,/preview\/waterfall-height-pr320/);
 assert.match(published,/preview\/ramp-pr316/);
 assert.match(published,/preview\/rich-presets-pr301/);
 assert.match(published,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(published,/ref: 0dc90b9778b0a9e530adf7e90ac6d2506599c952/);
});
test('assembled waterfall preview must pass real Chrome and live HTTPS provenance',()=>{
 assert.match(published,/waterfall-source\/scripts/);
 assert.match(published,/node scripts\/smoke-sculpt-terrain-lab\.mjs/);
 assert.match(published,/waterfall-height-pr320\/release-provenance\.v1\.json/);
 assert.match(published,/waterfall-height-pr320\/src\/world\/sculpt-height-model\.js/);
 assert.match(published,/waterfall-height-pr320\/sculpt-lab\.html/);
});
