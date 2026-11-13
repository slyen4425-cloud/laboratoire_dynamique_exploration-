import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const flow=readFileSync(new URL('../.github/workflows/publish-exploration-main.yml',import.meta.url),'utf8');
const script=new URL('../scripts/prune-pages-duplicate-previews.mjs',import.meta.url).pathname;
const core=['index.html','sculpt-lab.html','world-assembler.html','play.html','src/sculpt-lab-main.js',
'combat-preview/examples/dom-demo/exploration-encounter.js','capture-assets/data/assets/catalog/global-visual-assets.v1.json',
'release-provenance.v1.json'];
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'pages-single-main-'));
 for(const item of core){const parts=item.split('/');mkdirSync(join(root,...parts.slice(0,-1)),{recursive:true});writeFileSync(join(root,item),'modern '+item);}
 mkdirSync(join(root,'preview','encounters-v80','src'),{recursive:true});
 writeFileSync(join(root,'preview','encounters-v80','src','old.js'),'historical copy');
 return root;
}
test('Pages gate runs Chromium then compaction before publishing',()=>{
 assert.ok(flow.indexOf('Real Chromium on canonical Exploration')<flow.indexOf('prune-pages-duplicate-previews.mjs'));
 assert.ok(flow.indexOf('prune-pages-duplicate-previews.mjs')<flow.indexOf('actions/upload-pages-artifact@v3'));
});
test('one modern main release, old entry URLs redirect instead of executing V80',()=>{
 const root=fixture();
 try{
   const r=spawnSync(process.execPath,[script,root,'--budget-bytes=1000000'],{encoding:'utf8'});
   assert.equal(r.status,0,r.stderr);
   assert.equal(existsSync(join(root,'preview','encounters-v80','src')),false);
   for(const old of ['encounters-v80','rich-presets-pr301','ramp-pr316','waterfall-height-pr320','unified-candidate']){
     const redirect=readFileSync(join(root,'preview',old,'sculpt-lab.html'),'utf8');
     assert.match(redirect,/\.\.\/\.\.\/sculpt-lab\.html/);
     assert.match(redirect,/location\.replace/);
     assert.equal(existsSync(join(root,'preview',old,'src')),false);
   }
   assert.match(readFileSync(join(root,'sculpt-lab.html'),'utf8'),/modern/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('budget exceed fails closed rather than deploying oversize release',()=>{
 const root=fixture();
 try{const r=spawnSync(process.execPath,[script,root,'--budget-bytes=10'],{encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/BUDGET/);}finally{rmSync(root,{recursive:true,force:true});}
});
test('missing main source fails before deleting historical payload',()=>{
 const root=fixture();rmSync(join(root,'src','sculpt-lab-main.js'));
 try{const r=spawnSync(process.execPath,[script,root],{encoding:'utf8'});
 assert.notEqual(r.status,0);assert.equal(existsSync(join(root,'preview','encounters-v80','src','old.js')),true);}
 finally{rmSync(root,{recursive:true,force:true});}
});
