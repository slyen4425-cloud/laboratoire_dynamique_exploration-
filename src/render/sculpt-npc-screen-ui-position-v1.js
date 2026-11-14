// Pure screen-space placement for interaction UI. The native Sculpt camera
// remains the sole world->screen projection owner, passed in as 'projected'.
// This module never moves an actor, a canvas, a camera or a WorldArea.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function sculptNpcScreenUiPositionV1({
 projected,pan,zoom,canvasRect,viewportWidth,viewportHeight,
 boxWidth=340,boxHeight=170,aboveGap=20
}={}){
 if(!finite(projected?.x)||!finite(projected?.y)||
  !finite(pan?.x)||!finite(pan?.y)||!finite(zoom)||zoom<=0||
  !finite(canvasRect?.left)||!finite(canvasRect?.top)||
  !finite(viewportWidth)||!finite(viewportHeight)||viewportWidth<=0||viewportHeight<=0)
  throw new TypeError('Sculpt camera and a viewport are required');
 const margin=8;
 const width=Math.min(Math.max(1,boxWidth),Math.max(1,viewportWidth-margin*2));
 const height=Math.min(Math.max(1,boxHeight),Math.max(1,viewportHeight-margin*2));
 const x=canvasRect.left+pan.x+projected.x*zoom;
 const y=canvasRect.top+pan.y+projected.y*zoom;
 // Prefer an actual speech bubble above the NPC. Flip below the NPC when
 // there is not enough room at the top, never conceal the entire viewport.
 const preferred=y-height-aboveGap;
 const top=clamp(preferred>=margin?preferred:y+aboveGap,
  margin,Math.max(margin,viewportHeight-height-margin));
 const left=clamp(x-width/2,margin,Math.max(margin,viewportWidth-width-margin));
 return Object.freeze({left,top,width,height});
}
