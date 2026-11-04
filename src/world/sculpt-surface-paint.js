// The sculpt preview stores standard WorldSurface v3 routes/zones directly.
// This editor adapter does not create a second route model or WorldDocument.
import {normalizeWorldSurface} from './surface-model.js';
import {TERRAIN_FAMILY_IDS} from './terrain-family-registry.js';

export const SCULPT_SURFACE_MATERIALS=Object.freeze([
  Object.freeze({id:'road.dirt',kind:'route',label:'Route de terre',assetKind:'path'}),
  Object.freeze({id:'grass.forest',kind:'zone',label:'Herbe',assetKind:'surface'}),
  Object.freeze({id:'ground.forest_floor',kind:'zone',label:'Terre forestière',assetKind:'surface'}),
  Object.freeze({id:'ground.sand',kind:'zone',label:'Sable',assetKind:'surface'}),
  Object.freeze({id:'ground.snow',kind:'zone',label:'Neige',assetKind:'surface'}),
  Object.freeze({id:'ground.mountain_rock',kind:'zone',label:'Sol rocheux',assetKind:'surface'}),
  Object.freeze({id:'floor.wood.house',kind:'zone',label:'Parquet chêne',assetKind:'surface'}),
  Object.freeze({id:'floor.wood.dark',kind:'zone',label:'Bois foncé',assetKind:'surface'}),
  Object.freeze({id:'floor.tile.light',kind:'zone',label:'Carrelage clair',assetKind:'surface'}),
  Object.freeze({id:'floor.tile.sandstone',kind:'zone',label:'Pierre sable',assetKind:'surface'}),
  Object.freeze({id:'floor.concrete.gray',kind:'zone',label:'Béton gris',assetKind:'surface'})
]);
export const SCULPT_SURFACE_LIMIT=80;
const lookup=new Map(SCULPT_SURFACE_MATERIALS.map(x=>[x.id,x]));
const cleanPoints=(points)=>Array.isArray(points)?points.filter(p=>
  Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=0&&p.y>=0).slice(0,512)
  .map(p=>({x:p.x,y:p.y})):[];
export const createSculptSurface=()=>normalizeWorldSurface({routes:[],zones:[],rivers:[]});
export function normalizeSculptSurface(raw={}){
  const source=raw&&typeof raw==='object'?raw:{};
  if((source.rivers?.length??0)>0)throw Error('Peinture sculptable : rivière non prise en charge ici');
  const routes=Array.isArray(source.routes)?source.routes:[];
  const zones=Array.isArray(source.zones)?source.zones:[];
  if(routes.length+zones.length>SCULPT_SURFACE_LIMIT)
    throw Error('Trop de routes et zones pour ce laboratoire');
  for(const item of [...routes,...zones]){
    if(!TERRAIN_FAMILY_IDS.includes(item?.terrainFamilyId??(routes.includes(item)?'road':source.baseTerrainFamilyId??'forest')))
      throw new RangeError('Famille de terrain inconnue dans la scène');
    const meta=lookup.get(item?.materialId);
    if(!meta || (routes.includes(item)?meta.kind!=='route':meta.kind!=='zone') ||
      !Number.isFinite(item.width)||item.width<6||item.width>480 ||
      !Array.isArray(item.points)||item.points.length<2||item.points.length>512||
      cleanPoints(item.points).length!==item.points.length)
      throw Error('Peinture sculptable : matériau ou géométrie invalide');
  }
  return normalizeWorldSurface({baseMaterialId:source.baseMaterialId,
    baseTerrainFamilyId:source.baseTerrainFamilyId,
    baseTraversalRuleId:source.baseTraversalRuleId,routes,zones,rivers:[]});
}
export function appendSculptSurfaceStroke(raw,{
  materialId,points=[],width=50,terrainFamilyId
}={}){
  const surface=normalizeSculptSurface(raw);
  const meta=lookup.get(materialId);
  const pts=cleanPoints(points);
  const family=terrainFamilyId??(meta?.kind==='route'?'road':surface.baseTerrainFamilyId);
  if(!TERRAIN_FAMILY_IDS.includes(family))throw new RangeError('Famille de terrain inconnue');
  if(!meta||pts.length===0||
      surface.routes.length+surface.zones.length>=SCULPT_SURFACE_LIMIT)return surface;
  if(pts.length===1)pts.push({x:pts[0].x+.001,y:pts[0].y+.001});
  const kind=meta.kind==='route'?'routes':'zones';
  const ids=new Set([...surface.routes,...surface.zones].map(x=>x.id));
  let serial=1;while(ids.has('sculpt-surface-'+serial))serial++;
  const feature={
    id:'sculpt-surface-'+serial,points:pts,
    materialId,width:Math.max(6,Math.min(480,Number(width)||50)),
    terrainFamilyId:family
  };
  if(meta.kind==='route')feature.traversalRuleId='terrain.road';
  return normalizeSculptSurface({...surface,[kind]:[...surface[kind],feature]});
}
function distanceToSegment(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length===0?0:Math.max(0,Math.min(1,
    ((point.x-a.x)*dx+(point.y-a.y)*dy)/length));
  return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);
}
export function removeSculptSurfaceAt(raw,point){
  const surface=normalizeSculptSurface(raw);
  let found=null;
  for(const kind of ['zones','routes']){
    for(const feature of surface[kind]){
      if(feature.points.some((p,i)=>i>0&&distanceToSegment(point,feature.points[i-1],p)<=feature.width/2+7))
        found={kind,id:feature.id};
    }
  }
  if(!found)return surface;
  return normalizeSculptSurface({...surface,
    [found.kind]:surface[found.kind].filter(f=>f.id!==found.id)});
}
