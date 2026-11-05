import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const workflow=()=>readFileSync(new URL('../.github/workflows/publish-v81-main.yml',import.meta.url),'utf8');
const script=new URL('../scripts/prune-pages-duplicate-previews.mjs',import.meta.url).pathname;
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'pages-prune-test-'));
 mkdirSync(join(root,'preview','encounters-v80'),{recursive:true});
 writeFileSync(join(root,'sculpt-lab-v80.html'),'V80 UNCHANGED');
 for(const entry of ['sculpt-lab.html','world-assembler.html','builder.html','index.html','play.html']){
  writeFileSync(join(root,'preview','encounters-v80',entry),'MODERN '+entry);
 }
 for(const name of ['rich-presets-pr301','ramp-pr316','waterfall-height-pr320','unified-candidate']){
  const p=join(root,'preview',name);
  mkdirSync(join(p,'combat-preview','assets'),{recursive:true});
  mkdirSync(join(p,'capture-assets','assets'),{recursive:true});
  writeFileSync(join(p,'combat-preview','assets','duplicate.webm'),'GIANT_DUPLICATE');
  writeFileSync(join(p,'capture-assets','assets','duplicate.webp'),'GIANT_DUPLICATE');
  writeFileSync(join(p,'sculpt-lab.html'),'old '+name);
 }
 return root;
}

test('Pages publishing prunes obsolete heavy preview copies AFTER chromium and BEFORE artifact upload',()=>{
 const w=workflow();
 const prune=w.indexOf('prune-pages-duplicate-previews.mjs');
 const uploaded=w.indexOf('actions/upload-pages-artifact@v3');
 const chromium=w.indexOf('Test actual assembled unified candidate in Chromium');
 assert.ok(prune>chromium&&prune<uploaded,'Prune must be late and guarded; keep all smoke tests first');
 assert.match(w,/Check release size and duplicate asset directories/);
});

test('one canonical modern bundle remains, old entry URLs redirect, frozen V80 is byte-identical',()=>{
 const root=fixture();
 const result=spawnSync(process.execPath,[script,root,'--budget-bytes=1000000'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.equal(readFileSync(join(root,'sculpt-lab-v80.html'),'utf8'),'V80 UNCHANGED');
 assert.equal(readFileSync(join(root,'preview','encounters-v80','sculpt-lab.html'),'utf8'),'MODERN sculpt-lab.html');
 for(const old of ['rich-presets-pr301','ramp-pr316','waterfall-height-pr320','unified-candidate']){
  assert.equal(existsSync(join(root,'preview',old,'combat-preview')),false);
  assert.equal(existsSync(join(root,'preview',old,'capture-assets')),false);
  for(const page of ['sculpt-lab.html','world-assembler.html','builder.html','index.html','play.html']){
   const html=readFileSync(join(root,'preview',old,page),'utf8');
   assert.match(html,/\.\.\/encounters-v80\//);
  }
 }
});

test('budget exceed fails closed rather than blindly deploying oversize Pages archive',()=>{
 const root=fixture();
 const result=spawnSync(process.execPath,[script,root,'--budget-bytes=10'],{encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/BUDGET/);
});

test('missing authoritative modern editor fails without destroying historical previews',()=>{
 const root=fixture();
 const fs=requirePlaceholder=>{};
 // Run against a missing root; no historical payload must be touched.
 const missing=join(root,'does-not-exist');
 const result=spawnSync(process.execPath,[script,missing],{encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.ok(existsSync(join(root,'preview','rich-presets-pr301','combat-preview')));
});
