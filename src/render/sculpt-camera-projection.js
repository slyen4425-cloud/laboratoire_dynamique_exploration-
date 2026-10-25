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
// Interior uses the SAME affine projector/inverse, without oblique horizontal
// shear that made perpendicular walls lean unnaturally at the 35° limit.
export function sculptCameraInteriorView(angle=SCULPT_GAME_CAMERA_ANGLE.default){
  const view=sculptCameraGameView(angle);
  return Object.freeze({...view,shear:0,label:'Intérieur '+view.angle+'°'});
}
export function sculptCameraProject(view,x,y){
  return Object.freeze({x,y:view.pitch*y+view.shear*x});
}
// Screen-space sprite lift belongs AFTER terrain world->screen projection.
// Bridge PNG/WebP is a billboard at every camera angle; its deck position in
// that bitmap is expressed in Canvas units, not unprojected world altitude.
// Applying lift in world Y scales it by pitch (sin 35°) and pulls the hero
// UNDER the near board at oblique angles. Never alter gameplay X/Y here.
export function sculptCameraProjectBridgeFoot(view,x,worldFootY,deckLift=0){
  const projected=sculptCameraProject(view,x,worldFootY);
  return Object.freeze({x:projected.x,y:projected.y-Math.max(0,Number(deckLift)||0)});
}
// Draw/debug only: the *same* authoritative oriented rectangle as Collision
// World, projected in the selected camera including canonical bank altitude.
export function sculptCameraProjectBridgeCorridor(view,corridor,{level=0,rise=18}={}){
  if(!corridor||!Number.isFinite(corridor.length)||!Number.isFinite(corridor.width)||
     corridor.length<=0||corridor.width<=0)return Object.freeze([]);
  const c=Math.cos(corridor.rotation),s=Math.sin(corridor.rotation);
  const result=[];
  for(const [along,side] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const u=along*corridor.length*.5,v=side*corridor.width*.5;
    result.push(sculptCameraProject(view,corridor.x+u*c-v*s,
      corridor.y+u*s+v*c-level*rise));
  }
  return Object.freeze(result);
}
export function sculptCameraUnproject(view,x,y){
  return Object.freeze({x,y:(y-view.shear*x)/view.pitch});
}
// Camera/input adapter only: convert a SCREEN joystick vector into the
// exact WORLD vector consumed by the unmodified Exploration stepMovement.
// The engine normalizes the vector. To preserve visually equal screen speed,
// compensate the length change due to the inverse camera transform. This
// never changes obstacle checks, physics, or authored terrain heights.
export function sculptCameraWorldInput(view,screenX=0,screenY=0){
  const sx=Number.isFinite(screenX)?screenX:0,sy=Number.isFinite(screenY)?screenY:0;
  const screenMagnitude=Math.hypot(sx,sy);
  if(screenMagnitude<=1e-9)return Object.freeze({x:0,y:0,speedMultiplier:1});
  const pitch=Math.max(.35,Number(view?.pitch)||1);
  const shear=Number(view?.shear)||0;
  const x=sx,y=(sy-shear*sx)/pitch;
  const speedMultiplier=Math.max(.85,Math.min(2,Math.hypot(x,y)/screenMagnitude));
  return Object.freeze({x,y,speedMultiplier});
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
// Interior runtime camera: keep the ACTOR on screen, not the entire map.
// A tiny/concave WorldArea must be allowed to show empty backdrop outside
// its edges; otherwise clamping pan to world bounds loses the player when
// pitch, zoom, or sprite elevation changes. Collision remains WorldArea-owned.
export function sculptCameraFollowActor(view,{x,y,level=0,rise=18}={},
  {width,height,zoom,anchorX=.5,anchorY=.54}={}){
  if(![x,y,level,rise,width,height,zoom].every(Number.isFinite)||
    width<=0||height<=0||zoom<=0)throw Error('Caméra joueur : coordonnées invalides');
  const projected=sculptCameraProject(view,x,y-level*rise);
  return Object.freeze({x:width*anchorX-projected.x*zoom,
    y:height*anchorY-projected.y*zoom});
}
export function sculptCameraScreenToWorld(view,{screenX,screenY,pan,zoom}){
  const x=(screenX-pan.x)/zoom, y=(screenY-pan.y)/zoom;
  return sculptCameraUnproject(view,x,y);
}
