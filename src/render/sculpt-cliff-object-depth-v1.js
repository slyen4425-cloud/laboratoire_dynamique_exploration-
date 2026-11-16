// Read-only depth decision for a placed sprite against *existing* Sculpt cliff
// faces. Its anchored foot decides which side of a wall the object belongs to;
// sprite height and the order in which a hill/tree were authored never do.
import {SCULPT_TERRAIN_MAX_LEVEL,sculptFaces,sculptHeightAt} from '../world/sculpt-height-model.js';

export function sculptObjectInFrontOfCliffV1(terrain,rect,foot,{
  tileWidth=28,tileHeight=21,rise=18,faces=null
}={}){
  if(!terrain||!rect||!foot||![rect.x,rect.y,rect.width,rect.height,
    foot.x,foot.y,tileWidth,tileHeight,rise].every(Number.isFinite)||
    rect.width<=0||rect.height<=0||tileWidth<=0||tileHeight<=0||rise<=0)
    return false;
  const minX=rect.x-rect.width/2,maxX=rect.x+rect.width/2;
  const minY=rect.y-rect.height,maxY=rect.y;
  let wallBehindFoot=false,wallInFrontOfFoot=false;
  for(const face of faces??sculptFaces(terrain)){
    const left=face.orientation==='east'?(face.x+1)*tileWidth-Math.min(3,tileWidth*.11):face.x*tileWidth;
    const right=face.orientation==='east'?(face.x+1)*tileWidth:(face.x+1)*tileWidth;
    const top=(face.y+1)*tileHeight-face.upper*rise;
    const bottom=(face.y+1)*tileHeight-face.lower*rise;
    if(right<=minX||left>=maxX||bottom<=minY||top>=maxY)continue;
    // The world-space foot, NOT the top of the sprite, establishes front/back.
    // A wall starting behind the foot must not crop a tree planted in front.
    if(foot.y>=(face.y+1)*tileHeight)wallBehindFoot=true;
    else wallInFrontOfFoot=true;
  }
  return wallBehindFoot&&!wallInFrontOfFoot;
}

// C3: one authoritative read-only depth plan for the hero at stepped cliff
// intersections. A sprite can overlap a wall BEHIND its grounded foot and
// another wall IN FRONT simultaneously; suppressing the entire actor because
// one frontal wall intersects causes the Pixel "only legs visible" regression.
// This plan uses the SAME canonical sculptFaces and rectangles as the cached
// cliff mask; the renderer samples the original raster, never repaints rocks.
export function sculptActorCliffDepthPlanV2(terrain,rect,foot,{
  tileWidth=28,tileHeight=21,rise=18,faces=null,footRadius=0
}={}){
  const empty=Object.freeze({redraw:false,frontRects:Object.freeze([])});
  if(!terrain||!rect||!foot||![rect.x,rect.y,rect.width,rect.height,
    foot.x,foot.y,tileWidth,tileHeight,rise].every(Number.isFinite)||
    rect.width<=0||rect.height<=0||tileWidth<=0||tileHeight<=0||rise<=0)
    return empty;
  const minX=rect.x-rect.width/2,maxX=rect.x+rect.width/2;
  const minY=rect.y-rect.height,maxY=rect.y;
  let redraw=false;
  const frontRects=[];
  for(const face of faces??sculptFaces(terrain)){
    // Match sculptCliffOcclusionRectsV1 / sculptEastSeamBounds exactly.
    const width=face.orientation==='east'?Math.min(3,tileWidth*.11):tileWidth;
    const x=face.orientation==='east'?(face.x+1)*tileWidth-width:face.x*tileWidth;
    const y=(face.y+1)*tileHeight-face.upper*rise;
    const height=(face.upper-face.lower)*rise;
    if(x+width<=minX||x>=maxX||y+height<=minY||y>=maxY)continue;
    // South face: lower terrain south of the row is in front; east face:
    // lower terrain east of the column is in front. Keep this 2.5D
    // painter-order test independent of sprite size and camera pitch.
    // Visual lip tolerance is the existing foot COLLISION RADIUS, not a
    // new collider. Do not let the wall hide part of a standing hero.
    const radius=Math.max(0,Number(footRadius)||0);
    const behindFoot=face.orientation==='east'
      ?foot.x+radius>=(face.x+1)*tileWidth
      :foot.y+radius>=(face.y+1)*tileHeight;
    if(behindFoot)redraw=true;
    else frontRects.push(Object.freeze({x,y,width,height}));
  }
  return Object.freeze({redraw,frontRects:Object.freeze(frontRects)});
}


// Read-only projected TOPS of higher canonical cells which overlap a placed
// lower-floor sprite. Return geometry only; clipping is applied inside the
// WorldObject's OWN paint, never to the hero or to the terrain raster.
export function sculptObjectRaisedCapOcclusionV1(terrain,rect,foot,{
  tileWidth=28,tileHeight=21,rise=18
}={}){
  const empty=Object.freeze([]);
  if(!terrain||!rect||!foot||!Number.isFinite(terrain.width)||
     !Number.isFinite(terrain.height)||
     ![rect.x,rect.y,rect.width,rect.height,foot.x,foot.y,
       tileWidth,tileHeight,rise].every(Number.isFinite)||
     rect.width<=0||rect.height<=0||tileWidth<=0||tileHeight<=0||rise<=0)
    return empty;
  const footCol=Math.floor(foot.x/tileWidth),footRow=Math.floor(foot.y/tileHeight);
  if(footCol<0||footRow<0||footCol>=terrain.width||footRow>=terrain.height)
    return empty;
  const level=sculptHeightAt(terrain,footCol,footRow);
  if(level>=SCULPT_TERRAIN_MAX_LEVEL)return empty;
  const left=rect.x-rect.width/2,right=rect.x+rect.width/2;
  const top=rect.y-rect.height,bottom=rect.y;
  const fromCol=Math.max(0,Math.floor((left-.6)/tileWidth));
  const toCol=Math.min(terrain.width-1,Math.floor(right/tileWidth));
  const fromRow=Math.max(0,Math.floor(top/tileHeight)-1);
  const toRow=Math.min(terrain.height-1,
    Math.ceil((bottom+SCULPT_TERRAIN_MAX_LEVEL*rise)/tileHeight));
  const caps=[];
  // Only a top lying IN FRONT of the grounded foot may cover a WorldObject.
  // A northern (smaller-Y) hill is behind a tree planted south of it: clipping
  // that tree by altitude alone caused the author's "trees vanish behind hills"
  // regression. Cliff faces keep their own separate canonical depth painter.
  // Compare saved WORLD rows, never screen Y/asset height or perspective.
  for(let row=Math.max(fromRow,footRow+1);row<=toRow;row++)for(let col=fromCol;col<=toCol;col++){
    const upper=sculptHeightAt(terrain,col,row);
    if(upper<=level)continue;
    // Exact same top surface raster geometry as drawSculptTerrain.
    const x=col*tileWidth,y=row*tileHeight-upper*rise;
    const width=tileWidth+.6,height=tileHeight+.6;
    if(x>=right||x+width<=left||y>=bottom||y+height<=top)continue;
    caps.push(Object.freeze({x,y,width,height,col,row,level:upper}));
  }
  return Object.freeze(caps);
}

  
// Union of possibly overlapping raised top rectangles, split into strictly
// disjoint horizontal bands. Canvas winding / evenodd paths otherwise let a
// tree reappear at the intersections of two higher tiles. This is still only
// read-only visual geometry computed from the canonical terrain.
export function sculptCapUnionRectsV1(caps=[]){
  if(!caps?.length)return Object.freeze([]);
  const ys=[...new Set(caps.flatMap(r=>[r.y,r.y+r.height]))].sort((a,b)=>a-b);
  const union=[];
  for(let i=0;i<ys.length-1;i++){
    const y=ys[i],next=ys[i+1];
    if(next-y<=1e-9)continue;
    const intervals=caps.filter(r=>r.y<next-1e-9&&r.y+r.height>y+1e-9)
      .map(r=>[r.x,r.x+r.width]).sort((a,b)=>a[0]-b[0]);
    if(!intervals.length)continue;
    let [left,right]=intervals[0];
    const emit=()=>union.push(Object.freeze({x:left,y,width:right-left,height:next-y}));
    for(const [a,b] of intervals.slice(1)){
      if(a<=right+1e-9)right=Math.max(right,b);
      else{emit();left=a;right=b;}
    }
    emit();
  }
  return Object.freeze(union);
}
