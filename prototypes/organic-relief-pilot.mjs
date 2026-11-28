// Isolated C1 visual experiment. No runtime imports, no collision or save writes.
const key=(x,y)=>x+','+y;
const dirs=[[1,0],[0,1],[-1,0],[0,-1]];
const turnRank=[1,0,3,2];
export function contourAt(terrain,level){
  const {width:w,height:h,levels}=terrain;
  const inside=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&levels[y*w+x]>=level;
  const edges=[],heads=new Map();
  function edge(x,y,dir){const a=[x,y],d=dirs[dir],b=[x+d[0],y+d[1]],i=edges.length;
    edges.push({a,b,dir});const k=key(...a);if(!heads.has(k))heads.set(k,[]);heads.get(k).push(i);}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(inside(x,y)){
    if(!inside(x,y-1))edge(x,y,0);
    if(!inside(x+1,y))edge(x+1,y,1);
    if(!inside(x,y+1))edge(x+1,y+1,2);
    if(!inside(x-1,y))edge(x,y+1,3);
  }
  const used=new Set(),loops=[];
  for(let start=0;start<edges.length;start++){
    if(used.has(start))continue;
    let i=start;const loop=[];
    do{const e=edges[i];used.add(i);loop.push(e);
      if(key(...e.b)===key(...edges[start].a))break;
      const next=(heads.get(key(...e.b))??[]).filter(n=>!used.has(n));
      next.sort((a,b)=>turnRank.indexOf((edges[a].dir-e.dir+4)%4)-turnRank.indexOf((edges[b].dir-e.dir+4)%4));
      i=next[0];
      if(i===undefined)throw Error('Open terrain contour');
    }while(!used.has(i));
    const corners=loop.filter((e,n)=>e.dir!==loop[(n+loop.length-1)%loop.length].dir).map(e=>e.a);
    if(corners.length>=4)loops.push(corners);
  }
  return loops;
}
// Chamfer in CELL units, not projected pixels. Half a cell on a one-cell
// staircase joins successive diagonals exactly, including concave turns.
// This keeps each move inside the adjacent half-cell and never warps a texture.
export function chamferLoop(loop,{width=28,height=21,amount=.5}={}){
  const a=Math.max(0,Math.min(.5,Number(amount)||0));
  const p=loop.map(([x,y])=>[x*width,y*height]);
  if(!a)return p;
  const out=p.flatMap((v,i)=>{
    const prev=p[(i+p.length-1)%p.length],next=p[(i+1)%p.length];
    const cut=q=>{const dx=q[0]-v[0],dy=q[1]-v[1];
      const len=Math.hypot(dx/width,dy/height),n=Math.min(len*.5,a);
      return [v[0]+dx/len*n,v[1]+dy/len*n];};
    return [cut(prev),cut(next)];
  });
  const same=(p,q)=>Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])<1e-8;
  const unique=out.filter((v,i)=>!same(v,out[(i+out.length-1)%out.length]));
  // Collapse consecutive collinear segments, but never reverse an edge.
  return unique.filter((v,i)=>{
    const p=unique[(i+unique.length-1)%unique.length],q=unique[(i+1)%unique.length];
    const ax=v[0]-p[0],ay=v[1]-p[1],bx=q[0]-v[0],by=q[1]-v[1];
    return Math.abs(ax*by-ay*bx)>1e-8||ax*bx+ay*by<0;
  });
}
export function reliefPlan(terrain,{width=28,height=21,rise=18,amount=.5}={}){
  const base=Math.min(...terrain.levels),levels=[...new Set(terrain.levels)].sort((a,b)=>a-b);
  return {base,width,height,rise,terraces:levels.slice(1).map((level,i)=>({
    level,lower:levels[i],loops:contourAt(terrain,level).map(l=>chamferLoop(l,{width,height,amount}))
  }))};
}

// Split collinear contours at shared WORLD coordinates, so a long edge at a
// lower threshold matches shorter pieces on a higher threshold. No ghost
// terrace bands caused by unrelated elevations elsewhere in the map.
function splitEdge(a,b){
  const axis=Math.abs(b[0]-a[0])>1e-8?0:1;
  const lo=Math.min(a[axis],b[axis]),hi=Math.max(a[axis],b[axis]),step=7;
  const ts=[0,1];
  for(let v=Math.floor(lo/step)*step+step;v<hi-1e-8;v+=step)
    if(v>lo+1e-8)ts.push((v-a[axis])/(b[axis]-a[axis]));
  ts.sort((a,b)=>a-b);
  return ts.map(t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
}
const pointKey=p=>p.map(n=>Math.round(n*1e5)).join(',');
const edgeKey=(a,b)=>pointKey(a)+'>'+pointKey(b);
export function reliefWallPlan(terrain,options={}){
  const plan=reliefPlan(terrain,options),byEdge=new Map();
  for(const terrace of plan.terraces){
    for(const loop of terrace.loops)for(let i=0;i<loop.length;i++){
      const pts=splitEdge(loop[i],loop[(i+1)%loop.length]);
      for(let j=0;j<pts.length-1;j++){
        const a=pts[j],b=pts[j+1],key=edgeKey(a,b);
        let bands=byEdge.get(key);if(!bands)byEdge.set(key,bands=[]);
        const last=bands.at(-1);
        if(last&&last.upper===terrace.lower)last.upper=terrace.level;
        else bands.push({a,b,lower:terrace.lower,upper:terrace.level});
      }
    }
  }
  return {...plan,edges:[...byEdge.values()].flat()};
}
// Deterministic smooth world-space perturbation. Identical points at any
// elevation move identically, so cliff and cap never part company.
// Less than 3 native pixels; texture sampling stays unchanged.
export function organicPoint([x,y],strength=.7){
  const s=Math.max(0,Math.min(1,Number(strength)||0));
  return [x+s*(1.8*Math.sin(y*.085+x*.042)+.9*Math.sin(x*.23-y*.09)),
    y+s*(2.1*Math.sin(x*.072-y*.037)+.7*Math.sin(y*.21+x*.11))];
}
function pathLoop(ctx,loop,z,strength){
  let first=true;
  for(let i=0;i<loop.length;i++)for(const point of splitEdge(loop[i],loop[(i+1)%loop.length]).slice(0,-1)){
    const [x,y]=organicPoint(point,strength);
    if(first){ctx.moveTo(x,y-z);first=false;}else ctx.lineTo(x,y-z);
  }
  ctx.closePath();
}
function quad(ctx,a,b,top,bottom){ctx.moveTo(a[0],a[1]-top);ctx.lineTo(b[0],b[1]-top);
  ctx.lineTo(b[0],b[1]-bottom);ctx.lineTo(a[0],a[1]-bottom);ctx.closePath();}
// Presentation-only settings: no terrain mutation or saved schema changes.
export const RELIEF_PRESETS=Object.freeze({
  light:Object.freeze({amount:.35,organic:.35,ambient:.45,shadowWidth:10,contrast:.45,rearWidth:2,rearOpacity:.35,lip:1}),
  natural:Object.freeze({amount:.5,organic:.7,ambient:.78,shadowWidth:18,contrast:.75,rearWidth:4,rearOpacity:.65,lip:1}),
  marked:Object.freeze({amount:.5,organic:.9,ambient:1,shadowWidth:26,contrast:1,rearWidth:7,rearOpacity:.9,lip:2})
});
export function normalizeReliefSettings(input={}){
  const clamp=(key,max)=>{const n=Number(input[key]??RELIEF_PRESETS.natural[key]);return Number.isFinite(n)?Math.max(0,Math.min(max,n)):RELIEF_PRESETS.natural[key];};
  return Object.freeze({amount:clamp('amount',.5),organic:clamp('organic',1),
    ambient:clamp('ambient',1),shadowWidth:clamp('shadowWidth',32),
    contrast:clamp('contrast',1),rearWidth:clamp('rearWidth',10),
    rearOpacity:clamp('rearOpacity',1),lip:clamp('lip',4)});
}
export function drawOrganicPilot(ctx,terrain,{surface,rock,...options}={}){
  const {amount,ambient,lip,organic,shadowWidth,contrast,rearWidth,rearOpacity}=normalizeReliefSettings(options);
  const p=reliefWallPlan(terrain,{amount});const {width:w,height:h,rise}=p;
  const ground=ctx.createPattern(surface,'repeat'),wall=ctx.createPattern(rock,'repeat');
  if(!ground||!wall)throw Error('Canonical textures unavailable');
  if(ground.setTransform&&typeof DOMMatrix!=='undefined')ground.setTransform(new DOMMatrix().scale(.55));
  const strength=amount>0?organic:0;
  const shade=Math.max(0,Math.min(1,ambient));
  const extent=[-4,-16*rise-4,terrain.width*w+8,terrain.height*h+16*rise+8];
  const edges=p.edges.map(e=>({...e,front:e.b[0]<e.a[0]-1e-8,
    a:organicPoint(e.a,strength),b:organicPoint(e.b,strength)}));
  ctx.save();ctx.fillStyle=ground;ctx.fillRect(0,-p.base*rise,terrain.width*w,terrain.height*h+p.base*rise);
  for(const t of p.terraces){
    const top=t.level*rise,active=edges.filter(e=>e.upper===t.level);
    const front=active.filter(e=>e.front);
    // Contact shadow follows the ACTUAL local wall foot. No intermediate
    // border or shadow when one wall spans several elevation thresholds.
    for(const [factor,opacity] of [[1,.16],[.68,.24],[.34,.37]]){
      if(shadowWidth<=0||shade<=0)continue;
      const width=shadowWidth*factor;
      ctx.save();ctx.globalAlpha=shade*opacity;
      ctx.strokeStyle='#192125';ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      for(const e of front){const z=e.lower*rise;ctx.moveTo(e.a[0],e.a[1]-z+2);ctx.lineTo(e.b[0],e.b[1]-z+2);}
      ctx.stroke();ctx.restore();
    }
    // One opaque texture pass for the whole visible face union: no internal
    // rock texture borders, no semi-transparent seams between segments.
    ctx.beginPath();for(const e of front)quad(ctx,e.a,e.b,top,e.lower*rise);
    ctx.fillStyle=wall;ctx.fill();
    // Shade by normalized height within the full local cliff, not by
    // global Y or intermediate terrace. The gradient follows the edge.
    for(const e of front){
      const a=e.a,b=e.b,d=(e.upper-e.lower)*rise;
      if(d<=0)continue;
      const dx=b[0]-a[0],dy=b[1]-a[1];
      if(Math.abs(dx)<1e-5)continue;
      const slope=dy/dx,den=1+slope*slope;
      const ax=(a[0]+b[0])/2,ay=(a[1]+b[1])/2-top;
      const g=ctx.createLinearGradient(ax,ay,ax-slope*d/den,ay+d/den);
      g.addColorStop(0,'rgba(226,232,226,'+(.32*contrast)+')');
      g.addColorStop(.25,'rgba(226,232,226,'+(.10*contrast)+')');
      g.addColorStop(.60,'rgba(26,32,35,'+(.17*contrast)+')');
      g.addColorStop(1,'rgba(20,26,30,'+(.62*contrast)+')');
      ctx.beginPath();quad(ctx,a,b,top,e.lower*rise);ctx.fillStyle=g;ctx.fill();
    }
    // Same silhouette and same unwarped surface pattern as the wall.
    ctx.beginPath();for(const loop of t.loops)pathLoop(ctx,loop,top,strength);
    ctx.fillStyle=ground;ctx.fill('evenodd');
    // Altitude cue is subtle and continuous, not a per-tile tint.
    ctx.save();ctx.clip('evenodd');
    ctx.fillStyle='rgba(255,255,255,'+Math.min(.13,(t.level-p.base)*.015)+')';
    ctx.fillRect(...extent);
    // A restrained neutral rear-edge shadow restores the plateau silhouette.
    // It stays INSIDE the upper surface; never paint a brown stripe on rock.
    ctx.beginPath();for(const e of active.filter(e=>!e.front)){
      ctx.moveTo(e.a[0],e.a[1]-top);ctx.lineTo(e.b[0],e.b[1]-top);
    }
    if(rearWidth>0&&rearOpacity>0){
      // The path is clipped to the plateau, so a 2x stroke exposes exactly
      // the requested width inward and never paints a stripe on the wall.
      ctx.lineWidth=rearWidth*2;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle='rgba(20,28,34,'+rearOpacity+')';ctx.stroke();
    }
    ctx.restore();
    // Front crest is the terrain material itself, with no dark outline.
    if(lip>0){ctx.save();ctx.strokeStyle=ground;ctx.lineWidth=Math.min(4,lip);
      ctx.lineCap='round';ctx.beginPath();for(const e of front){ctx.moveTo(e.a[0],e.a[1]-top);ctx.lineTo(e.b[0],e.b[1]-top);}ctx.stroke();ctx.restore();}
  }
  ctx.restore();return p;
}
