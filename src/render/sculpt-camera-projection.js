// SculptLab-only camera adapter. Pure affine world->screen projection.
// Physics, terrain heights, collision and serialized scenes remain in world X/Y.
// The SAME transform must be used by the canvas and its pointer inverse.
export const SCULPT_CAMERA_VIEWS=Object.freeze({
  classic:Object.freeze({pitch:1,shear:0,label:'Vue précédente'}),
  threeQuarter:Object.freeze({pitch:.70,shear:-.10,label:'Vue trois-quarts (pilote)'})
});
export function sculptCameraView(key='threeQuarter'){
  return SCULPT_CAMERA_VIEWS[key]??SCULPT_CAMERA_VIEWS.threeQuarter;
}
// Continuous view angle for TESTER. Reuses the same affine projection,
// inverse and camera bounds as the published V38 editorial comparison.
// 90 degrees looks straight down; lower angles emphasize depth.
export const SCULPT_GAME_CAMERA_ANGLE=Object.freeze({min:35,max:90,default:55});
export function sculptCameraGameView(angle=SCULPT_GAME_CAMERA_ANGLE.default){
  const requested=Number(angle);
  const degrees=Math.max(SCULPT_GAME_CAMERA_ANGLE.min,
    Math.min(SCULPT_GAME_CAMERA_ANGLE.max,
      Number.isFinite(requested)?requested:SCULPT_GAME_CAMERA_ANGLE.default));
  const pitch=Math.sin(degrees*Math.PI/180);
  const shear=-.10*(90-degrees)/55;
  return Object.freeze({pitch,shear,angle:degrees,label:'Inclinaison Tester '+degrees+'°'});
}
export function sculptCameraProject(view,x,y){
  return Object.freeze({x,y:view.pitch*y+view.shear*x});
}
export function sculptCameraUnproject(view,x,y){
  return Object.freeze({x,y:(y-view.shear*x)/view.pitch});
}
export function sculptCameraBounds(view,width,height,maxElevation){
  const elevated=Number(maxElevation)||0;
  const corners=[
    sculptCameraProject(view,0,-elevated),
    sculptCameraProject(view,width,-elevated),
    sculptCameraProject(view,0,height),
    sculptCameraProject(view,width,height)
  ];
  const minY=Math.min(...corners.map(p=>p.y));
  const maxY=Math.max(...corners.map(p=>p.y));
  return Object.freeze({minX:0,maxX:width,minY,maxY,width,height:maxY-minY});
}
export function sculptCameraScreenToWorld(view,{screenX,screenY,pan,zoom}){
  const x=(screenX-pan.x)/zoom, y=(screenY-pan.y)/zoom;
  return sculptCameraUnproject(view,x,y);
}
