// Pure geometry shared by the canonical surface model and the Sculpt editor.
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const valid=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=0&&p.y>=0;
export function normalizeRouteKnots(raw){
  if(!Array.isArray(raw)||raw.length<2||raw.length>32)return null;
  const result=[];
  for(const k of raw){
    if(!valid(k)||!valid(k.in)||!valid(k.out))return null;
    result.push(Object.freeze({x:k.x,y:k.y,in:Object.freeze({x:k.in.x,y:k.in.y}),out:Object.freeze({x:k.out.x,y:k.out.y})}));
  }
  return Object.freeze(result);
}
export function routePointsFromKnots(knots){
  const result=[{x:knots[0].x,y:knots[0].y}];
  for(let i=1;i<knots.length;i++){
    const a=knots[i-1],b=knots[i];
    const steps=Math.min(16,Math.max(1,Math.ceil((dist(a,a.out)+dist(a.out,b.in)+dist(b.in,b))/5)));
    for(let j=1;j<=steps;j++){
      const t=j/steps;
      result.push(lerp(lerp(lerp(a,a.out,t),lerp(a.out,b.in,t),t),lerp(lerp(a.out,b.in,t),lerp(b.in,b,t),t),t));
    }
  }
  return result; // <=497 points, below Sculpt's 512-point limit.
}
export function routeKnotsFromPoints(points,bounds=null){
  const clamp=(v,key)=>Math.max(0,Math.min(bounds?bounds[key]-.001:Infinity,v));
  if(points.length<2)return null;
  const step=Math.max(1,Math.ceil((points.length-1)/31));
  const chosen=points.filter((_,i)=>i%step===0||i===points.length-1);
  return normalizeRouteKnots(chosen.map((p,i)=>{
    const a=chosen[Math.max(0,i-1)],b=chosen[Math.min(chosen.length-1,i+1)];
    const dx=(b.x-a.x)/6,dy=(b.y-a.y)/6;
    return {...p,in:{x:clamp(p.x-dx,'width'),y:clamp(p.y-dy,'height')},out:{x:clamp(p.x+dx,'width'),y:clamp(p.y+dy,'height')}};
  }));
}
function circleInterval(a,b,p,r){
  const dx=b.x-a.x,dy=b.y-a.y,ax=a.x-p.x,ay=a.y-p.y;
  const A=dx*dx+dy*dy,B=2*(dx*ax+dy*ay),C=ax*ax+ay*ay-r*r;
  if(A<1e-12)return C<=0?[0,1]:null;
  const D=B*B-4*A*C;
  if(D<0)return null;
  const lo=Math.max(0,(-B-Math.sqrt(D))/(2*A)),hi=Math.min(1,(-B+Math.sqrt(D))/(2*A));
  return lo<hi?[lo,hi]:null;
}
function squareInterval(a,b,p,r){
  let lo=0,hi=1;
  for(const k of ['x','y']){
    const d=b[k]-a[k];
    if(Math.abs(d)<1e-12){if(Math.abs(a[k]-p[k])>r)return null;continue;}
    const q=(p[k]-r-a[k])/d,s=(p[k]+r-a[k])/d;
    lo=Math.max(lo,Math.min(q,s));hi=Math.min(hi,Math.max(q,s));
  }
  return lo<hi?[lo,hi]:null;
}
// Split the centreline, leaving complete cross-sections outside the eraser.
// The feature's radius accounts for the rounded caps of the remaining pieces.
export function eraseSurfaceStrokeParts(feature,brushPoints,width,shape='round'){
  if(!brushPoints.length)return [feature.points];
  const radius=width/2+feature.width/2;
  const square=shape==='square'||feature.brushShape==='square';
  const sampleStep=Math.max(1,Math.min(8,width/4));
  const stamps=[brushPoints[0]];
  for(let i=1;i<brushPoints.length;i++){
    const a=brushPoints[i-1],b=brushPoints[i],n=Math.max(1,Math.ceil(dist(a,b)/sampleStep));
    for(let j=1;j<=n;j++)stamps.push(lerp(a,b,j/n));
  }
  const parts=[];let current=[],changed=false;
  const flush=()=>{if(current.length>=2)parts.push(current);current=[];};
  for(let i=1;i<feature.points.length;i++){
    const a=feature.points[i-1],b=feature.points[i];
    const intervals=stamps.map(p=>(square?squareInterval:circleInterval)(a,b,p,radius)).filter(Boolean).sort((x,y)=>x[0]-y[0]);
    let cursor=0;
    const keep=(lo,hi)=>{
      if(hi-lo<1e-8)return;
      const start=lerp(a,b,lo),end=lerp(a,b,hi);
      if(current.length&&dist(current.at(-1),start)>1e-6)flush();
      if(!current.length)current.push(start);
      current.push(end);
    };
    for(const [lo,hi] of intervals){
      if(hi<=cursor)continue;
      keep(cursor,lo);flush();cursor=Math.max(cursor,hi);changed=true;
    }
    keep(cursor,1);
    if(cursor>=1)flush();
  }
  flush();
  return changed?parts:[feature.points];
}
