import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const flow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
const prune=readFileSync(new URL('../scripts/prune-pages-duplicate-previews.mjs',import.meta.url),'utf8');
test('official publisher checks out one immutable main release, no historical engine',()=>{
 assert.match(flow,/ref: \$\{\{ env\.EXPLORATION_SOURCE_SHA \}\}/);
 assert.match(flow,/path: site/);
 assert.doesNotMatch(flow,/rich-source|ramp-source|waterfall-source|unified-source|ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(flow,/actions\/deploy-pages@v4/);
});
test('historical PR301 URL redirects without secondary assets or engine',()=>{
 assert.match(prune,/'rich-presets-pr301'/);
 assert.match(prune,/historical-preview-alias\.v1\.json/);
 assert.match(prune,/canonical:'\.\.\/\.\.\/'/);
 assert.match(flow,/preview\/encounters-v80\/sculpt-lab\.html/);
});
