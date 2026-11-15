import test from 'node:test';
import assert from 'node:assert/strict';
import {worldObjectShadowMaskV1} from '../src/render/world-object-shadow-silhouette-v1.js';
import {drawWorldObjectContactShadowV1} from '../src/render/world-object-renderer.js';

test('building keeps a genuine projected silhouette anchored to the foot, never the detached facade band',()=>{
 const width=32,height=24,pixels=new Uint8ClampedArray(width*height*4);
 for(let y=4;y<height-1;y++)for(let x=3;x<29;x++){
  const foot=x<14?17:22;
  if(y<=foot)pixels[(y*width+x)*4+3]=255;
 }
 const scratch={drawImage(){},getImageData(){return {data:pixels}},
  fillRect(){},set globalCompositeOperation(_){},set fillStyle(_){}};
 const document={createElement:()=>({width:0,height:0,getContext:()=>scratch})};
 const image={naturalWidth:width,naturalHeight:height,ownerDocument:document};
 const mask=worldObjectShadowMaskV1(image,null);
 assert.ok(mask?.canvas);
 assert.equal(mask.contactCanvas,undefined,'no artificial wall-band canvas');
 assert.equal(worldObjectShadowMaskV1(image,null),mask,'one cached source');
 const draws=[],transforms=[],translate=[];
 const ctx={save(){},restore(){},translate(...a){translate.push(a)},transform(...a){transforms.push(a)},
  drawImage(...args){draws.push(args)},set globalAlpha(_){}};
 assert.equal(drawWorldObjectContactShadowV1(ctx,
  {kind:'building',width:160,height:120,footOffset:60,image}),true);
 assert.equal(draws.length,1,'one real shadow, not a superposed decal');
 assert.equal(draws[0][0],mask.canvas,'casts actual artwork silhouette');
 assert.deepEqual(translate,[[0,61]],'last visible silhouette pixel meets the ground foot');
 assert.ok(transforms[0][2]<0 && transforms[0][3]>0,'shadow remains directional');
 assert.equal(draws[0][4],mask.right-mask.left,'real alpha silhouette bounds');
 assert.equal(drawWorldObjectContactShadowV1(ctx,
  {kind:'bridge',width:160,height:120,image}),false,'bridges remain excluded');
});
