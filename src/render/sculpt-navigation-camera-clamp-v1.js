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

// Presentation-only camera bounds for the NORTH decorative strip only.
// Keep the original playable x/south limits. This does not change saved
// decorative terrain, physics, portals, collisions or WorldArea dimensions.
export function sculptExteriorFringeCameraBoundsV1({
  coreBounds,view,coreWidth,coreHeight,fringeRows=8,
  tileWidth=28,tileHeight=21,viewportHeight,zoom,skyFraction=.12
}={}){
  if(!coreBounds||!view||
     ![coreBounds.minX,coreBounds.maxX,coreBounds.minY,coreBounds.maxY,
       view.pitch,view.shear,coreWidth,coreHeight,fringeRows,
       tileWidth,tileHeight,viewportHeight,zoom,skyFraction].every(Number.isFinite)||
     coreWidth<=0||coreHeight<=0||fringeRows<0||fringeRows>8||
     tileWidth<=0||tileHeight<=0||viewportHeight<=0||zoom<=0||
     skyFraction<0||skyFraction>.25)
    throw new TypeError('Valid exterior decorative camera bounds required');
  const northY=-fringeRows*tileHeight;
  const northProjected=Math.min(
    view.pitch*northY,
    view.pitch*northY+view.shear*coreWidth
  );
  const skyPixels=Math.min(viewportHeight*skyFraction,120);
  return Object.freeze({
    ...coreBounds,
    minY:fringeRows===0&&skyPixels===0?coreBounds.minY:
      Math.min(coreBounds.minY,northProjected)-skyPixels/zoom,
    maxY:coreBounds.maxY
  });
}
