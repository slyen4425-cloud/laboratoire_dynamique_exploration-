import {sculptCliffHDLayers} from './sculpt-cliff-hd.js';
// Sculpt-Lab visual asset adapter only. The cliff surface, shape,
// passability and Material Registry remain owned by existing systems.
// Atlas is precompiled from the five hand-reviewed generated art layers.
export const SCULPT_CLIFF_ATLAS_V47=Object.freeze({
  file:'../../assets/sculpt/cliff-atlas-v47.webp',
  width:192,height:160,
  layers:Object.freeze({
    gray:Object.freeze({x:0,y:0,width:96,height:96}),
    ochre:Object.freeze({x:96,y:0,width:96,height:96}),
    cracks:Object.freeze({x:0,y:96,width:64,height:64}),
    chunks:Object.freeze({x:64,y:96,width:64,height:64}),
    moss:Object.freeze({x:128,y:96,width:64,height:64})
  })
});
export function resolveSculptCliffAtlasUrl(){
  return new URL(SCULPT_CLIFF_ATLAS_V47.file,import.meta.url).href;
}
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
// Stable low-cost visual relief islands. The base atlas stays world-anchored;
// only limited patches are offset to break the visible 96px repeat. Never
// create a second geometry, collision or surface model.
function cliffHash(seed,salt){
  let n=Math.imul((seed|0)^(salt*761),2246822519)|0;
  n=Math.imul(n^(n>>>13),3266489917);
  return (n^(n>>>16))>>>0;
}
export function sculptCliffVariationPlan({width=0,height=0,seed=0}={}){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<42||height<27)
    return Object.freeze([]);
  const count=Math.max(1,Math.min(6,Math.floor(width/110)+Math.floor(height/92)+1));
  const out=[];
  for(let i=0;i<count;i++){
    const q=cliffHash(seed,i+17),col=(i+.5)/count;
    const centerX=width*(col+((q%29)-14)/160/count);
    const centerY=height*(.18+((q>>>8)%61)/100);
    const radiusX=Math.min(65,width/count*.47);
    const radiusY=Math.min(30,height*.26);
    const points=Object.freeze([
      Object.freeze([centerX-radiusX*.88,centerY-radiusY*.2]),
      Object.freeze([centerX-radiusX*.35,centerY-radiusY]),
      Object.freeze([centerX+radiusX*.49,centerY-radiusY*.85]),
      Object.freeze([centerX+radiusX,centerY+radiusY*.17]),
      Object.freeze([centerX+radiusX*.31,centerY+radiusY]),
      Object.freeze([centerX-radiusX*.74,centerY+radiusY*.54])
    ]);
    out.push(Object.freeze({points,opacity:.12+(q%12)/100,
      offsetSeed:(q%40)+1}));
  }
  return Object.freeze(out);
}
// Called from within rockFace's PREEXISTING clipping path. Pattern coordinates
// are world-anchored to keep neighboring horizontal cliff runs continuous.
export function drawSculptCliffAtlas(ctx,{
  image,hdImage=null,rockPalette='warm',colors,x,y,width,height,seed=0,moss=false
}={}){
  if(!ctx||!sculptCliffAtlasHasLayers(image)||width<=0||height<=0)return false;
  const layers=splitAtlas(image);
  if(!layers)return false;
  const hiRes=sculptCliffHDLayers(hdImage);
  const paintLayers=hiRes?Object.freeze({...layers,gray:hiRes.gray,ochre:hiRes.ochre}):layers;
  ctx.save();
  const paint=(name,opacity,offset=0)=>{
    const pattern=ctx.createPattern(paintLayers[name],'repeat');
    if(!pattern)return;
    if(pattern.setTransform&&typeof DOMMatrix!=='undefined'){
      const shift=offset?((seed*29+17)%37):0;
      pattern.setTransform(new DOMMatrix().translate(shift,offset?((seed*7)%31):0));
    }
    ctx.globalAlpha=opacity;
    ctx.fillStyle=pattern;
    ctx.fillRect(x,y,width,height);
  };
  const base=cliffAtlasTheme(rockPalette);
  paint(base,.86);
  // Distinct soft, faceted irregular islands offset the original artwork
  // without a seam-producing horizontal tile grid; only a handful per run.
  for(const patch of sculptCliffVariationPlan({width,height,seed})){
    ctx.save();ctx.beginPath();
    patch.points.forEach(([dx,dy],i)=>{
      if(i===0)ctx.moveTo(x+dx,y+dy);else ctx.lineTo(x+dx,y+dy);
    });
    ctx.closePath();ctx.clip();
    paint(base,patch.opacity,patch.offsetSeed);
    ctx.restore();
  }
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
  // The V47 texture had hidden most of the V37/V45 rock depth gradient
  // underneath opaque paint. Reintroduce it LAST, within the already clipped
  // cliff silhouette: pale upper wall, deeper shadow down at the rock foot.
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  const depth=ctx.createLinearGradient(x,y,x,y+height);
  depth.addColorStop(0,'rgba(14,21,34,0.00)');
  depth.addColorStop(.28,'rgba(14,21,34,0.04)');
  depth.addColorStop(.73,'rgba(14,21,34,0.18)');
  depth.addColorStop(1,'rgba(14,21,34,0.33)');
  ctx.fillStyle=depth;ctx.fillRect(x,y,width,height);
  // Directional shade gives the flat cliff its side-facing volume as in V37.
  const side=ctx.createLinearGradient(x,y,x+width,y);
  side.addColorStop(0,'rgba(249,229,194,.10)');
  side.addColorStop(.40,'rgba(15,22,33,.01)');
  side.addColorStop(1,'rgba(13,20,34,.17)');
  ctx.fillStyle=side;ctx.fillRect(x,y,width,height);
  ctx.restore();
  return true;
}
