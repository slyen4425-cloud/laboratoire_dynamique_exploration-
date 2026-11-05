import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const candidate='77607520574c8509becf91a6dc55783e29c1570c';

test('unified mobile candidate remains pinned to exact CI SHA for real Chromium validation',()=>{
 assert.match(workflow,new RegExp('ref: '+candidate));
 assert.match(workflow,/path: unified-source/);
 assert.match(workflow,/Stage full unified mobile trial without replacing V80/);
 assert.match(workflow,/site\/preview\/unified-candidate/);
 assert.match(workflow,/test "\$\(git -C unified-source rev-parse HEAD\)" = "\$candidate_sha"/);
 const staging=workflow.indexOf('Stage full unified mobile trial without replacing V80');
 const browser=workflow.indexOf('Test actual assembled unified candidate in Chromium');
 const prune=workflow.indexOf('prune-pages-duplicate-previews.mjs');
 const upload=workflow.indexOf('actions/upload-pages-artifact@v3');
 assert.ok(staging>0&&staging<browser&&browser<prune&&prune<upload,
  'Candidate is tested from immutable historical bytes, then compacted before public upload');
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
});

test('pre-compaction unified candidate retains approved engine and tests real browser',()=>{
 assert.match(workflow,/unified-source\/sculpt-lab\.html/);
 assert.match(workflow,/unified-source\/world-assembler\.html/);
 assert.match(workflow,/unified-source\/builder\.html/);
 assert.match(workflow,/rsync -a --exclude='\.git' combat-source\/ "\$trial\/combat-preview\/"/);
 assert.match(workflow,/rsync -a --exclude='\.git' capture-source\/ "\$trial\/capture-assets\/"/);
 assert.match(workflow,/node scripts\/smoke-sculpt-terrain-lab\.mjs/);
 assert.match(workflow,/id="sculpt-encounter-area-inherit"/);
 assert.match(workflow,/id="family-encounter-area-inherit"/);
 assert.match(workflow,/Math\.min\(SCULPT_TERRAIN_MAX_LEVEL,Number\(level\)\)/);
});

test('historical unified entry URLs now explicitly redirect; V80 production unchanged',()=>{
 assert.match(workflow,/Verify retired trial URLs redirect to maintained World Builder without duplicated assets/);
 assert.match(workflow,/rich-presets-pr301 ramp-pr316 waterfall-height-pr320 unified-candidate/);
 assert.match(workflow,/historical-preview-alias\.v1\.json/);
 assert.match(workflow,/\.\.\/encounters-v80\/\$page/);
 assert.match(workflow,/cmp release-check\/sculpt-lab-v80\.html \/tmp\/frozen-v80\.html/);
 assert.match(workflow,/jq -e --arg main/);
});
