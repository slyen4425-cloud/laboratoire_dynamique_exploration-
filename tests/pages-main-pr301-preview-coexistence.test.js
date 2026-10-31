import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');

test('scheduled main Pages upload includes the pinned PR301 preview on every full-site rebuild',()=>{
 const assemble=workflow.indexOf('Stage pinned PR301 preview alongside stable main');
 const upload=workflow.indexOf('actions/upload-pages-artifact@v3');
 const deploy=workflow.indexOf('actions/deploy-pages@v4');
 assert.ok(assemble>0&&assemble<upload&&upload<deploy,
  'rich test preview must be staged into the site artifact before any deployment');
 assert.match(workflow,/rich="\$GITHUB_WORKSPACE\/site\/preview\/rich-presets-pr301"/);
 assert.match(workflow,/stable="\$GITHUB_WORKSPACE\/site\/preview\/encounters-v80"/);
 assert.match(workflow,/rsync -a --exclude='\.git' "rich-source\/\$folder\/" "\$rich\/\$folder\/"/);
 assert.match(workflow,/cmp encounter-source\/sculpt-lab\.html "\$stable\/sculpt-lab\.html"/);
 assert.match(workflow,/cmp rich-source\/sculpt-lab\.html "\$rich\/sculpt-lab\.html"/);
});
test('main publisher pins a verified GREEN preview SHA and independently verifies public Pages',()=>{
 const sha='40955a7838beb8fb76e74fd4b941ce4bb7cd1505';
 assert.match(workflow,new RegExp('ref: '+sha));
 assert.match(workflow,new RegExp('rich_sha="'+sha+'"'));
 assert.match(workflow,/Verify Pages also serves the pinned PR301 test editor/);
 assert.match(workflow,/for page in sculpt-lab\.html world-assembler\.html/);
 assert.match(workflow,/full-editor-v1|rich-presets-pr301/);
 assert.match(workflow,/jq -e '.exploration=="/);
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
});
