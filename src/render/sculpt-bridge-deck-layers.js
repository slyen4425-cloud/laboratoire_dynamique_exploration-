// Sculpt-only 2.5D visual composition for a hero standing on a canonical
// bridge corridor. Draw the artwork behind the hero, then the near rail.
// This never owns or changes traversal, collision, placement or player x/y.
export const SCULPT_BRIDGE_VISUAL_DECK_LIFT=.35;
// Explicit visual-only anchor: 2.5D artwork's wood deck center lies 55%
// of its image height ABOVE the historical bottom-of-image origin. V67 moves
// only the bitmap down by this fraction, making that deck coincide with the
// WorldObject/collision center. NO physics may depend on these art pixels.
export const SCULPT_BRIDGE_DECK_ART_SHIFT_RATIO=.55;
export function sculptBridgeUsesDeckArtAnchor(object){
  return object?.kind==='bridge'&&object?.visual?.assetId?.includes('_2p5d.')===true;
}
export function sculptBridgeDeckArtShift(rect,object){
  return sculptBridgeUsesDeckArtAnchor(object)&&Number.isFinite(rect?.height)
    ?Math.max(0,rect.height)*SCULPT_BRIDGE_DECK_ART_SHIFT_RATIO:0;
}
export function sculptBridgeForegroundClip({width,height}={},artShift=0){
  const w=Math.max(0,Number(width)||0),h=Math.max(0,Number(height)||0);
  if(!w||!h)return Object.freeze({x:0,y:0,width:0,height:0});
  // The original square WebP includes both far and near rail in one image.
  // Near rail and supports occupy its front-most lower portion. Keep them in
  // front of the hero but leave the far rail and decking behind the hero.
  return Object.freeze({x:-w*.5,y:-h*.60+Math.max(0,Number(artShift)||0),width:w,height:h*.60});
}
export function sculptBridgeVisualFootLift(rect,object=null){
  // The V67 sprite itself is now deck-aligned: no per-character compensation.
  if(sculptBridgeUsesDeckArtAnchor(object))return 0;
  return rect&&Number.isFinite(rect.height)&&rect.height>0
    ?rect.height*SCULPT_BRIDGE_VISUAL_DECK_LIFT:0;
}
