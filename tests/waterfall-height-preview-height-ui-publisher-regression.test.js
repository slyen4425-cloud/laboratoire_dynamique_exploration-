import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const y=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const sha='d4b9d8c804e592392c5b7a2ec7cc2f160291a076';
test('RED preview-only publisher pins fixed user-tested UI SHA, never unstable branches',()=>{
 const hits=y.match(new RegExp(sha,'g'))??[];
 assert.equal(hits.length,3,'checkout, staging and live provenance must be the SAME fixed SHA');
 assert.match(y,/preview\/waterfall-height-pr320/);
 assert.match(y,/SCULPT_TERRAIN_MAX_LEVEL=16/);
 assert.match(y,/Math\.min\(SCULPT_TERRAIN_MAX_LEVEL,Number\(level\)\)/);
 assert.match(y,/world-room-full-editor-v1-height16-ui-r1/);
});
test('publisher preserves existing approved ramps and V80 while running real Chromium UI gate',()=>{
 assert.match(y,/ramp_sha="0dc90b9778b0a9e530adf7e90ac6d2506599c952"/);
 assert.match(y,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(y,/node scripts\/smoke-sculpt-terrain-lab\.mjs/);
 assert.match(y,/Verify live HTTPS PR320/);
});
