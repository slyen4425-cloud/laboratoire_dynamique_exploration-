// Single projection policy: keep the real (possibly actor-following) camera
// within the existing Sculpt terrain bounds. Neither terrain nor collision
// extents are changed; only the presentation pan is bounded.
export function clampSculptNavigationCameraToTerrainV1({
  pan,bounds,zoom,width,height
}={}){
  if(!pan||!bounds||![zoom,width,height,bounds.minX,bounds.maxX,bounds.minY,bounds.maxY,pan.x,pan.y]
    .every(Number.isFinite)||zoom<=0||width<=0||height<=0||
    bounds.maxX<bounds.minX||bounds.maxY<bounds.minY)
    throw new TypeError('Valid camera pan, terrain projection and viewport required');
  const axis=(desired,min,max,screenSize)=>{
    const projectedWidth=(max-min)*zoom;
    if(projectedWidth<=screenSize)
      return (screenSize-projectedWidth)/2-min*zoom;
    return Math.max(screenSize-max*zoom,Math.min(-min*zoom,desired));
  };
  return Object.freeze({
    x:axis(pan.x,bounds.minX,bounds.maxX,width),
    y:axis(pan.y,bounds.minY,bounds.maxY,height)
  });
}
