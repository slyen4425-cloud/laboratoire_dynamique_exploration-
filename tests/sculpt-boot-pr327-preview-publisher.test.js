import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const bootSha='9b9ca751cf37b5a23dd46c7c2aab4253d60ad9be';

test('the black-frame correction is a separate immutable preview, never a replacement',()=>{
 assert.match(workflow,new RegExp('ref: '+bootSha));
 assert.match(workflow,/path: sculpt-boot-source/);
 assert.match(workflow,/site\/preview\/sculpt-boot-pr327/);
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(workflow,/ref: 40955a7838beb8fb76e74fd4b941ce4bb7cd1505/);
 assert.match(workflow,/ref: 0dc90b9778b0a9e530adf7e90ac6d2506599c952/);
 assert.match(workflow,/ref: d4b9d8c804e592392c5b7a2ec7cc2f160291a076/);
});

test('original renderer is boot-gated, validated in assembled Chromium before publishing',()=>{
 assert.match(workflow,/sculpt-boot-source\/src\/sculpt-lab-main\.js/);
 assert.match(workflow,/if\(!sculptBootReady\)return/);
 assert.match(workflow,/sculptBootReady=true;fit\(\);/);
 assert.match(workflow,/sculpt-boot-source\/scripts/);
 assert.match(workflow,/Real Chromium PR327 booted terrain pixels in assembled preview/);
 const gate=workflow.indexOf('Real Chromium PR327 booted terrain pixels in assembled preview');
 const upload=workflow.indexOf('actions/upload-pages-artifact@v3');
 assert.ok(gate>0&&gate<upload,'Chromium must run before upload');
});

test('the official deploy verifies PR327 is served live with matching exact provenance',()=>{
 assert.match(workflow,/Verify live HTTPS PR327 sculpt boot preview/);
 assert.match(workflow,/sculpt-boot-pr327\/release-provenance\.v1\.json/);
 assert.match(workflow,/sculpt-boot-pr327\/src\/sculpt-lab-main\.js/);
 assert.match(workflow,/jq -e --arg sha "\$sha" '\.exploration==\$sha'/);
});
