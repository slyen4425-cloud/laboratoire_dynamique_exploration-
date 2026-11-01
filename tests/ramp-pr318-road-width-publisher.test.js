import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const correctedSha='0dc90b9778b0a9e530adf7e90ac6d2506599c952';
test('PR318 road width fix replaces old PR316 immutable test artifact, not stable Pages',()=>{
 assert.match(workflow,new RegExp('ref: '+correctedSha));
 assert.match(workflow,new RegExp('ramp_sha="'+correctedSha+'"'));
 assert.match(workflow,/path: ramp-source/);
 assert.match(workflow,/site\/preview\/ramp-pr316/);
 assert.match(workflow,/ref: 40955a7838beb8fb76e74fd4b941ce4bb7cd1505/);
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(workflow,/ctx\.closePath\(\);ctx\.clip\(\);/);
 assert.match(workflow,/src\/render\/sculpt-ramp-renderer\.js/);
});
test('publisher gates exact PR318 source via Chromium on assembled ramp preview and HTTPS provenance',()=>{
 assert.match(workflow,/ramp-source\/scripts/);
 assert.match(workflow,/ramp\/scripts/);
 assert.match(workflow,/smoke-sculpt-terrain-lab\.mjs/);
 assert.match(workflow,/\$probe\/release-provenance\.v1\.json/);
 assert.match(workflow,/\.exploration==\$sha/);
});
