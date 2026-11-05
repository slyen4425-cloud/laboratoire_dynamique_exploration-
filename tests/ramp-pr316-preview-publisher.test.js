import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const rampSha='0dc90b9778b0a9e530adf7e90ac6d2506599c952';
test('single Pages publisher builds the PR316 fixed ramp test and validates it before pruning',()=>{
 assert.match(workflow,new RegExp(rampSha));
 assert.match(workflow,/path: ramp-source/);
 assert.match(workflow,/site\/preview\/ramp-pr316/);
 assert.match(workflow,/site\/preview\/rich-presets-pr301/);
 assert.match(workflow,/ref: 40955a7838beb8fb76e74fd4b941ce4bb7cd1505/);
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(workflow,/action[s]?\/deploy-pages@v4/);
 assert.match(workflow,/src\/render\/sculpt-ramp-renderer\.js/);
 assert.match(workflow,/ctx\.closePath\(\);ctx\.clip\(\);/);
 assert.ok(workflow.indexOf('Real Chromium PR318')<workflow.indexOf('prune-pages-duplicate-previews.mjs'));
});
test('published PR316 old entrypoint is an explicit redirect to the sole canonical builder',()=>{
 assert.match(workflow,/Verify retired trial URLs redirect to maintained World Builder/);
 assert.match(workflow,/ramp-pr316 waterfall-height-pr320 unified-candidate/);
 assert.match(workflow,/historical-preview-alias\.v1\.json/);
 assert.match(workflow,/\.\.\/encounters-v80\/\$page/);
});
