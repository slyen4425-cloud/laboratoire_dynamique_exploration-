// V61 — Whole-hill visual silhouette, never a second heightmap/collision system.
// Height Model still owns levels, waterLevels and opt-in roundness. One touched
// plateau cell activates its entire same-level dry component's *grass outline*.
import {sculptWaterAt} from '../world/sculpt-height-model.js';

const terrainCache=new WeakMap(),pathCache=new WeakMap();
const DIRS=Object.freeze([[1,0],[0,1],[-1,0],[0,-1]]);
const key=(x,y)=>x+','+y;
function contourLoops(cells){
  const present=new Set(cells.map(p=>key(p.x,p.y)));
  const edges=[];
  for(const {x,y} of cells){
    if(!present.has(key(x,y-1)))edges.push({a:[x,y],b:[x+1,y],dir:0});
    if(!present.has(key(x+1,y)))edges.push({a:[x+1,y],b:[x+1,y+1],dir:1});
    if(!present.has(key(x,y+1)))edges.push({a:[x+1,y+1],b:[x,y+1],dir:2});
    if(!present.has(key(x-1,y)))edges.push({a:[x,y+1],b:[x,y],dir:3});
  }
  const heads=new Map();
  for(let i=0;i<edges.length;i++){
    const k=key(...edges[i].a);
    if(!heads.has(k))heads.set(k,[]);
    heads.get(k).push(i);
  }
  const taken=new Set(),loops=[];
  for(let first=0;first<edges.length;first++){
    if(taken.has(first))continue;
    let current=first;
    const starts=[],dirs=[];
    for(let steps=0;steps<=edges.length;steps++){
      if(taken.has(current))break;
      const edge=edges[current];
      taken.add(current);
      starts.push(edge.a);dirs.push(edge.dir);
      const choices=(heads.get(key(...edge.b))??[]).filter(i=>!taken.has(i));
      if(!choices.length)break;
      // At a diagonal corner contact take the sharpest right turn so
      // separate contour loops never fuse through a single point.
      choices.sort((i,j)=>{
        const turn=x=>(edges[x].dir-edge.dir+4)%4;
        const priority=t=>t===1?0:t===0?1:t===3?2:3;
        return priority(turn(i))-priority(turn(j));
      });
      current=choices[0];
    }
    if(starts.length<4)continue;
    // Remove straight intermediate tile vertices: large hills then acquire
    // true multi-cell rounded corners, unlike the tiny per-cell V54 arcs.
    const turns=[];
    for(let i=0;i<starts.length;i++){
      if(dirs[(i+starts.length-1)%starts.length]!==dirs[i])
        turns.push(Object.freeze({x:starts[i][0],y:starts[i][1],
          from:dirs[(i+starts.length-1)%starts.length],to:dirs[i]}));
    }
    if(turns.length>=4)loops.push(Object.freeze(turns));
  }
  return Object.freeze(loops);
}
export function sculptRoundedHillRegions(terrain){
  if(!terrain||!Array.isArray(terrain.levels)||!Array.isArray(terrain.roundness))
    return new Map();
  if(terrainCache.has(terrain))return terrainCache.get(terrain);
  const W=terrain.width,H=terrain.height,n=W*H,visited=new Uint8Array(n);
  const assigned=new Map();
  for(let seed=0;seed<n;seed++){
    if(visited[seed])continue;
    visited[seed]=1;
    const x=seed%W,y=Math.floor(seed/W),level=terrain.levels[seed];
    if(level<=0||sculptWaterAt(terrain,x,y)>0)continue;
    let maxProfile=terrain.roundness[seed],touchesEdge=false;
    const cells=[],ids=[],stack=[seed];
    while(stack.length){
      const index=stack.pop(),cx=index%W,cy=Math.floor(index/W);
      cells.push({x:cx,y:cy});ids.push(index);
      if(cx===0||cy===0||cx===W-1||cy===H-1)touchesEdge=true;
      maxProfile=Math.max(maxProfile,terrain.roundness[index]);
      for(const [dx,dy] of DIRS){
        const nx=cx+dx,ny=cy+dy;
        if(nx<0||ny<0||nx>=W||ny>=H)continue;
        const ni=ny*W+nx;
        if(visited[ni]||terrain.levels[ni]!==level||
           sculptWaterAt(terrain,nx,ny)>0)continue;
        visited[ni]=1;stack.push(ni);
      }
    }
    if(maxProfile<=95||touchesEdge)continue;
    const loops=contourLoops(cells);
    if(!loops.length)continue;
    const region=Object.freeze({level,profile:maxProfile,cells:Object.freeze(ids),
      loops});
    for(const index of ids)assigned.set(index,region);
  }
  terrainCache.set(terrain,assigned);
  return assigned;
}
export function sculptHillRegionCornerRadius(region,tile={width:28,height:21}){
  const intensity=Math.max(0,Math.min(1,(region?.profile-95)/55));
  return Math.min(tile.width,tile.height)*2.2*intensity;
}
export function sculptHillRegionOutline(ctx,region,tile={width:28,height:21,rise:18}){
  if(!ctx||!region)return;
  const w=tile.width,h=tile.height,offset=region.level*tile.rise;
  const target=sculptHillRegionCornerRadius(region,tile);
  ctx.beginPath();
  for(const loop of region.loops){
    const count=loop.length;
    for(let i=0;i<count;i++){
      const a=loop[i],prev=loop[(i+count-1)%count],next=loop[(i+1)%count];
      const dirIn=DIRS[a.from],dirOut=DIRS[a.to];
      const lenIn=Math.hypot((a.x-prev.x)*w,(a.y-prev.y)*h);
      const lenOut=Math.hypot((next.x-a.x)*w,(next.y-a.y)*h);
      const rightTurn=(a.to-a.from+4)%4===1;
      const rad=rightTurn?Math.min(target,lenIn*.49,lenOut*.49):0;
      const px=a.x*w,py=a.y*h-offset;
      const beforeX=px-dirIn[0]*rad,beforeY=py-dirIn[1]*rad;
      const afterX=px+dirOut[0]*rad,afterY=py+dirOut[1]*rad;
      if(i===0)ctx.moveTo(beforeX,beforeY);
      else ctx.lineTo(beforeX,beforeY);
      if(rad)ctx.quadraticCurveTo(px,py,afterX,afterY);
      else ctx.lineTo(px,py);
    }
    ctx.closePath();
  }
}
export function sculptClipRoundedHill(ctx,region,tile){
  if(!region)return false;
  // One Path2D per immutable region and tile size, never per animated frame.
  if(typeof Path2D==='function'){
    const k=tile.width+':'+tile.height+':'+tile.rise;
    let cache=pathCache.get(region);
    if(!cache||cache.key!==k){
      const path=new Path2D();
      sculptHillRegionOutline(path,region,tile);
      cache={key:k,path};pathCache.set(region,cache);
    }
    ctx.clip(cache.path,'evenodd');
  }else{
    sculptHillRegionOutline(ctx,region,tile);
    ctx.clip('evenodd');
  }
  return true;
}
