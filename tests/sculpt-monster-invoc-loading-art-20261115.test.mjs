import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const script=html.match(/<script>\s*\/\/ Play-mode cover[\s\S]*?<\/script>/)?.[0]
  ?.replace(/^<script>/,'').replace(/<\/script>$/,'');
test('optional Capture loading art styles exactly the two native loading masks',()=>{
 assert.ok(script);
 assert.match(html,/html\.capture-loading-art #sculpt-play-boot-mask/);
 assert.match(html,/html\.capture-loading-art #play-area-loading/);
 assert.match(html,/html\.capture-loading-art \.play-loading-brand\{display:none\}/);
 assert.match(html,/id="play-area-loading"/);
 assert.match(html,/id="sculpt-play-boot-mask"/);
});
test('art is accepted only from official same-origin Capture path',()=>{
 const run=(path,url='https://example.test/preview/capture-v2-pr225/vendor/exploration-lab/sculpt-lab.html?play=1')=>{
   const classes=new Set(),styles=new Map();
   const document={documentElement:{classList:{add(x){classes.add(x)}},style:{setProperty(k,v){styles.set(k,v)}}}};
   const location=new URL(url);if(path!==undefined)location.searchParams.set('loadingArt',path);
   vm.runInNewContext(script,{URL,URLSearchParams,location,document});
   return {classes,styles};
 };
 const ok=run('/preview/capture-v2-pr225/assets/gensrpg/capture-v2/branding/monster-invoc-loading-v1.svg');
 assert.ok(ok.classes.has('sculpt-play-booting'));assert.ok(ok.classes.has('capture-loading-art'));
 assert.match(ok.styles.get('--capture-loading-art'),/monster-invoc-loading-v1\.svg/);
 for(const invalid of ['https://evil.test/assets/gensrpg/capture-v2/branding/monster-invoc-loading-v1.svg',
 '/assets/gensrpg/capture-v2/branding/some-other-logo.svg',undefined]){
   const res=run(invalid);assert.ok(!res.classes.has('capture-loading-art'));
   assert.equal(res.styles.size,0);
 }
});
