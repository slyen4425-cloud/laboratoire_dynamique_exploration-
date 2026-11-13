import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const flow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
test('canonical World Builder is served directly from modern main root',()=>{
 assert.match(flow,/test -s site\/world-assembler\.html/);
 assert.match(flow,/src\/builder\/world-assembler-main\.js/);
 assert.doesNotMatch(flow,/url=\.\/preview\/encounters-v80\/world-assembler\.html/);
 assert.match(flow,/actions\/deploy-pages@v4/);
});
