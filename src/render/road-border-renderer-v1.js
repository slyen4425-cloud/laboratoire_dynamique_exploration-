import {squareSurfaceStrokeContainsPoint} from '../world/surface-brush-geometry.js';
const bandNames={naturelle:'Terre et herbe',cailloux:'Cailloux en bande',pierre_taillee:'Pierre taillée',beton:'Béton',bois:'Bois',neige:'Neige'};
const root='./assets/exploration/materials/road-borders/';
export const ROAD_BORDER_ASSETS=Object.freeze([
  ...Object.entries(bandNames).map(([key,label])=>Object.freeze({id:'road-border.bordure_'+key,label,kind:'band',path:root+'bandes/bordure_'+key+'.webp'})),
  Object.freeze({id:'road-border.cailloux',label:'Cailloux individuels (8 variantes)',kind:'sprites',paths:Object.freeze(Array.from({length:8},(_,i)=>root+'sprites_cailloux/caillou_'+String(i+1).padStart(2,'0')+'.webp'))})
]);
const distance=(p,a,b)=>{
  const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
  const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
};
function contains(route,p){
  if(route.brushShape==='square')return squareSurfaceStrokeContainsPoint(route.points,p.x,p.y,route.width/2);
  return route.points.some((b,i)=>i&&distance(p,route.points[i-1],b)<route.width/2-.01);
}
function samplePath(points){
  const segments=[];let length=0;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],d=Math.hypot(b.x-a.x,b.y-a.y);
    if(d<1e-6)continue;
    segments.push({a,b,start:length,end:length+d,dx:(b.x-a.x)/d,dy:(b.y-a.y)/d});length+=d;
  }
  const sample=s=>{
    const t=Math.max(0,Math.min(length,s));
    const seg=segments.find(v=>v.end>=t)??segments.at(-1);
    if(!seg)return null;
    return {x:seg.a.x+seg.dx*(t-seg.start),y:seg.a.y+seg.dy*(t-seg.start)};
  };
  return {length,sample};
}
// Read-only border samples in map coordinates. No collision or encounter data.
export function roadBorderSamples(routes){
  const output=[];
  for(const route of routes){
    if(!route.border?.enabled)continue;
    const {length,sample}=samplePath(route.points);
    if(length<.01)continue;
    for(const [key,sign] of [['left',-1],['right',1]]){
      const style=route.border[key];if(!style||style.opacity<=0)continue;
      const asset=ROAD_BORDER_ASSETS.find(x=>x.id===style.assetId);if(!asset)continue;
      const thick=style.width*style.scale,period=Math.max(1,thick*4);
      const step=asset.kind==='sprites'?Math.max(1,thick+style.spacing):Math.max(1,Math.min(4,thick/2));
      let index=0;
      for(let s=0;s<length;s+=step,index++){
        const span=Math.min(step,length-s),mid=s+span/2,p=sample(mid);
        const a=sample(mid-Math.min(2,span/2)),b=sample(mid+Math.min(2,span/2));
        const d=Math.hypot(b.x-a.x,b.y-a.y);if(d<1e-6)continue;
        const dx=(b.x-a.x)/d,dy=(b.y-a.y)/d,edge=route.width/2+style.offset;
        const pos={x:p.x-dy*edge*sign,y:p.y+dx*edge*sign};
        // Other road interiors suppress shared/intersecting edges.
        if(routes.some(other=>other!==route&&contains(other,pos)))continue;
        output.push({...pos,angle:Math.atan2(dy,dx),sign,style,asset,thick,span,phase:s%period/period,period,index});
      }
    }
  }
  return output;
}
export function roadBorderCellPainter(ctx,terrain,tile,routes,images){
  if(!routes?.some(r=>r.border?.enabled))return ()=>{};
  const buckets=new Map(),w=tile.width,h=tile.height;
  for(const stamp of roadBorderSamples(routes)){
    const img=images.get(stamp.asset.id);
    if(!img)continue;
    const reach=Math.max(stamp.thick,stamp.span)+2;
    for(let row=Math.max(0,Math.floor((stamp.y-reach)/h));row<=Math.min(terrain.height-1,Math.floor((stamp.y+reach)/h));row++)
      for(let col=Math.max(0,Math.floor((stamp.x-reach)/w));col<=Math.min(terrain.width-1,Math.floor((stamp.x+reach)/w));col++){
        const key=row*terrain.width+col;
        if(!buckets.has(key))buckets.set(key,[]);
        buckets.get(key).push(stamp);
      }
  }
  return (col,row,level)=>{
    for(const s of buckets.get(row*terrain.width+col)??[]){
      const imgs=images.get(s.asset.id);
      const image=s.asset.kind==='sprites'?imgs[s.index%imgs.length]:imgs[0];
      if(!image?.naturalWidth)continue;
      ctx.save();ctx.translate(s.x,s.y-level*tile.rise);ctx.rotate(s.angle);
      ctx.globalAlpha=s.style.opacity;
      if(s.asset.kind==='sprites')ctx.drawImage(image,-s.thick/2,-s.thick/2,s.thick,s.thick);
      else {
        // Source top is the outside; mirror across the route for its other side.
        ctx.scale(1,-s.sign);
        const sourceWidth=image.naturalWidth,sourceHeight=image.naturalHeight;
        const left=s.phase*sourceWidth,amount=s.span/s.period*sourceWidth;
        const first=Math.min(amount,sourceWidth-left),firstW=s.span*first/amount;
        ctx.drawImage(image,left,0,first,sourceHeight,-s.span/2,-s.thick/2,firstW,s.thick);
        if(first<amount)ctx.drawImage(image,0,0,amount-first,sourceHeight,-s.span/2+firstW,-s.thick/2,s.span-firstW,s.thick);
      }
      ctx.restore();
    }
  };
}
