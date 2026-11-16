import test from 'node:test';
import assert from 'node:assert/strict';
import {readCaptureLoadingArtSceneV1,createCaptureLoadingArtCycleV1}
 from '../src/play/exploration-loading-art-v1.js';
const origin='https://gensrpg.example';
test('custom loading art validates same-origin Blob URLs only',()=>{
 const valid=['blob:'+origin+'/a','blob:'+origin+'/b'];
 const url=new URL(origin+'/sculpt-lab.html');
 url.searchParams.set('loadingArtZone',JSON.stringify([...valid,'https://evil.example/file.png']));
 assert.deepEqual(readCaptureLoadingArtSceneV1({
  href:url.href,scene:'zone'
 }),valid);
 assert.deepEqual(readCaptureLoadingArtSceneV1({
  href:origin+'/sculpt-lab.html?loadingArtCombat=%7B',scene:'combat'
 }),[]);
});
test('rotation uses each image once and cycles without modifying source data',()=>{
 const entries=Object.freeze(['a','b','c']);
 const cycle=createCaptureLoadingArtCycleV1(entries);
 assert.deepEqual([cycle.next(),cycle.next(),cycle.next(),cycle.next()],['a','b','c','a']);
 assert.deepEqual(entries,['a','b','c']);
 assert.equal(createCaptureLoadingArtCycleV1().next(),null);
});
