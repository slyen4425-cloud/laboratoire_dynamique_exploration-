import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');

test('pinned PR301 stays independently tested in Chromium before removing duplicate public payloads',()=>{
 const assemble=workflow.indexOf('Stage pinned PR301 preview alongside stable main');
 const browser=workflow.indexOf('Real Chromium');
 const prune=workflow.indexOf('prune-pages-duplicate-previews.mjs');
 const upload=workflow.indexOf('actions/upload-pages-artifact@v3');
 assert.ok(assemble>0&&assemble<prune&&prune<upload);
 assert.ok(browser>assemble&&browser<prune);
 assert.match(workflow,/rich="\$GITHUB_WORKSPACE\/site\/preview\/rich-presets-pr301"/);
 assert.match(workflow,/stable="\$GITHUB_WORKSPACE\/site\/preview\/encounters-v80"/);
 assert.match(workflow,/rsync -a --exclude='\.git' "rich-source\/\$folder\/" "\$rich\/\$folder\/"/);
 assert.match(workflow,/cmp encounter-source\/sculpt-lab\.html "\$stable\/sculpt-lab\.html"/);
 assert.match(workflow,/cmp rich-source\/sculpt-lab\.html "\$rich\/sculpt-lab\.html"/);
});
test('public PR301 URL is a disclosed version alias, not a duplicate engine and asset library',()=>{
 const sha='40955a7838beb8fb76e74fd4b941ce4bb7cd1505';
 assert.match(workflow,new RegExp('ref: '+sha));
 assert.match(workflow,new RegExp('rich_sha="'+sha+'"'));
 assert.match(workflow,/Verify retired trial URLs redirect to maintained World Builder/);
 assert.match(workflow,/historical-preview-alias\.v1\.json/);
 assert.match(workflow,/anciennement|ancienne prévisualisation est archivée/);
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
});
