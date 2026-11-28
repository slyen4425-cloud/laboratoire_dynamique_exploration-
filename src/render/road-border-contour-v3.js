// Visual-only boundary of the canonical WorldSurface swept brush.
// Marching squares traces the union, not independently offset polylines.
// All coordinates are world units; no saved geometry or gameplay mutation.
const BLOCK=32,EPS=1e-8;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const key=(x,y)=>x+','+y;
const blockKey=(x,y)=>key(Math.floor(x/BLOCK),Math.floor(y/BLOCK));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const norm=(x,y)=>{const d=Math.hypot(x,y);return d>EPS?{x:x/d,y:y/d}:null;};
function project(p,s,square=false){
  const ax=p.x-s.a.x,ay=p.y-s.a.y,dx=s.b.x-s.a.x,dy=s.b.y-s.a.y;
  if(!square){
    const t=clamp((ax*dx+ay*dy)/(s.span*s.span),0,1);
    return {t,d:Math.hypot(ax-t*dx,ay-t*dy)};
  }
  // Exact L-infinity distance to a segment: the maximum of two absolute
  // affine functions is convex; its minimum lies at one of these breakpoints.
  // This is the metric of the existing swept axis-aligned square brush.
  let t=0,d=Math.max(Math.abs(ax),Math.abs(ay));
  for(const q of [1,dx?ax/dx:0,dy?ay/dy:0,dx!==dy?(ax-ay)/(dx-dy):0,dx!==-dy?(ax+ay)/(dx+dy):0]){
    const u=clamp(q,0,1),v=Math.max(Math.abs(ax-u*dx),Math.abs(ay-u*dy));
    if(v<d){d=v;t=u;}
  }
  return {t,d};
}
function segmentsOf(points){
  const out=[];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],span=distance(a,b);
    if(span>EPS)out.push({a,b,span,dx:(b.x-a.x)/span,dy:(b.y-a.y)/span});
  }
  const closed=out.length>2&&distance(out[0].a,out.at(-1).b)<EPS;
  out.forEach((s,i)=>{s.index=i;s.first=!closed&&i===0;s.last=!closed&&i===out.length-1;});
  return out;
}
function indexSegments(segments,reach){
  const blocks=new Map();
  for(const s of segments){
    for(let y=Math.floor((Math.min(s.a.y,s.b.y)-reach)/BLOCK);y<=Math.floor((Math.max(s.a.y,s.b.y)+reach)/BLOCK);y++)
      for(let x=Math.floor((Math.min(s.a.x,s.b.x)-reach)/BLOCK);x<=Math.floor((Math.max(s.a.x,s.b.x)+reach)/BLOCK);x++){
        if(project({x:(x+.5)*BLOCK,y:(y+.5)*BLOCK},s).d>reach+Math.SQRT2*BLOCK/2)continue;
        const k=key(x,y);if(!blocks.has(k))blocks.set(k,[]);blocks.get(k).push(s);
      }
  }
  return blocks;
}
function nearest(p,segments,square=false){
  let best=null;
  for(const s of segments??[]){
    const q=project(p,s,square);
    if(!best||q.d<best.d-EPS)best={...q,s};
  }
  return best;
}
function classify(p,hit,segments){
  if(!hit)return {side:0,cap:true};
  const {s,t}=hit,x=s.a.x+(s.b.x-s.a.x)*t,y=s.a.y+(s.b.y-s.a.y)*t;
  const rx=p.x-x,ry=p.y-y;
  let dx=s.dx,dy=s.dy;
  if(t<EPS&&!s.first){const prev=segments[(s.index+segments.length-1)%segments.length],n=norm(dx+prev.dx,dy+prev.dy);if(n){dx=n.x;dy=n.y;}}
  if(t>1-EPS&&!s.last){const next=segments[(s.index+1)%segments.length],n=norm(dx+next.dx,dy+next.dy);if(n){dx=n.x;dy=n.y;}}
  const cap=(s.first&&t<EPS&&rx*s.dx+ry*s.dy<-.05)||(s.last&&t>1-EPS&&rx*s.dx+ry*s.dy>.05);
  return {side:dx*ry-dy*rx>=0?1:-1,cap};
}
function trace(entry){
  const {segments,square,radius}=entry;
  // One world-unit grid for small brushes, two for regular ones; the edge
  // crossing is linearly interpolated from the actual signed brush metric.
  const step=radius<12?1:2;
  const nodes=new Map(),edges=[],seen=new Set();
  const value=(x,y)=>{
    const hit=nearest({x,y},entry.strokeIndex.get(blockKey(x,y)),square);
    return hit?hit.d-radius:radius+BLOCK;
  };
  const node=(p)=>{const k=p.x.toFixed(6)+','+p.y.toFixed(6);if(!nodes.has(k))nodes.set(k,{p,edges:[]});return nodes.get(k);};
  const add=(a,b)=>{
    if(distance(a,b)<EPS)return;
    const u=node(a),v=node(b),k=[a.x.toFixed(6)+','+a.y.toFixed(6),b.x.toFixed(6)+','+b.y.toFixed(6)].sort().join('|');
    if(seen.has(k))return;seen.add(k);
    const e={u,v,used:false};edges.push(e);u.edges.push(e);v.edges.push(e);
  };
  for(const [k,local] of entry.strokeIndex){
    const [bx,by]=k.split(',').map(Number),x0=bx*BLOCK,y0=by*BLOCK;
    // Skip entire blocks far from the boundary (including wide-road interiors).
    const center={x:x0+BLOCK/2,y:y0+BLOCK/2},hit=nearest(center,local,square);
    if(!hit||Math.abs(hit.d-radius)>Math.SQRT2*BLOCK/2+step*2)continue;
    const size=BLOCK/step+1,grid=new Float64Array(size*size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)grid[y*size+x]=value(x0+x*step,y0+y*step);
    for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){
      const ps=[{x:x0+x*step,y:y0+y*step},{x:x0+(x+1)*step,y:y0+y*step},{x:x0+(x+1)*step,y:y0+(y+1)*step},{x:x0+x*step,y:y0+(y+1)*step}];
      const vs=[grid[y*size+x],grid[y*size+x+1],grid[(y+1)*size+x+1],grid[(y+1)*size+x]],crossings=[];
      for(let i=0;i<4;i++){
        const j=(i+1)%4;if((vs[i]<=0)===(vs[j]<=0))continue;
        const t=vs[i]/(vs[i]-vs[j]);crossings.push({edge:i,p:{x:ps[i].x+(ps[j].x-ps[i].x)*t,y:ps[i].y+(ps[j].y-ps[i].y)*t}});
      }
      if(crossings.length===2)add(crossings[0].p,crossings[1].p);
      else if(crossings.length===4){
        const centerInside=value(ps[0].x+step/2,ps[0].y+step/2)<=0;
        if(centerInside===(vs[0]<=0)){add(crossings[0].p,crossings[1].p);add(crossings[2].p,crossings[3].p);}
        else {add(crossings[0].p,crossings[3].p);add(crossings[1].p,crossings[2].p);}
      }
    }
  }
  const result=[];
  for(const edge of edges){
    if(edge.used)continue;
    let curr=edge.u.edges.length===1?edge.u:edge.v.edges.length===1?edge.v:edge.u;
    const startNode=curr,startIndex=result.length;
    let next=edge,station=0,previous=null;
    while(next){
      next.used=true;const other=next.u===curr?next.v:next.u,a=curr.p,b=other.p,span=distance(a,b);
      if(span>EPS){
        const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        const hit=nearest(mid,entry.strokeIndex.get(blockKey(mid.x,mid.y)),square);
        const {side,cap}=classify(mid,hit,segments);
        result.push({a,b,span,start:station,dx:(b.x-a.x)/span,dy:(b.y-a.y)/span,side,cap});
        station+=span;previous={dx:(b.x-a.x)/span,dy:(b.y-a.y)/span};
      }
      curr=other;const choices=curr.edges.filter(e=>!e.used);
      if(choices.length>1&&previous)choices.sort((e,f)=>{
        const score=v=>{const q=(v.u===curr?v.v:v.u).p,n=norm(q.x-curr.p.x,q.y-curr.p.y);return n?n.x*previous.dx+n.y*previous.dy:-2;};
        return score(f)-score(e);
      });
      next=choices[0];
    }
    if(curr===startNode&&station>EPS)for(let i=startIndex;i<result.length;i++)result[i].loopLength=station;
  }
  return result;
}
export function roadBorderInwardShift(radius,thick){return Math.min(3,thick*.12,radius*.15);}
export function buildRoadBorderField(routes,assets){
  const entries=[],blocks=new Map();
  for(const route of routes){
    const segments=segmentsOf(route.points);if(!segments.length)continue;
    const radius=route.width/2,square=route.brushShape==='square';
    const styles={};
    if(route.border?.enabled)for(const [name,side] of [['left',-1],['right',1]]){
      const style=route.border[name],asset=assets.find(a=>a.id===style?.assetId);
      if(asset&&style.opacity>0)styles[side]={style,asset,thick:style.width*style.scale};
    }
    const reach=Math.max(4,...Object.values(styles).map(v=>Math.abs(v.style.offset)+v.thick+6));
    const strokeIndex=indexSegments(segments,radius*(square?Math.SQRT2:1)+reach);
    const entry={route,segments,radius,square,styles,strokeIndex,guides:[],guideIndex:null,reach};
    if(Object.keys(styles).length){entry.guides=trace(entry);entry.guideIndex=indexSegments(entry.guides,reach);}
    entries.push(entry);
    // All route interiors, including unstyled routes, suppress crossings.
    for(const k of strokeIndex.keys()){if(!blocks.has(k))blocks.set(k,[]);blocks.get(k).push(entry);}
  }
  return {entries,blocks,blockSize:BLOCK};
}
export function roadBorderMappingAt(field,x,y,sourceProfiles){
  const p={x,y},k=blockKey(x,y),entries=field.blocks.get(k)??[],result=[];
  if(!entries.some(e=>e.guideIndex?.has(k)))return result;
  const nearby=entries.map(e=>({e,hit:nearest(p,e.strokeIndex.get(k),e.square)}));
  for(const {e,hit} of nearby){
    if(!hit||!e.guideIndex?.has(k)||Math.abs(hit.d-e.radius)>e.reach+2)continue;
    if(nearby.some(o=>o.e!==e&&o.hit&&o.hit.d<o.e.radius-.01))continue;
    const guide=nearest(p,e.guideIndex.get(k));if(!guide||guide.s.cap)continue;
    const selected=e.styles[guide.s.side];if(!selected||selected.asset.kind!=='band')continue;
    const {style,asset,thick}=selected,profile=sourceProfiles(asset.id);
    const signed=(hit.d<e.radius?-1:1)*guide.d;
    const center=style.offset-roadBorderInwardShift(e.radius,thick);
    // The source relief faces the camera (+world Y). The front/south
    // horizontal edge must not be upside down. Use physical orientation,
    // independent of drawing direction or left/right style selection.
    const south=guide.s.side*hit.s.dx;
    const t=clamp((south-.5)/.4,0,1),flip=t*t*(3-2*t);
    const delta=(signed-center)/thick;
    const originalV=profile.anchor-delta,mirroredV=profile.anchor+delta;
    // Preserve the anchor and the exact V3 contour. Fade two actual
    // samples on diagonals, never interpolate UVs through a collapsed strip.
    const v=flip===1?mirroredV:originalV;
    const alternateV=flip>0&&flip<1?mirroredV:null;
    if((v<0||v>1)&&(alternateV===null||alternateV<0||alternateV>1))continue;
    const nominal=Math.max(1,thick*4),loop=guide.s.loopLength;
    // A closed contour repeats an integral number of tiles, so its seam is
    // continuous regardless of which marching-square edge was visited first.
    const period=loop?loop/Math.max(1,Math.round(loop/nominal)):nominal;
    const u=((guide.s.start+guide.t*guide.s.span)%period)/period;
    result.push({asset,style,u,v,alternateV,flip,signed,center,thick,side:guide.s.side,route:e.route,profile});
  }
  return result;
}
export function roadBorderFieldHasCell(field,x,y,w,h){
  for(let by=Math.floor(y/BLOCK);by<=Math.floor((y+h)/BLOCK);by++)
    for(let bx=Math.floor(x/BLOCK);bx<=Math.floor((x+w)/BLOCK);bx++){
      const k=key(bx,by);
      if(field.blocks.get(k)?.some(e=>e.guideIndex?.has(k)))return true;
    }
  return false;
}
export function roadBorderSpriteSamples(field){
  const output=[];
  for(const e of field.entries){
    for(const side of [-1,1]){
      const s=e.styles[side];if(s?.asset.kind!=='sprites')continue;
      const spacing=Math.max(1,s.thick+s.style.spacing);
      for(const g of e.guides){
        if(g.cap||g.side!==side)continue;
        let station=(Math.floor(g.start/spacing)+.5)*spacing;
        if(station<g.start)station+=spacing;
        for(;station<g.start+g.span-EPS;station+=spacing){
          const t=(station-g.start)/g.span,p={x:g.a.x+(g.b.x-g.a.x)*t,y:g.a.y+(g.b.y-g.a.y)*t};
          const k=blockKey(p.x,p.y),hit=nearest(p,e.strokeIndex.get(k),e.square);if(!hit)continue;
          const q={x:hit.s.a.x+(hit.s.b.x-hit.s.a.x)*hit.t,y:hit.s.a.y+(hit.s.b.y-hit.s.a.y)*hit.t};
          const n=norm(p.x-q.x,p.y-q.y);if(!n)continue;
          const offset=s.style.offset-roadBorderInwardShift(e.radius,s.thick),x=p.x+n.x*offset,y=p.y+n.y*offset;
          const others=field.blocks.get(blockKey(x,y))??[];
          if(others.some(o=>o!==e&&(nearest({x,y},o.strokeIndex.get(blockKey(x,y)),o.square)?.d??Infinity)<o.radius))continue;
          output.push({x,y,angle:Math.atan2(g.dy,g.dx),...s,index:Math.floor(station/spacing)});
        }
      }
    }
  }
  return output;
}
