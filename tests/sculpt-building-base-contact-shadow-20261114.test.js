import test from 'node:test';
import assert from 'node:assert/strict';
import {worldObjectShadowMaskV1} from '../src/render/world-object-shadow-silhouette-v1.js';
import {drawWorldObjectContactShadowV1} from '../src/render/world-object-renderer.js';

test('houses use their actual grounded outline along facade and side, never a full oval',()=>{
 const width=32,height=24,pixels=new Uint8ClampedArray(width*height*4);
 for(let y=4;y<height-1;y++)for(let x=3;x<29;x++){
  // Left-side wall ends higher in perspective than the door/front.
  const foot=x<14?17:22;
  if(y<=foot)pixels[(y*width+x)*4+3]=255;
 }
 const draws=[];
 const document={createElement:()=>({
  width:0,height:0,getContext(){return {
   drawImage(){},getImageData(){return {data:pixels}},
   fillRect(){},set globalCompositeOperation(_){},set fillStyle(_){},
  };}
 })};
 const image={naturalWidth:width,naturalHeight:height,ownerDocument:document};
 const mask=worldObjectShadowMaskV1(image,null,{groundContact:true});
 assert.ok(mask?.contactCanvas,'derived once from the official pixel source');
 assert.ok(mask.contactColumns>=20,'covers front and side base, not only center');
 const ctx={save(){},restore(){},translate(){},transform(){},
   drawImage(...args){draws.push(args)},set globalAlpha(_){}};
 assert.equal(drawWorldObjectContactShadowV1(ctx,
  {kind:'building',width:160,height:120,footOffset:60,image}),true);
 assert.equal(draws.length,2,'directional silhouette plus continuous base contact');
 assert.equal(draws[1][0],mask.contactCanvas);
 assert.equal(drawWorldObjectContactShadowV1(ctx,
  {kind:'bridge',width:160,height:120,image}),false,'bridges stay excluded');
});
