// Read-only terrain-family projection over the canonical WorldSurface v3.
// A stroke's geometry owns its terrainFamilyId; visual material is irrelevant.
import {normalizeWorldSurface} from './surface-model.js';
function distanceToStroke(point,stroke){
  let nearest=Infinity;
  for(let i=1;i<stroke.points.length;i++){
    const a=stroke.points[i-1],b=stroke.points[i];
    const dx=b.x-a.x,dy=b.y-a.y;
    const len=dx*dx+dy*dy;
    const t=len===0?0:Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/len));
    nearest=Math.min(nearest,Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy));
  }
  return nearest;
}
export function terrainFamilyAtWorldPosition(rawSurface,point){
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))throw new TypeError('finite world position required');
  const surface=normalizeWorldSurface(rawSurface);
  // The last painted stroke wins within its layer; roads override ground zones.
  for(const layer of [surface.routes,surface.zones]){
    for(let i=layer.length-1;i>=0;i--){
      const stroke=layer[i];
      if(distanceToStroke(point,stroke)<=stroke.width/2)return stroke.terrainFamilyId;
    }
  }
  return surface.baseTerrainFamilyId;
}
