import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const sculpt=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const height=readFileSync(new URL('../src/world/sculpt-height-model.js',import.meta.url),'utf8');

test('one native height authority provides 16 levels through real legacy UI',()=>{
 assert.match(height,/SCULPT_TERRAIN_MAX_LEVEL=16/);
 assert.match(sculpt,/Math\.min\(SCULPT_TERRAIN_MAX_LEVEL,Number\(level\)\)/);
 assert.doesNotMatch(sculpt,/Math\.min\(7,\s*Number\(level\)\)/);
});

test('the single Pages owner publishes the unified main motor at canonical root, not frozen V80',()=>{
 assert.match(workflow,/Checkout canonical current Exploration engine into public root/);
 assert.match(workflow,/ref: \$\{\{ env\.EXPLORATION_SOURCE_SHA \}\}\s*\n\s*path: site/);
 assert.match(workflow,/Stage canonical main runtime at public root/);
 assert.match(workflow,/site\/combat-preview/);
 assert.match(workflow,/site\/capture-assets/);
 assert.match(workflow,/site\/release-provenance\.v1\.json/);
 assert.match(workflow,/cmp encounter-source\/sculpt-lab\.html site\/sculpt-lab\.html/);
 assert.match(workflow,/cmp encounter-source\/world-assembler\.html site\/world-assembler\.html/);
});

test('old V80 is a byte-frozen rollback artifact, not a live second terrain authority',()=>{
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(workflow,/cmp release-check\/sculpt-lab-v80\.html \/tmp\/published-v80\.html/);
 assert.match(workflow,/Verify canonical public root is unified native 2\.5D, not V80/);
 assert.match(workflow,/preview\/waterfall-height-pr320/);
 assert.match(workflow,/preview\/ramp-pr316/);
 assert.match(workflow,/preview\/rich-presets-pr301/);
});

test('release gate checks actual HTTPS 16-level model, wet waterfalls and full room editor',()=>{
 assert.match(workflow,/SCULPT_TERRAIN_MAX_LEVEL=16/);
 assert.match(workflow,/Math\.min\(SCULPT_TERRAIN_MAX_LEVEL,Number\(level\)\)/);
 assert.match(workflow,/waterAllowed===true/);
 assert.match(workflow,/id="object-open-interior"/);
 assert.match(workflow,/release-provenance\.v1\.json/);
});
