import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
test('root World Builder route resolves to canonical preview without changing pinned V80',()=>{
  assert.ok(workflow.includes('name: Stage canonical World Builder entry for root URLs'));
  assert.ok(workflow.includes('site/world-assembler.html'));
  assert.ok(workflow.includes('preview/encounters-v80/world-assembler.html'));
  assert.ok(workflow.includes('cmp site/sculpt-lab-v80.html encounter-source/sculpt-lab-v80.html'));
  assert.ok(workflow.includes('name: Verify root World Builder entry after Pages deployment'));
});
