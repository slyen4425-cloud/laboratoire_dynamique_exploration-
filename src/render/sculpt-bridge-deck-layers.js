// Sculpt-only 2.5D visual composition for a hero standing on a canonical
// bridge corridor. Draw the artwork behind the hero, then the near rail.
// This never owns or changes traversal, collision, placement or player x/y.
export const SCULPT_BRIDGE_VISUAL_DECK_LIFT=.35;
export function sculptBridgeForegroundClip({width,height}={}){
  const w=Math.max(0,Number(width)||0),h=Math.max(0,Number(height)||0);
  if(!w||!h)return Object.freeze({x:0,y:0,width:0,height:0});
  // The original square WebP includes both far and near rail in one image.
  // Near rail and supports occupy its front-most lower portion. Keep them in
  // front of the hero but leave the far rail and decking behind the hero.
  return Object.freeze({x:-w*.5,y:-h*.60,width:w,height:h*.60});
}
export function sculptBridgeVisualFootLift(rect){
  return rect&&Number.isFinite(rect.height)&&rect.height>0
    ?rect.height*SCULPT_BRIDGE_VISUAL_DECK_LIFT:0;
}
