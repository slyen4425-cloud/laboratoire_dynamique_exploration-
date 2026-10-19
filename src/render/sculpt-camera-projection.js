// Single read-only 2.5D camera projection for the isolated Sculpt "Tester" mode.
// Physical World coordinates, terrain cell dimensions and collision are NEVER projected.
// A 90-degree pitch restores V37. A lower pitch foreshortens only horizontal
// ground depth, leaving vertical elevation and standing sprites uncompressed.
export const SCULPT_CAMERA_ANGLE=Object.freeze({min:35,max:90,default:55});

export function sculptCameraProjection(angle=SCULPT_CAMERA_ANGLE.default,tile={width:28,height:21,rise:18}){
  const requested=Number(angle);
  const degrees=Math.max(SCULPT_CAMERA_ANGLE.min,
    Math.min(SCULPT_CAMERA_ANGLE.max,Number.isFinite(requested)?requested:SCULPT_CAMERA_ANGLE.default));
  const groundScale=Math.sin(degrees*Math.PI/180);
  const projectedTile=Object.freeze({...tile,height:tile.height*groundScale});
  return Object.freeze({
    angle:degrees,groundScale,tile:projectedTile,
    projectGroundY(y){return y*groundScale;},
    projectSurfaceY(y,level){return y*groundScale-level*tile.rise;},
    worldWidth(cells){return cells*tile.width;},
    worldHeight(cells,maxLevel=7){return cells*projectedTile.height+maxLevel*tile.rise;}
  });
}
