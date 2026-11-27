import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptMaterialFrameCacheV1} from '../src/render/sculpt-material-frame-cache-v1.js';
const image={naturalWidth:64,naturalHeight:64},asset={animation:{frames:4,columns:2,frameWidth:32,frameHeight:32,fps:8}};
const calls=[];const cache=createSculptMaterialFrameCacheV1({makeCanvas:()=>({getContext:()=>({clearRect:(...a)=>calls.push(['clear',...a]),drawImage:(...a)=>calls.push(['draw',...a])})})});
test('one material pattern canvas selects atlas frame, preserves size and clears alpha between frames',()=>{
 const canvas=cache.create(image,asset,0);assert.equal(canvas.width,32);assert.equal(canvas.height,32);
 assert.deepEqual(calls.slice(-2),[['clear',0,0,32,32],['draw',image,0,0,32,32,0,0,32,32]]);
 assert.equal(cache.update([canvas,canvas,null,{}],.02),false);
 assert.equal(cache.update([canvas,canvas,null,{}],.25),true);
 assert.deepEqual(calls.slice(-2),[['clear',0,0,32,32],['draw',image,0,32,32,32,0,0,32,32]]);
 assert.equal(cache.update([canvas],.5),true);
 assert.deepEqual(calls.at(-1),['draw',image,0,0,32,32,0,0,32,32]);
 assert.equal(cache.maxFps([canvas,{},null]),8);assert.equal(cache.maxFps([null,{}]),0);
 assert.throws(()=>cache.create({...image,naturalWidth:63},asset),/Atlas/);
});
