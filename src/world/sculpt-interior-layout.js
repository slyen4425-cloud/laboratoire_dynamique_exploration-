// One interior shape = WorldArea.boundary. UI presets are never serialized.
import {createSculptTerrain} from './sculpt-height-model.js';
import {normalizeWorldArea} from './world-area-model.js';
import {updateSculptInteriorDoor} from './sculpt-interior-area-link.js';
export const SCULPT_INTERIOR_SHAPES=Object.freeze(['rectangle','l','t','cross']);
const P=([x,y])=>Object.freeze({x,y});
const outlines=Object.freeze({
  rectangle:null,
  l:[[0,0],[.58,0],[.58,.42],[1,.42],[1,1],[0,1]],
  t:[[.32,0],[.68,0],[.68,.38],[1,.38],[1,1],[0,1],[0,.38],[.32,.38]],
  cross:[[.3,0],[.7,0],[.7,.3],[1,.3],[1,.7],[.7,.7],[.7,1],[.3,1],[.3,.7],[0,.7],[0,.3],[.3,.3]]
});
export function sculptInteriorBoundary(kind='rectangle'){
  if(!SCULPT_INTERIOR_SHAPES.includes(kind))throw Error('Forme inconnue');
  return kind==='rectangle'?{kind:'rectangle'}:
    {kind:'polygon',vertices:outlines[kind].map(P)};
}
export function sculptInteriorShapeId(area){
  if(area?.boundary?.kind!=='polygon')return 'rectangle';
  const data=JSON.stringify(area.boundary.vertices);
  return SCULPT_INTERIOR_SHAPES.find(k=>k!=='rectangle'&&
    JSON.stringify(sculptInteriorBoundary(k).vertices)===data)??'custom';
}
const tiles=(n,name,max)=>{
  if(!Number.isInteger(n)||n<8||n>max)throw Error('Dimensions '+name+' : entre 8 et '+max+' cases');
  return n;
};
// Reframe a furnished room: no silent loss of furniture, walls, ramps or
// spheres. On rejected resizing the unchanged original can still be exported.
export function resizeSculptInterior(entry,{width=entry.terrain.width,
  height=entry.terrain.height,shape=sculptInteriorShapeId(entry.area)}={}){
  const w=tiles(width,'largeur',80),h=tiles(height,'hauteur',64);
  if(!SCULPT_INTERIOR_SHAPES.includes(shape))throw Error('Forme : modèle personnalisé à conserver');
  const old=entry.terrain;
  const sx=w/old.width,sy=h/old.height;
  const sc=(v,n)=>Math.max(0,Math.min(n-.01,v));
  const translate=(p)=>({x:sc(p.x*sx,w*28),y:sc(p.y*sy,h*21)});
  const walls=entry.area.walls.map(wall=>({...wall,a:translate(wall.a),
    b:translate(wall.b)}));
  const objects=entry.objects.map(obj=>({
    ...obj,transform:{...obj.transform,...translate(obj.transform)}
  }));
  const actors=entry.actors.map(obj=>({
    ...obj,...translate(obj)
  }));
  // The sculpt relief model owns terrain height and slopes. Resizing authored
  // slopes/spheres would distort their world geometry: prevent accidental loss.
  if((old.spheres?.length||old.ramps?.length)&&(sx!==1||sy!==1))
    throw Error('Dimensions bloquées : retire les reliefs/pentes avant de redimensionner.');
  const terrain=createSculptTerrain({
    width:w,height:h,
    levels:Array.from({length:w*h},(_,i)=>{
      const col=Math.min(old.width-1,Math.floor((i%w)/sx));
      const row=Math.min(old.height-1,Math.floor(Math.floor(i/w)/sy));
      return old.levels[row*old.width+col];
    }),
    waterLevels:Array.from({length:w*h},(_,i)=>{
      const col=Math.min(old.width-1,Math.floor((i%w)/sx));
      const row=Math.min(old.height-1,Math.floor(Math.floor(i/w)/sy));
      return old.waterLevels[row*old.width+col];
    }),
    roundness:Array.from({length:w*h},(_,i)=>{
      const col=Math.min(old.width-1,Math.floor((i%w)/sx));
      const row=Math.min(old.height-1,Math.floor(Math.floor(i/w)/sy));
      return old.roundness[row*old.width+col];
    }),
    spheres:old.spheres,ramps:old.ramps
  });
  const area=normalizeWorldArea({...entry.area,width:w*28,height:h*21,
    boundary:sculptInteriorBoundary(shape),walls});
  // Initial door moves proportionally. Spawn follows through the SAME Portal.
  const d=entry.exitPortal?.trigger;
  let updated={...entry,area,terrain,objects,actors};
  if(d?.kind==='point')updated=updateSculptInteriorDoor(updated,
    {...translate(d),scale:entry.exitPortal.visual.scale});
  // Outside door, source anchor and identity are NEVER rewritten.
  return Object.freeze(updated);
}
