import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureCombatWarmupV1,CAPTURE_COMBAT_WARMUP_PATHS_V1,captureEncounterVisualFilesV1} from '../src/encounters/capture-combat-warmup-v1.js';
test('warm the current official bundle, HUD and visual catalog at idle exactly once',()=>{
  let scheduled=null,requests=[];
  const warm=createCaptureCombatWarmupV1({
    documentUrl:'https://example.org/preview/encounters-v80/sculpt-lab.html',
    fetchImpl:(url,opts)=>{requests.push([url.href,opts]);return Promise.resolve({ok:true});},
    schedule:fn=>{scheduled=fn;}
  });
  assert.equal(warm.start(),true);
  assert.equal(warm.start(),false);
  assert.deepEqual(requests,[],'navigation must be responsive before idle callback');
  scheduled();
  assert.equal(requests.length,CAPTURE_COMBAT_WARMUP_PATHS_V1.length);
  assert.ok(requests.every(([u,options])=>u.startsWith('https://example.org/preview/encounters-v80/')&&options.priority==='low'));
  assert.equal(requests.filter(([u])=>u.endsWith('encounter-bundle.v1.json')).length,1);
});
test('respect data saver and never make speculative fetch a Battle authority',()=>{
  let count=0;
  const save=createCaptureCombatWarmupV1({documentUrl:'https://example.org/map.html',saveData:true,
    fetchImpl:()=>{count++;throw Error('offline')},schedule:fn=>fn()});
  assert.equal(save.start(),false);assert.equal(count,0);
  const offline=createCaptureCombatWarmupV1({documentUrl:'https://example.org/map.html',
    fetchImpl:()=>{count++;throw Error('offline')},schedule:fn=>fn()});
  assert.equal(offline.start(),true);
  assert.equal(count,CAPTURE_COMBAT_WARMUP_PATHS_V1.length);
});

test('only the actual Showcase player/back and enemy/front art is prefetched',async()=>{
  const bundle={creatureTransfers:[
    {draft:{id:'crea_mossback',presentation:{visual:{back:{assetId:'moss-back'}}}}},
    {draft:{id:'crea_nat_1',presentation:{visual:{front:{assetId:'grain-front'}}}}}
  ]};
  const assets={assets:[
    {id:'moss-back',resource:{file:'capture/creatures/moss/back.webp'}},
    {id:'grain-front',resource:{file:'capture/creatures/grain/front.webp'}},
    {id:'ignored',resource:{file:'capture/creatures/ignored.webp'}}
  ]};
  const party={activeCreatureId:'crea_mossback'};
  const files=captureEncounterVisualFilesV1({bundle,assetCatalog:assets,party,opponentId:'crea_nat_1'});
  assert.deepEqual(files,['capture/creatures/moss/back.webp','capture/creatures/grain/front.webp']);
  let requests=[];
  const warm=createCaptureCombatWarmupV1({
    documentUrl:'https://example.org/preview/encounters-v80/sculpt-lab.html',
    schedule:fn=>fn(),
    fetchImpl:async url=>{
      const path=url.pathname;requests.push(path);
      if(path.endsWith('encounter-bundle.v1.json'))return {ok:true,json:async()=>bundle};
      if(path.endsWith('global-visual-assets.v1.json'))return {ok:true,json:async()=>assets};
      if(path.endsWith('party.preview.v1.json'))return {ok:true,json:async()=>party};
      return {ok:true};
    }
  });
  assert.deepEqual(await warm.warmCreature('crea_nat_1'),files);
  assert.equal(requests.filter(x=>x.endsWith('.webp')).length,2);
  assert.deepEqual(await warm.warmCreature('crea_nat_1'),[]);
  assert.equal(requests.filter(x=>x.endsWith('.webp')).length,2);
});
