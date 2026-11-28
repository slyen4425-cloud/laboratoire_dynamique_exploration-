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
function pathLoop(ctx,loop,z){ctx.moveTo(loop[0][0],loop[0][1]-z);
  for(const [x,y] of loop.slice(1))ctx.lineTo(x,y-z);ctx.closePath();}
function quad(ctx,a,b,top,bottom){ctx.moveTo(a[0],a[1]-top);ctx.lineTo(b[0],b[1]-top);
  ctx.lineTo(b[0],b[1]-bottom);ctx.lineTo(a[0],a[1]-bottom);ctx.closePath();}
export function drawOrganicPilot(ctx,terrain,{surface,rock,amount=.5,ambient=.35,lip=2}={}){
  const p=reliefPlan(terrain,{amount});const {width:w,height:h,rise}=p;
  const ground=ctx.createPattern(surface,'repeat'),wall=ctx.createPattern(rock,'repeat');
  if(!ground||!wall)throw Error('Canonical textures unavailable');
  if(ground.setTransform&&typeof DOMMatrix!=='undefined')ground.setTransform(new DOMMatrix().scale(.55));
  ctx.save();ctx.fillStyle=ground;ctx.fillRect(0,-p.base*rise,terrain.width*w,terrain.height*h+p.base*rise);
  for(const [index,t] of p.terraces.entries()){
    const top=t.level*rise,bottom=t.lower*rise,segments=[];
    const upper=p.terraces[index+1];
    const covered=(a,b)=>upper?.loops.some(loop=>loop.some((u,i)=>{
      const v=loop[(i+1)%loop.length],dx=v[0]-u[0],dy=v[1]-u[1],len=dx*dx+dy*dy;
      if(!len)return false;
      return [a,b].every(q=>{const x=q[0]-u[0],y=q[1]-u[1],dot=x*dx+y*dy;
        return Math.abs(x*dy-y*dx)<1e-7&&dot>=-1e-7&&dot<=len+1e-7;});
    }))??false;
    for(const loop of t.loops)for(let i=0;i<loop.length;i++){
      const a=loop[i],b=loop[(i+1)%loop.length];if(b[0]<a[0]-1e-8)segments.push([a,b]);
    }
    // Draw contact shadow only below the forward-facing wall; one continuous
    // polygon pass, never a tile-by-tile texture stretch.
    ctx.save();ctx.globalAlpha=ambient*.55;ctx.strokeStyle='#171c16';ctx.lineWidth=6;
    ctx.lineJoin='round';ctx.beginPath();
    for(const [a,b] of segments){ctx.moveTo(a[0],a[1]-bottom+2);ctx.lineTo(b[0],b[1]-bottom+2);}ctx.stroke();ctx.restore();
    ctx.beginPath();for(const [a,b] of segments)quad(ctx,a,b,top,bottom);
    ctx.fillStyle=wall;ctx.fill();
    ctx.save();ctx.clip();ctx.fillStyle='rgba(16,18,15,.18)';
    ctx.fillRect(0,-16*rise,terrain.width*w,terrain.height*h+16*rise);ctx.restore();
    // Plateau and wall use the SAME contour. Texture coordinates are global.
    ctx.beginPath();for(const loop of t.loops)pathLoop(ctx,loop,top);
    ctx.fillStyle=ground;ctx.fill('evenodd');
    if(lip>0){ctx.save();ctx.strokeStyle=ground;ctx.lineWidth=lip;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      for(const loop of t.loops)for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length];if(!covered(a,b)){ctx.moveTo(a[0],a[1]-top);ctx.lineTo(b[0],b[1]-top);}}ctx.stroke();ctx.restore();}
  }
  ctx.restore();return p;
}
