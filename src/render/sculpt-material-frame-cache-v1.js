// Read-only render cache, not an asset store. Reuse native object atlas frame
// selection for personal material patterns; keep one canvas per decoded image.
import {worldObjectAnimationFrame} from './world-object-frame-selector.js';
export function createSculptMaterialFrameCacheV1({makeCanvas=()=>document.createElement('canvas')}={}){
 const frames=new WeakMap();
 function refresh(canvas,state,time){
  const frame=worldObjectAnimationFrame(state.asset,time);
  if(!frame||frame.index===state.index)return false;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(state.image,frame.x,frame.y,frame.width,frame.height,0,0,canvas.width,canvas.height);
  state.index=frame.index;return true;
 }
 return Object.freeze({
  create(image,asset,time=0){
   const frame=worldObjectAnimationFrame(asset,time),a=asset?.animation;
   if(!frame||image.naturalWidth!==a.columns*a.frameWidth||image.naturalHeight!==Math.ceil(a.frames/a.columns)*a.frameHeight)throw Error('Atlas de texture incompatible');
   const canvas=makeCanvas();canvas.width=frame.width;canvas.height=frame.height;
   const state={image,asset,index:-1};refresh(canvas,state,time);frames.set(canvas,state);return canvas;
  },
  update(sources,time){let changed=false;for(const source of new Set(sources)){const state=frames.get(source);if(state&&refresh(source,state,time))changed=true;}return changed;},
  maxFps(sources){let fps=0;for(const source of sources)fps=Math.max(fps,frames.get(source)?.asset.animation.fps??0);return fps;}
 });
}
