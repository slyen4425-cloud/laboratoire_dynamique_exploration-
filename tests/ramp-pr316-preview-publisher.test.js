import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const rampSha='c8d689796bddeccd4e772e4c17fd6893818c84fe';
test('single Pages publisher stages immutable PR316 ramp test preview alongside original PR301 and V80',()=>{
 assert.match(workflow,new RegExp(rampSha));
 assert.match(workflow,/path: ramp-source/);
 assert.match(workflow,/site\/preview\/ramp-pr316/);
 assert.match(workflow,/site\/preview\/rich-presets-pr301/);
 assert.match(workflow,/ref: 40955a7838beb8fb76e74fd4b941ce4bb7cd1505/);
 assert.match(workflow,/ref: 933c852c41c4511cb0eed0717c246cc6b19aeddc/);
 assert.match(workflow,/action[s]?\/deploy-pages@v4/);
 assert.match(workflow,/src\/render\/sculpt-ramp-renderer\.js/);
 assert.match(workflow,/sculptSurfacePaintAt/);
});
test('publisher validates the exact live test SHA, never returns a stale PR301 preview as PR316',()=>{
 assert.match(workflow,/preview\/ramp-pr316\/release-provenance\.v1\.json/);
 assert.match(workflow,/\.exploration==\$sha/);
 assert.match(workflow,/preview\/ramp-pr316\/src\/render\/sculpt-ramp-renderer\.js/);
});
