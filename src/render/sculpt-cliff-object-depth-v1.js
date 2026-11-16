// Read-only depth decision for a placed sprite against *existing* Sculpt cliff
// faces. Its anchored foot decides which side of a wall the object belongs to;
// sprite height and the order in which a hill/tree were authored never do.
import {sculptFaces} from '../world/sculpt-height-model.js';

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
  tileWidth=28,tileHeight=21,rise=18,faces=null
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
    const behindFoot=face.orientation==='east'
      ?foot.x>=(face.x+1)*tileWidth
      :foot.y>=(face.y+1)*tileHeight;
    if(behindFoot)redraw=true;
    else frontRects.push(Object.freeze({x,y,width,height}));
  }
  return Object.freeze({redraw,frontRects:Object.freeze(frontRects)});
}
