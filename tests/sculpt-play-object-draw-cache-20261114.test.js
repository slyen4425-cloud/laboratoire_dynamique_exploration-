import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptPlayObjectDrawCacheV1} from '../src/render/sculpt-play-object-draw-cache-v1.js';

const objects=[{id:'b',transform:{y:28}},{id:'a',transform:{y:12}},
 {id:'c',transform:{y:28}}];
test('play reuses ONE derived order across frames, preserving depth and ties',()=>{
 let calls=0;
 const cache=createSculptPlayObjectDrawCacheV1(values=>{calls++;return values.map(x=>({...x}));});
 const before=cache.get(objects,{playing:true});
 const again=cache.get(objects,{playing:true});
 assert.strictEqual(before,again);
 assert.equal(calls,1);
 assert.deepEqual(before.map(x=>x.id),['a','b','c']);
 // In the editor the underlying placements are live: no stale object UI.
 const editor=cache.get(objects,{playing:false});
 assert.equal(calls,2);
 assert.notStrictEqual(editor,before);
 const changed=objects.map(x=>x.id==='b'?{...x,transform:{y:2}}:x);
 const fresh=cache.get(changed,{playing:true});
 assert.deepEqual(fresh.map(x=>x.id),['b','a','c']);
 assert.equal(calls,3);
 cache.invalidate();
 cache.get(changed,{playing:true});
 assert.equal(calls,4);
});
test('the cache must not become a storage or scene authority',()=>{
 const cache=createSculptPlayObjectDrawCacheV1(v=>v);
 assert.throws(()=>cache.get({}, {playing:true}),/placements/);
 assert.equal(Object.hasOwn(cache,'save'),false);
 assert.equal(Object.hasOwn(cache,'set'),false);
});
