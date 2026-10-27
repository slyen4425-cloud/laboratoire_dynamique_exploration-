// Visual resource only. V49 uses genuinely sampled high-res source PNGs,
// never a stretched/upscaled V47 96x96 atlas. Overlays remain in V47.
export const SCULPT_CLIFF_HD_V49=Object.freeze({
  file:'../../assets/sculpt/cliff-base-hd-v49.webp',
  width:512,height:256,
  layers:Object.freeze({
    gray:Object.freeze({x:0,y:0,width:256,height:256}),
    ochre:Object.freeze({x:256,y:0,width:256,height:256})
  })
});
export const resolveSculptCliffHDUrl=()=>new URL(SCULPT_CLIFF_HD_V49.file,import.meta.url).href;
export function sculptCliffHDReady(image){
  return !!image&&image.complete===true&&
    image.naturalWidth===SCULPT_CLIFF_HD_V49.width&&
    image.naturalHeight===SCULPT_CLIFF_HD_V49.height;
}
const atlasByImage=new WeakMap();
export function sculptCliffHDLayers(image){
  if(!sculptCliffHDReady(image))return null;
  if(atlasByImage.has(image))return atlasByImage.get(image);
  const doc=image.ownerDocument??(typeof document==='undefined'?null:document);
  if(!doc?.createElement)return null;
  const layers={};
  for(const [name,box] of Object.entries(SCULPT_CLIFF_HD_V49.layers)){
    const canvas=doc.createElement('canvas');
    canvas.width=box.width;canvas.height=box.height;
    const ctx=canvas.getContext('2d');
    if(!ctx)return null;
    // Native 256px artwork stays at native pixel density in the pattern.
    ctx.drawImage(image,box.x,box.y,box.width,box.height,0,0,box.width,box.height);
    layers[name]=canvas;
  }
  const result=Object.freeze(layers);
  atlasByImage.set(image,result);
  return result;
}
