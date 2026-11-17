// Render-only continuity for the existing 8-cell decorative fringe.
// The nearest CANONICAL WorldSurface paint wins; never create gameplay cells,
// collisions, saved strokes or a second terrain-family authority.
import {createSculptSurface,appendSculptSurfaceStroke,SCULPT_SURFACE_MATERIALS}
  from '../world/sculpt-surface-paint.js';

const valid=new Set(SCULPT_SURFACE_MATERIALS.filter(m=>m.kind==='zone').map(m=>m.id));
const familyMaterial=Object.freeze({
  snow:'ground.snow',forest:'grass.forest',plain:'grass.forest',
  sand:'ground.sand',mountain:'ground.mountain_rock'
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function distanceSegment(x,y,a,b){
  const dx=b.x-a.x,dy=b.y-a.y;
  const len=dx*dx+dy*dy;
  const t=len>0?clamp(((x-a.x)*dx+(y-a.y)*dy)/len,0,1):0;
  return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
}
function edgeMaterial(surface,x,y){
  let material=familyMaterial[surface?.baseTerrainFamilyId]??surface?.baseMaterialId;
  if(!valid.has(material))material=null;
  for(const zone of surface?.zones??[]){
    if(!valid.has(zone.materialId)||!Array.isArray(zone.points))continue;
    const radius=Math.max(0,Number(zone.width)||0)/2+6;
    if(zone.points.some((p,i)=>i>0&&distanceSegment(x,y,zone.points[i-1],p)<=radius))
      material=zone.materialId;
  }
  return material;
}
/**
 * Visual projection only; temporary standard SculptSurface strokes.
 * One strip per contiguous material run, sampled from the nearest playable
 * edge. The official stroke helper owns IDs. Original stays untouched.
 */
export function sculptFringeVisualSurfaceV1(surface,{
  col,row,columns,rows,tileWidth=28,tileHeight=21,chunkSize=8
}={}){
  if(!surface||!Number.isInteger(col)||!Number.isInteger(row)||
     !Number.isInteger(columns)||!Number.isInteger(rows)||
     columns<1||rows<1)return null;
  const cols=[];
  for(let local=0;local<chunkSize;local++){
    const coreCol=clamp(col+local,0,columns-1);
    const coreRow=clamp(row+Math.floor(chunkSize/2),0,rows-1);
    cols.push(edgeMaterial(surface,(coreCol+.5)*tileWidth,
      (coreRow+.5)*tileHeight));
  }
  let visual=createSculptSurface(),hasPaint=false;
  for(let first=0;first<cols.length;){
    const material=cols[first];
    let end=first+1;
    while(end<cols.length&&cols[end]===material)end++;
    if(material){
      const mid=(first+end)*tileWidth/2;
      visual=appendSculptSurfaceStroke(visual,{materialId:material,
        points:[{x:mid,y:0},{x:mid,y:chunkSize*tileHeight}],
        width:(end-first)*tileWidth+1});
      hasPaint=true;
    }
    first=end;
  }
  return hasPaint?visual:null;
}

// A saved-but-empty decorative surface is not authored paint. Erasing a
// fringe stroke must restore the nearest canonical WorldSurface projection,
// not expose the old green placeholder beneath a snow/forest world.
// Existing painted decorative chunks continue to win unchanged.
export function sculptFringeResolvedPaintSurfaceV1(chunkSurface,worldSurface,options){
  if((chunkSurface?.zones?.length??0)+(chunkSurface?.routes?.length??0)>0)
    return chunkSurface;
  return sculptFringeVisualSurfaceV1(worldSurface,options);
}
