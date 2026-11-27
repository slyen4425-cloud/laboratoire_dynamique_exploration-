// Authored full-surface sprite atlases. Source ZIP is built offline; the browser
// only loads the atlas of each material actually used. No procedural substitute.
export const SURFACE_FRAME_COUNT=36;
export const SURFACE_ATLAS_COLUMNS=6,SURFACE_ATLAS_ROWS=6;
// The old 1–16 stored value is now a motion speed, not display cadence.
// Twice as long per cycle at the same setting; display at 24 Hz even when slow.
export const SURFACE_RENDER_FPS=24;
export const SURFACE_TILE=Object.freeze({width:168,height:126});
export function animatedSurfaceFrame(timeSeconds,fps=8,count=SURFACE_FRAME_COUNT){
 const t=Number.isFinite(timeSeconds)?timeSeconds:0;
 const rate=Number.isFinite(fps)?Math.max(1,Math.min(16,fps)):8;
 return ((Math.floor(t*rate)%count)+count)%count;
}
const names=Object.freeze({'water.clear_blue':'eau_bleue_profonde','water.turquoise':'eau_turquoise',
 'water.forest_stream':'eau_riviere','water.swamp':'eau_marais','water.lava':'lave'});
const rates=Object.freeze({'water.forest_stream':1.2,'water.swamp':.75,'water.lava':.85});
export function surfaceMaterialFrame(id,time,fps=8){
 const t=Number.isFinite(time)?time:0,rate=Number.isFinite(fps)?Math.max(1,Math.min(16,fps)):8;
 const phase=t*rate*2*(rates[id]??1);
 return ((phase%SURFACE_FRAME_COUNT)+SURFACE_FRAME_COUNT)%SURFACE_FRAME_COUNT;
}
export function animatedSurfaceAtlasUrl(id){
 return names[id]?new URL('../../assets/exploration/materials/forest/water/animated/'+names[id]+'.png?rev=surface-fluidity-36-v1',import.meta.url).href:null;
}
const atlases=new Map(),frames=new Map();
export function loadAnimatedSurfaceAtlas(id,makeImage=()=>new Image()){
 const url=animatedSurfaceAtlasUrl(id);if(!url)return Promise.resolve(null);
 if(atlases.has(id))return atlases.get(id).promise;
 const entry={image:null,promise:null};atlases.set(id,entry);
 entry.promise=new Promise(resolve=>{
  const img=makeImage();img.onload=()=>{
   if(img.naturalWidth!==SURFACE_TILE.width*SURFACE_ATLAS_COLUMNS||img.naturalHeight!==SURFACE_TILE.height*SURFACE_ATLAS_ROWS){resolve(null);return;}
   entry.image=img;resolve(img);
  };img.onerror=()=>resolve(null);img.src=url;
 });return entry.promise;
}
// Keep only a single reusable frame canvas per material, never one per cell.
export function animatedSurfaceSprite(id,index,createCanvas=()=>document.createElement('canvas')){
 if(!names[id])return null;
 const image=atlases.get(id)?.image;
 if(!image){if(typeof Image!=='undefined')loadAnimatedSurfaceAtlas(id);return null;}
 const phase=Number.isFinite(index)?index:0;
 const frame=((phase%SURFACE_FRAME_COUNT)+SURFACE_FRAME_COUNT)%SURFACE_FRAME_COUNT;
 let cached=frames.get(id);const {width:w,height:h}=SURFACE_TILE;
 if(!cached){const canvas=createCanvas();canvas.width=w;canvas.height=h;cached={canvas,frame:-1};frames.set(id,cached);}
 if(cached.frame!==frame){
  const ctx=cached.canvas.getContext('2d');if(!ctx)return null;
  const first=Math.floor(frame),fraction=frame-first;
  const draw=i=>ctx.drawImage(image,(i%SURFACE_ATLAS_COLUMNS)*w,Math.floor(i/SURFACE_ATLAS_COLUMNS)*h,w,h,0,0,w,h);
  ctx.clearRect(0,0,w,h);ctx.globalAlpha=1;draw(first);
  if(fraction>1e-6){ctx.globalAlpha=fraction;draw((first+1)%SURFACE_FRAME_COUNT);ctx.globalAlpha=1;}
  cached.frame=frame;
 }
 return cached.canvas;
}
