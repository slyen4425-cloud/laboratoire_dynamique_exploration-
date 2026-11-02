import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const candidate='77607520574c8509becf91a6dc55783e29c1570c';

test('unified mobile candidate is pinned to exact CI SHA in single existing Pages publisher',()=>{
 assert.match(workflow,new RegExp('ref: '+candidate));
 assert.match(workflow,/path: unified-source/);
 assert.match(workflow,/Stage full unified mobile trial without replacing V80/);
 assert.match(workflow,/site\/preview\/unified-candidate/);
 assert.match(workflow,/test "\$\(git -C unified-source rev-parse HEAD\)" = "\$candidate_sha"/);
 const staging=workflow.indexOf('Stage full unified mobile trial without replacing V80');
 const upload=workflow.indexOf('actions/upload-pages-artifact@v3');
 assert.ok(staging>0&&staging<upload,'new trial must be part of complete site artifact');
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
});

test('unified preview includes same complete Combat main/visual assets as canonical and tests real browser',()=>{
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

test('preview verifies public HTTPS provenance and leaves original V80 byte-frozen',()=>{
 assert.match(workflow,/Verify HTTPS unified candidate and original V80 after Pages deployment/);
 assert.match(workflow,/trial="\$root\/preview\/unified-candidate"/);
 assert.match(workflow,/"\$trial\/release-provenance\.v1\.json\?run=\$GITHUB_RUN_ID"/);
 assert.match(workflow,/for page in sculpt-lab\.html world-assembler\.html builder\.html/);
 assert.match(workflow,/cmp release-check\/sculpt-lab-v80\.html \/tmp\/published-v80\.html/);
 assert.match(workflow,/\.exploration==\$sha/);
});
