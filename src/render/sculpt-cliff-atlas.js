// Sculpt-Lab visual asset adapter only. The cliff surface, shape,
// passability and Material Registry remain owned by existing systems.
// Atlas is precompiled from the five hand-reviewed generated art layers.
export const SCULPT_CLIFF_ATLAS_V47=Object.freeze({
  file:'../../assets/sculpt/cliff-atlas-v47.webp',
  width:256,height:213,
  layers:Object.freeze({
    gray:Object.freeze({x:0,y:0,width:128,height:128}),
    ochre:Object.freeze({x:128,y:0,width:128,height:128}),
    cracks:Object.freeze({x:0,y:128,width:85,height:85}),
    chunks:Object.freeze({x:85,y:128,width:85,height:85}),
    moss:Object.freeze({x:170,y:128,width:85,height:85})
  })
});
const textureCache=new WeakMap();
export function cliffAtlasTheme(palette){
  return ['warm','sandstone','ochre'].includes(palette)?'ochre':'gray';
}
export function sculptCliffAtlasHasLayers(image){
  return !!image&&image.complete===true&&
    image.naturalWidth===SCULPT_CLIFF_ATLAS_V47.width&&
    image.naturalHeight===SCULPT_CLIFF_ATLAS_V47.height;
}
function splitAtlas(image){
  let cached=textureCache.get(image);
  if(cached)return cached;
  const doc=image.ownerDocument??(typeof document==='undefined'?null:document);
  if(!doc?.createElement)return null;
  const layers={};
  for(const [name,area] of Object.entries(SCULPT_CLIFF_ATLAS_V47.layers)){
    const canvas=doc.createElement('canvas');
    canvas.width=area.width;canvas.height=area.height;
    const ctx=canvas.getContext('2d');
    if(!ctx)return null;
    ctx.drawImage(image,area.x,area.y,area.width,area.height,
      0,0,area.width,area.height);
    layers[name]=canvas;
  }
  cached=Object.freeze(layers);
  textureCache.set(image,cached);
  return cached;
}
// Called from within rockFace's PREEXISTING clipping path. Pattern coordinates
// are world-anchored to keep neighboring horizontal cliff runs continuous.
export function drawSculptCliffAtlas(ctx,{
  image,rockPalette='warm',colors,x,y,width,height,seed=0,moss=false
}={}){
  if(!ctx||!sculptCliffAtlasHasLayers(image)||width<=0||height<=0)return false;
  const layers=splitAtlas(image);
  if(!layers)return false;
  ctx.save();
  const paint=(name,opacity,offset=0)=>{
    const pattern=ctx.createPattern(layers[name],'repeat');
    if(!pattern)return;
    if(pattern.setTransform&&typeof DOMMatrix!=='undefined'){
      const shift=offset?((seed*29+17)%37):0;
      pattern.setTransform(new DOMMatrix().translate(shift,offset?((seed*7)%31):0));
    }
    ctx.globalAlpha=opacity;
    ctx.fillStyle=pattern;
    ctx.fillRect(x,y,width,height);
  };
  paint(cliffAtlasTheme(rockPalette),.88);
  // Keep existing palette's directional lighting: dark preset should stay
  // dark, warm presets remain golden without adding new material authorities.
  if(colors&&rockPalette==='dark'){
    ctx.globalAlpha=.34;
    ctx.globalCompositeOperation='multiply';
    ctx.fillStyle=colors[2];ctx.fillRect(x,y,width,height);
    ctx.globalCompositeOperation='source-over';
  }else if(colors&&rockPalette==='granite'){
    ctx.globalAlpha=.12;ctx.fillStyle=colors[1];ctx.fillRect(x,y,width,height);
  }
  paint('cracks',.35,1);
  if((seed&3)!==1)paint('chunks',.18,1);
  if(moss&&seed%5===0)paint('moss',.22,1);
  ctx.restore();
  return true;
}
