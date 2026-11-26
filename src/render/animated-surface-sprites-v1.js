// Authored full-surface sprite atlases. Source ZIP is built offline; the browser
// only loads the atlas of each material actually used. No procedural substitute.
export const SURFACE_FRAME_COUNT=9;
export const SURFACE_TILE=Object.freeze({width:168,height:126});
export function animatedSurfaceFrame(timeSeconds,fps=8,count=SURFACE_FRAME_COUNT){
 const t=Number.isFinite(timeSeconds)?timeSeconds:0;
 const rate=Number.isFinite(fps)?Math.max(1,Math.min(16,fps)):8;
 return ((Math.floor(t*rate)%count)+count)%count;
}
const names=Object.freeze({'water.clear_blue':'eau_bleue_profonde','water.turquoise':'eau_turquoise',
 'water.forest_stream':'eau_riviere','water.swamp':'eau_marais','water.lava':'lave'});
const rates=Object.freeze({'water.forest_stream':1.2,'water.swamp':.75,'water.lava':.85});
export function surfaceMaterialFrame(id,time,fps){return animatedSurfaceFrame(time,fps*(rates[id]??1));}
export function animatedSurfaceAtlasUrl(id){
 return names[id]?new URL('../../assets/exploration/materials/forest/water/animated/'+names[id]+'.png',import.meta.url).href:null;
}
const atlases=new Map(),frames=new Map();
export function loadAnimatedSurfaceAtlas(id,makeImage=()=>new Image()){
 const url=animatedSurfaceAtlasUrl(id);if(!url)return Promise.resolve(null);
 if(atlases.has(id))return atlases.get(id).promise;
 const entry={image:null,promise:null};atlases.set(id,entry);
 entry.promise=new Promise(resolve=>{
  const img=makeImage();img.onload=()=>{
   if(img.naturalWidth!==SURFACE_TILE.width*3||img.naturalHeight!==SURFACE_TILE.height*3){resolve(null);return;}
   entry.image=img;resolve(img);
  };img.onerror=()=>resolve(null);img.src=url;
 });return entry.promise;
}
// Keep only a single reusable frame canvas per material, never one per cell.
export function animatedSurfaceSprite(id,index,createCanvas=()=>document.createElement('canvas')){
 if(!names[id])return null;
 const image=atlases.get(id)?.image;
 if(!image){if(typeof Image!=='undefined')loadAnimatedSurfaceAtlas(id);return null;}
 const frame=((index%SURFACE_FRAME_COUNT)+SURFACE_FRAME_COUNT)%SURFACE_FRAME_COUNT;
 let cached=frames.get(id);const {width:w,height:h}=SURFACE_TILE;
 if(!cached){const canvas=createCanvas();canvas.width=w;canvas.height=h;cached={canvas,frame:-1};frames.set(id,cached);}
 if(cached.frame!==frame){
  const ctx=cached.canvas.getContext('2d');if(!ctx)return null;
  ctx.clearRect(0,0,w,h);ctx.drawImage(image,(frame%3)*w,Math.floor(frame/3)*h,w,h,0,0,w,h);cached.frame=frame;
 }
 return cached.canvas;
}
