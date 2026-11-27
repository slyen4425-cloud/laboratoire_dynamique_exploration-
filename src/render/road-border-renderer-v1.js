import {squareSurfaceStrokeContainsPoint} from '../world/surface-brush-geometry.js';
const bandNames={naturelle:'Terre et herbe',cailloux:'Cailloux en bande',pierre_taillee:'Pierre taillée',beton:'Béton',bois:'Bois',neige:'Neige'};
const root='./assets/exploration/materials/road-borders/';
export const ROAD_BORDER_ASSETS=Object.freeze([
  ...Object.entries(bandNames).map(([key,label])=>Object.freeze({id:'road-border.bordure_'+key,label,kind:'band',path:root+'bandes/bordure_'+key+'.webp'})),
  Object.freeze({id:'road-border.cailloux',label:'Cailloux individuels (8 variantes)',kind:'sprites',paths:Object.freeze(Array.from({length:8},(_,i)=>root+'sprites_cailloux/caillou_'+String(i+1).padStart(2,'0')+'.webp'))})
]);
// Border geometry is derived from the actual swept WorldSurface, not a new road.
const TAU=2*Math.PI,EPS=1e-7;
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const mul=(a,s)=>({x:a.x*s,y:a.y*s});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const length=a=>Math.hypot(a.x,a.y);
const unit=a=>{const d=length(a);return d>EPS?mul(a,1/d):null;};
const normal=(v,sign)=>({x:-v.y*sign,y:v.x*sign});
const distance=(p,a,b)=>{
  const v=sub(b,a),l=dot(v,v),t=l?Math.max(0,Math.min(1,dot(sub(p,a),v)/l)):0;
  return length(sub(sub(p,a),mul(v,t)));
};
function contains(route,p,inset=.01){
  const radius=Math.max(0,route.width/2-inset);
  if(route.brushShape==='square')return squareSurfaceStrokeContainsPoint(route.points,p.x,p.y,radius);
  return route.points.some((b,i)=>i&&distance(p,route.points[i-1],b)<radius);
}
const support=(n,r,square)=>r*(square?Math.abs(n.x)+Math.abs(n.y):1);
const distinct=points=>points.filter((p,i)=>!i||length(sub(p,points[i-1]))>EPS);
function pushUnique(list,p){if(!list.length||length(sub(p,list.at(-1)))>EPS)list.push(p);}
function intersection(p,d,q,e){
  const k=cross(d,e);if(Math.abs(k)<EPS)return null;
  return add(p,mul(d,cross(sub(q,p),e)/k));
}
// Offset sides: outer turns arc around the original vertex, inner turns meet
// at the offset-line intersection. Every joint has a shared geometric vertex.
export function roadSideContour(route,sign){
  const points=distinct(route.points),r=route.width/2,square=route.brushShape==='square';
  if(points.length<2)return [];
  const directions=points.slice(1).map((p,i)=>unit(sub(p,points[i])));
  const normals=directions.map(d=>normal(d,sign));
  const offset=(p,n)=>add(p,mul(n,support(n,r,square)));
  const out=[offset(points[0],normals[0])];
  for(let i=1;i<points.length-1;i++){
    const p=points[i],d=directions[i-1],e=directions[i],n=normals[i-1],m=normals[i];
    const turn=Math.atan2(cross(d,e),dot(d,e)),a=offset(p,n),b=offset(p,m);
    if(Math.abs(turn)<1e-5){pushUnique(out,a);continue;}
    if(turn*sign<0&&!square){
      const angle=Math.atan2(n.y,n.x),count=Math.max(1,Math.ceil(Math.abs(turn)/Math.min(Math.PI/24,Math.max(.025,2*Math.acos(Math.max(-1,1-.18/Math.max(r,.18)))))));
      for(let j=0;j<=count;j++){const t=angle+turn*j/count;pushUnique(out,add(p,{x:r*Math.cos(t),y:r*Math.sin(t)}));}
    }else{
      const meet=intersection(a,d,b,e);
      if(meet&&length(sub(meet,p))<=Math.max(r*3,r+1)&&Math.abs(turn)<Math.PI-.01)pushUnique(out,meet);
      else {pushUnique(out,a);pushUnique(out,b);}
    }
  }
  pushUnique(out,offset(points.at(-1),normals.at(-1)));return out;
}
function contourSegments(points,sign){
  const ps=distinct(points),dirs=ps.slice(1).map((p,i)=>unit(sub(p,ps[i])));
  const normals=dirs.map(d=>normal(d,sign));
  const joins=ps.map((p,i)=>{
    if(i===0)return normals[0];
    if(i===ps.length-1)return normals.at(-1);
    const n=unit(add(normals[i-1],normals[i]));
    return n?mul(n,Math.min(2,1/Math.max(.5,dot(n,normals[i])))):normals[i];
  });
  let total=0;
  const segments=dirs.map((d,i)=>{
    const a=ps[i],b=ps[i+1],span=length(sub(b,a)),start=total;total+=span;
    return {a,b,d,span,start,end:total,n0:joins[i],n1:joins[i+1],n: normals[i]};
  });
  return {segments,total};
}
function at(seg,t){
  const p=add(seg.a,mul(sub(seg.b,seg.a),t)),n=add(mul(seg.n0,1-t),mul(seg.n1,t));
  return {p,n};
}
const cache=new WeakMap();
// Texture phase is measured on the BORDER arc length. The outer side is
// longer and receives more repetitions instead of stretching the same stamps.
export function roadBorderSamples(routes){
  if(Object.isFrozen(routes)&&cache.has(routes))return cache.get(routes);
  const output=[];
  for(const route of routes){
    if(!route.border?.enabled)continue;
    for(const [key,sign] of [['left',-1],['right',1]]){
      const style=route.border[key];if(!style||style.opacity<=0)continue;
      const asset=ROAD_BORDER_ASSETS.find(x=>x.id===style.assetId);if(!asset)continue;
      const thick=style.width*style.scale,period=Math.max(1,thick*4);
      const {segments,total}=contourSegments(roadSideContour(route,sign),sign);
      if(total<EPS)continue;
      const visible=p=>!contains(route,p,.8)&&!routes.some(other=>other!==route&&contains(other,p));
      if(asset.kind==='sprites'){
        const spacing=Math.max(1,thick+style.spacing);let i=0,si=0;
        for(let s=spacing/2;s<total;s+=spacing,i++){
          while(si<segments.length-1&&segments[si].end<s)si++;
          const seg=segments[si],v=at(seg,(s-seg.start)/seg.span);
          if(!visible(v.p))continue;
          const pos=add(v.p,mul(v.n,style.offset));
          output.push({...pos,angle:Math.atan2(seg.d.y,seg.d.x),sign,style,asset,thick,span:thick,phase:0,period,index:i});
        }
        continue;
      }
      let index=0;
      for(const seg of segments){
        // Small subdivisions are only for union clipping. Adjacent quads
        // share endpoints and UV coordinates, with no cropped source strips.
        for(let s=0;s<seg.span-EPS;){
          const span=Math.min(6,seg.span-s),v0=at(seg,s/seg.span),v1=at(seg,(s+span)/seg.span),mid=at(seg,(s+span/2)/seg.span);
          const phase=((seg.start+s)%period)/period;s+=span;
          if(!visible(mid.p))continue;
          const a=add(v0.p,mul(v0.n,style.offset)),b=add(v1.p,mul(v1.n,style.offset)),pos=mul(add(a,b),.5);
          const q=[add(a,mul(v0.n,thick/2)),add(b,mul(v1.n,thick/2)),add(b,mul(v1.n,-thick/2)),add(a,mul(v0.n,-thick/2))];
          output.push({...pos,a,b,q,n:seg.n,angle:Math.atan2(seg.d.y,seg.d.x),sign,style,asset,thick,span,phase,period,index:index++});
        }
      }
    }
  }
  if(Object.isFrozen(routes))cache.set(routes,output);
  return output;
}
// Apply the entire repeating texture in the local strip coordinate system.
// Only the continuous strip outline clips it. The small longitudinal overlap
// closes subpixel raster seams without extending the outside silhouette.
function drawBand(ctx,image,s){
  const v=sub(s.b,s.a),d=unit(v);if(!d)return;
  const q=s.q.map((p,i)=>add(p,mul(d,i===0||i===3?-.35:.35)));
  ctx.beginPath();ctx.moveTo(q[0].x,q[0].y);
  for(let i=1;i<q.length;i++)ctx.lineTo(q[i].x,q[i].y);ctx.closePath();ctx.clip();
  const inward=mul(s.n,-1);
  ctx.transform(d.x,d.y,inward.x,inward.y,s.a.x,s.a.y);
  const projected=q.map(p=>dot(sub(p,s.a),inward));
  const min=Math.min(...projected),max=Math.max(...projected);
  const start=-s.phase*s.period;
  const first=Math.floor((-.5-start)/s.period),last=Math.floor((length(v)+.5-start)/s.period);
  for(let i=first;i<=last;i++)ctx.drawImage(image,start+i*s.period,min,s.period,max-min);
}
export function roadBorderCellPainter(ctx,terrain,tile,routes,images){
  if(!routes?.some(r=>r.border?.enabled))return null;
  const buckets=new Map(),w=tile.width,h=tile.height;
  for(const stamp of roadBorderSamples(routes)){
    if(!images.has(stamp.asset.id))continue;
    const bounds=stamp.q??[{x:stamp.x-stamp.thick,y:stamp.y-stamp.thick},{x:stamp.x+stamp.thick,y:stamp.y+stamp.thick}];
    const xs=bounds.map(p=>p.x),ys=bounds.map(p=>p.y);
    for(let row=Math.max(0,Math.floor((Math.min(...ys)-1)/h));row<=Math.min(terrain.height-1,Math.floor((Math.max(...ys)+1)/h));row++)
      for(let col=Math.max(0,Math.floor((Math.min(...xs)-1)/w));col<=Math.min(terrain.width-1,Math.floor((Math.max(...xs)+1)/w));col++){
        const key=row*terrain.width+col;
        if(!buckets.has(key))buckets.set(key,[]);
        buckets.get(key).push(stamp);
      }
  }
  if(!buckets.size)return null;
  const paint=(col,row,level)=>{
    for(const s of buckets.get(row*terrain.width+col)??[]){
      const imgs=images.get(s.asset.id),image=s.asset.kind==='sprites'?imgs[s.index%imgs.length]:imgs[0];
      if(!image?.naturalWidth)continue;
      ctx.save();ctx.translate(0,-level*tile.rise);ctx.globalAlpha=s.style.opacity;
      if(s.asset.kind==='sprites'){
        ctx.translate(s.x,s.y);ctx.rotate(s.angle);ctx.drawImage(image,-s.thick/2,-s.thick/2,s.thick,s.thick);
      }else drawBand(ctx,image,s);
      ctx.restore();
    }
  };
  paint.hasCell=(col,row)=>buckets.has(row*terrain.width+col);
  return paint;
}
