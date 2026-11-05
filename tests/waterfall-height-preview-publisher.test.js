import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const published=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const source='d4b9d8c804e592392c5b7a2ec7cc2f160291a076';
test('independent GREEN waterfall/16-level preview is still exercised from pinned source',()=>{
 assert.ok(published.includes('ref: '+source));
 assert.match(published,/path: waterfall-source/);
 assert.match(published,/preview\/waterfall-height-pr320/);
 assert.match(published,/preview\/ramp-pr316/);
 assert.match(published,/preview\/rich-presets-pr301/);
 assert.match(published,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(published,/ref: 0dc90b9778b0a9e530adf7e90ac6d2506599c952/);
});
test('assembled waterfall preview passes Chromium before compact Pages publish, then has documented alias',()=>{
 assert.match(published,/waterfall-source\/scripts/);
 assert.match(published,/node scripts\/smoke-sculpt-terrain-lab\.mjs/);
 assert.match(published,/release-provenance\.v1\.json/);
 assert.match(published,/waterfall-height-pr320\/src\/world\/sculpt-height-model\.js/);
 assert.match(published,/waterfall-height-pr320\/sculpt-lab\.html/);
 assert.match(published,/Verify retired trial URLs redirect to maintained World Builder/);
 assert.ok(published.indexOf('Real Chromium PR325')<published.indexOf('prune-pages-duplicate-previews.mjs'));
});
