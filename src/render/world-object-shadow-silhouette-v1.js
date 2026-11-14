// The official WorldObject sprite stays the only visual authority.
// This helper memoizes one DERIVED alpha mask per image for affordable shadows;
// it does not own a second renderer or asset collection.
import {drawWorldObjectSprite} from './world-object-frame-selector.js?rev=waterfalls-v3';
const shadowSilhouettes=new WeakMap();
export function worldObjectShadowMaskV1(image,asset){
 if(!image||typeof image!=='object')return null;
 if(shadowSilhouettes.has(image))return shadowSilhouettes.get(image);
 const doc=image.ownerDocument??globalThis.document;
 if(typeof doc?.createElement!=='function')return null;
 const frame=asset?.animation;
 const srcW=Number.isFinite(frame?.frameWidth)?frame.frameWidth:(image.naturalWidth??image.width);
 const srcH=Number.isFinite(frame?.frameHeight)?frame.frameHeight:(image.naturalHeight??image.height);
 if(!(srcW>0&&srcH>0))return null;
 const scale=Math.min(1,192/Math.max(srcW,srcH));
 const w=Math.max(1,Math.round(srcW*scale)),h=Math.max(1,Math.round(srcH*scale));
 const canvas=doc.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 if(!c)return null;
 try{
  drawWorldObjectSprite(c,image,asset,{x:0,y:0,width:w,height:h},0);
  const rgba=c.getImageData(0,0,w,h).data;
  let left=w,right=-1,top=h,bottom=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rgba[(y*w+x)*4+3]>18){
   left=Math.min(left,x);right=Math.max(right,x);
   top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right<left)return null;
  c.globalCompositeOperation='source-in';
  c.fillStyle='#081116';c.fillRect(0,0,w,h);
  c.globalCompositeOperation='source-over';
  const mask=Object.freeze({canvas,w,h,left,top,right:1+right,bottom:1+bottom});
  shadowSilhouettes.set(image,mask);
  return mask;
 }catch{return null;}
}
