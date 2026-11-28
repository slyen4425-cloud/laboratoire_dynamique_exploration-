import {buildRoadBorderField,roadBorderMappingAt,roadBorderFieldHasCell,roadBorderSpriteSamples} from './road-border-contour-v3.js';
const bandNames={naturelle:'Terre et herbe',cailloux:'Cailloux en bande',pierre_taillee:'Pierre taillée',beton:'Béton',bois:'Bois',neige:'Neige'};
const root='./assets/exploration/materials/road-borders/';
export const ROAD_BORDER_ASSETS=Object.freeze([
  ...Object.entries(bandNames).map(([key,label])=>Object.freeze({id:'road-border.bordure_'+key,label,kind:'band',path:root+'bandes/bordure_'+key+'.webp'})),
  Object.freeze({id:'road-border.cailloux',label:'Cailloux individuels (8 variantes)',kind:'sprites',paths:Object.freeze(Array.from({length:8},(_,i)=>root+'sprites_cailloux/caillou_'+String(i+1).padStart(2,'0')+'.webp'))})
]);
// Source PNG/WebP and IDs remain unchanged. The visible material is sampled
// from the original atlas, with alpha-only cleanup of the baked soil fringe.
// Anchors correspond to the actual object/vegetation, not the image midpoint.
const profiles=Object.freeze({
  naturelle:[59,0,0,70,84],cailloux:[58,0,0,68,83],
  pierre_taillee:[57,0,0,66,79],beton:[57,0,0,65,79],
  bois:[56,32,40,73,85],neige:[65,0,0,74,87]
});
export function roadBorderSourceProfile(id){
  const [anchor,topStart,topEnd,bottomStart,bottomEnd]=profiles[id?.replace('road-border.bordure_','')]??[64,0,0,128,128];
  return {anchor:anchor/128,topStart:topStart/128,topEnd:topEnd/128,bottomStart:bottomStart/128,bottomEnd:bottomEnd/128};
}
export function roadBorderSourceAlpha(profile,v){
  const clamp=x=>Math.max(0,Math.min(1,x));
  const top=profile.topEnd>profile.topStart?clamp((v-profile.topStart)/(profile.topEnd-profile.topStart)):1;
  const bottom=profile.bottomEnd>profile.bottomStart?clamp((profile.bottomEnd-v)/(profile.bottomEnd-profile.bottomStart)):1;
  return top*bottom;
}
const fields=new WeakMap(),rasterCaches=new WeakMap(),decoded=new WeakMap();
function fieldFor(routes){
  if(fields.has(routes))return fields.get(routes);
  const f=buildRoadBorderField(routes,ROAD_BORDER_ASSETS);
  if(Object.isFrozen(routes))fields.set(routes,f);
  return f;
}
// Public pure mapping used by the renderer AND numerical/browser regression
// tests. No quads, miter expansion or clipped rotating texture strips remain.
export function roadBorderTextureAt(field,x,y){return roadBorderMappingAt(field,x,y,roadBorderSourceProfile);}
export function roadBorderField(routes){return fieldFor(routes);}
function makeCanvas(w,h){
  if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);
  if(typeof document==='undefined')return null;
  const c=document.createElement('canvas');c.width=w;c.height=h;return c;
}
function readImage(image){
  if(!image)return null;
  if(decoded.has(image))return decoded.get(image);
  const w=image.naturalWidth??image.width,h=image.naturalHeight??image.height;
  if(!w||!h)return null;
  const canvas=makeCanvas(w,h),ctx=canvas?.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  ctx.drawImage(image,0,0);const pixels={w,h,data:ctx.getImageData(0,0,w,h).data};decoded.set(image,pixels);return pixels;
}
function sampleTexture(tex,u,v,profile){
  if(v<0||v>1)return {r:0,g:0,b:0,a:0};
  const x=u*tex.w-.5,y=Math.max(0,Math.min(tex.h-1,v*tex.h-.5));
  const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
  let a=0,r=0,g=0,b=0;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){
    const xx=((x0+i)%tex.w+tex.w)%tex.w,yy=Math.min(tex.h-1,y0+j),k=(yy*tex.w+xx)*4;
    const weight=(i?fx:1-fx)*(j?fy:1-fy)*tex.data[k+3]/255*roadBorderSourceAlpha(profile,(yy+.5)/tex.h);
    a+=weight;r+=tex.data[k]*weight;g+=tex.data[k+1]*weight;b+=tex.data[k+2]*weight;
  }
  return {r,g,b,a};
}
const TILE_CACHE_LIMIT=768,RASTER_SCALE=2;
function cacheFor(field,tile,images){
  const refs=[];
  for(const entry of field.entries)for(const {asset} of Object.values(entry.styles))if(!refs.some(x=>x[0]===asset.id))refs.push([asset.id,images.get(asset.id)]);
  const old=rasterCaches.get(field);
  if(old&&old.w===tile.width&&old.h===tile.height&&old.refs.length===refs.length&&refs.every(([id,ref],i)=>old.refs[i][0]===id&&old.refs[i][1]===ref))return old;
  const c={w:tile.width,h:tile.height,refs,tiles:new Map(),emptyTiles:new Set(),bandCells:new Map(),textures:new Map(),spriteBuckets:new Map()};
  for(const [id,imgs] of refs){
    const asset=ROAD_BORDER_ASSETS.find(a=>a.id===id);
    if(asset?.kind==='band'&&imgs?.[0]){
      const texture=readImage(imgs[0]);if(texture)c.textures.set(id,texture);
    }
  }
  for(const s of roadBorderSpriteSamples(field)){
    if(!images.has(s.asset.id))continue;
    for(let row=Math.floor((s.y-s.thick)/tile.height);row<=Math.floor((s.y+s.thick)/tile.height);row++)
      for(let col=Math.floor((s.x-s.thick)/tile.width);col<=Math.floor((s.x+s.thick)/tile.width);col++){
        const k=col+','+row;if(!c.spriteBuckets.has(k))c.spriteBuckets.set(k,[]);c.spriteBuckets.get(k).push(s);
      }
  }
  rasterCaches.set(field,c);return c;
}
function tileRaster(field,cache,col,row){
  const key=col+','+row;
  if(cache.emptyTiles.has(key))return null;
  if(cache.tiles.has(key)){const old=cache.tiles.get(key);cache.tiles.delete(key);cache.tiles.set(key,old);return old;}
  const w=Math.ceil(cache.w*RASTER_SCALE),h=Math.ceil(cache.h*RASTER_SCALE);
  const canvas=makeCanvas(w,h),ctx=canvas?.getContext('2d');if(!ctx)return null;
  const pixels=ctx.createImageData(w,h);let visible=false;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const wx=col*cache.w+(x+.5)*cache.w/w,wy=row*cache.h+(y+.5)*cache.h/h;
    let a=0,r=0,g=0,b=0;
    for(const s of roadBorderTextureAt(field,wx,wy)){
      const texture=cache.textures.get(s.asset.id);if(!texture)continue;
      let q=sampleTexture(texture,s.u,s.v,s.profile);
      if(s.alternateV!==null){
        const other=sampleTexture(texture,s.u,s.alternateV,s.profile),w=s.flip;
        q={r:q.r*(1-w)+other.r*w,g:q.g*(1-w)+other.g*w,b:q.b*(1-w)+other.b*w,a:q.a*(1-w)+other.a*w};
      }
      const opacity=s.style.opacity;
      const alpha=q.a*opacity;if(alpha<=0)continue;
      r=q.r*opacity+r*(1-alpha);g=q.g*opacity+g*(1-alpha);b=q.b*opacity+b*(1-alpha);a=alpha+a*(1-alpha);
    }
    if(a>0){const i=(y*w+x)*4;pixels.data[i]=r/a;pixels.data[i+1]=g/a;pixels.data[i+2]=b/a;pixels.data[i+3]=a*255;visible=true;}
  }
  if(visible)ctx.putImageData(pixels,0,0);
  if(!visible){if(cache.emptyTiles.size>4096)cache.emptyTiles.clear();cache.emptyTiles.add(key);return null;}
  cache.tiles.set(key,canvas);
  if(cache.tiles.size>TILE_CACHE_LIMIT)cache.tiles.delete(cache.tiles.keys().next().value);
  return canvas;
}
export function roadBorderCellPainter(ctx,terrain,tile,routes,images){
  if(!routes?.some(r=>r.border?.enabled))return null;
  const field=fieldFor(routes),cache=cacheFor(field,tile,images);
  if(!cache.textures.size&&!cache.spriteBuckets.size)return null;
  const hasBand=(col,row)=>{
    if(!cache.textures.size)return false;
    const key=col+','+row;
    if(!cache.bandCells.has(key))cache.bandCells.set(key,roadBorderFieldHasCell(field,col*tile.width,row*tile.height,tile.width,tile.height));
    return cache.bandCells.get(key);
  };
  const paint=(col,row,level)=>{
    const key=col+','+row,band=hasBand(col,row)?tileRaster(field,cache,col,row):null;
    if(band){
      ctx.save();ctx.globalAlpha=1;
      ctx.drawImage(band,col*tile.width,row*tile.height-level*tile.rise,tile.width,tile.height);ctx.restore();
    }
    for(const s of cache.spriteBuckets.get(key)??[]){
      const imgs=images.get(s.asset.id),image=imgs?.[s.index%imgs.length];if(!image?.naturalWidth)continue;
      ctx.save();ctx.globalAlpha=s.style.opacity;ctx.translate(s.x,s.y-level*tile.rise);ctx.rotate(s.angle);
      ctx.drawImage(image,-s.thick/2,-s.thick/2,s.thick,s.thick);ctx.restore();
    }
  };
  paint.hasCell=(col,row)=>cache.spriteBuckets.has(col+','+row)||hasBand(col,row);
  return paint;
}
