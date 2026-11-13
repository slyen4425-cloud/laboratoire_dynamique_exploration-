import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const workflow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
test('HTTPS Pages verification loop checks both official hero catalog and PNG with valid Bash',()=>{
 const at=workflow.indexOf('          for path in sculpt-lab.html');
 const end=workflow.indexOf('\n          done',at);
 assert.ok(at>0&&end>at);
 const snippet=workflow.slice(at,end+'\n          done'.length);
 const lines=snippet.split('\n');
 assert.match(snippet,/assets\/exploration\/actors\/official\/catalog\.json/);
 assert.match(snippet,/01_heros_bleu\/frames\/S\/00\.png/);
 const firstDo=lines.findIndex(line=>line.includes('; do'));
 assert.ok(firstDo>2,'for list terminates only after all resources');
 for(const line of lines.slice(0,firstDo))
   assert.ok(line.trimEnd().endsWith('\\'),'line in file list must continue with backslash: '+line);
 const result=spawnSync('bash',['-n'],{input:'set -euo pipefail\n'+snippet+'\n',encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
