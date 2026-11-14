import test from 'node:test';
import assert from 'node:assert/strict';
import {worldObjectShadowProjectionV1,drawWorldObjectContactShadowV1} from '../src/render/world-object-renderer.js';

test('a tree shadow is the source art alpha, rooted at the object foot',()=>{
 const p=worldObjectShadowProjectionV1({width:120,height:180,footOffset:74,pitch:.7});
 assert.equal(p.footY,75);
 assert.ok(p.shear<0&&p.flatten>0&&p.flatten<.4);
 const events=[];
 const source={naturalWidth:20,naturalHeight:30};
 const pixels=new Uint8ClampedArray(20*30*4);
 // Tree canopy and one trunk: transparent corners must stay transparent.
 for(let y=0;y<30;y++)for(let x=0;x<20;x++)
  if((y<19&&Math.hypot(x-10,y-10)<9)||(y>=19&&x>=9&&x<=11))
   pixels[(y*20+x)*4+3]=255;
 const scratch={drawImage(){},getImageData(){return {data:pixels}},
  fillRect(){},set globalCompositeOperation(v){},set fillStyle(v){}};
 const document={createElement(tag){
  assert.equal(tag,'canvas');
  return {getContext:()=>scratch};
 }};
 source.ownerDocument=document;
 const ctx={save(){events.push('save')},restore(){events.push('restore')},
  translate(...a){events.push(['translate',...a])},
  transform(...a){events.push(['transform',...a])},
  drawImage(...a){events.push(['image',...a])},
  set globalAlpha(v){events.push(['alpha',v]);}};
 assert.equal(drawWorldObjectContactShadowV1(ctx,
  {kind:'tree',width:120,height:180,footOffset:74,image:source}),true);
 const draw=events.find(e=>e[0]==='image');
 assert.ok(draw,'draws actual alpha mask not an ellipse');
 assert.ok(draw[4]>0&&draw[5]>0,'source bounds are nonempty');
 assert.deepEqual(events.find(e=>e[0]==='translate'),['translate',0,75]);
 assert.equal(events.some(e=>e[0]==='ellipse'),false);
 assert.equal(drawWorldObjectContactShadowV1(ctx,
  {kind:'waterfall',width:120,height:180,image:source}),false);
});
