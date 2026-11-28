import {eraseSurfaceStrokeParts} from './road-edit-geometry-v1.js';
// The sculpt preview stores standard WorldSurface v3 routes/zones directly.
// This editor adapter does not create a second route model or WorldDocument.
import {normalizeWorldSurface} from './surface-model.js';
import {normalizeSurfaceBrushShape,squareSurfaceStrokeContainsPoint} from './surface-brush-geometry.js';

export const SCULPT_SURFACE_MATERIALS=Object.freeze([
  Object.freeze({id:'road.dirt',defaultTerrainFamilyId:'road',kind:'route',label:'Route de terre',assetKind:'path'}),
  Object.freeze({id:'grass.forest',defaultTerrainFamilyId:'forest',kind:'zone',label:'Herbe',assetKind:'surface'}),
  Object.freeze({id:'grass.forest.alt',defaultTerrainFamilyId:'forest',kind:'zone',label:'Herbe variante 2',assetKind:'surface'}),
  Object.freeze({id:'grass.forest.tall',defaultTerrainFamilyId:'forest',kind:'zone',label:'Haute herbe',assetKind:'surface'}),
  Object.freeze({id:'grass.forest.flowers',defaultTerrainFamilyId:'forest',kind:'zone',label:'Herbe fleurie',assetKind:'surface'}),
  Object.freeze({id:'ground.snow.rocky',defaultTerrainFamilyId:'snow',kind:'zone',label:'Neige rocheuse',assetKind:'surface'}),
  Object.freeze({id:'ground.dirt.textured',defaultTerrainFamilyId:'plain',kind:'zone',label:'Terre naturelle',assetKind:'surface'}),
  Object.freeze({id:'ground.volcanic.rocky',defaultTerrainFamilyId:'volcano',kind:'zone',label:'Sol volcanique rocheux',assetKind:'surface'}),
  Object.freeze({id:'ground.forest_floor',defaultTerrainFamilyId:'forest',kind:'zone',label:'Terre forestière',assetKind:'surface'}),
  Object.freeze({id:'ground.sand',defaultTerrainFamilyId:'sand',kind:'zone',label:'Sable',assetKind:'surface'}),
  Object.freeze({id:'ground.snow',defaultTerrainFamilyId:'snow',kind:'zone',label:'Neige',assetKind:'surface'}),
  Object.freeze({id:'ground.mountain_rock',defaultTerrainFamilyId:'mountain',kind:'zone',label:'Sol rocheux',assetKind:'surface'}),
  Object.freeze({id:'floor.wood.house',kind:'zone',label:'Parquet chêne',assetKind:'surface'}),
  Object.freeze({id:'floor.wood.dark',kind:'zone',label:'Bois foncé',assetKind:'surface'}),
  Object.freeze({id:'floor.tile.light',kind:'zone',label:'Carrelage clair',assetKind:'surface'}),
  Object.freeze({id:'floor.tile.sandstone',kind:'zone',label:'Pierre sable',assetKind:'surface'}),
  Object.freeze({id:'floor.concrete.gray',kind:'zone',label:'Béton gris',assetKind:'surface'})
]);
export const SCULPT_SURFACE_LIMIT=80;
const lookup=new Map(SCULPT_SURFACE_MATERIALS.map(x=>[x.id,x]));
export function resolveSculptSurfaceMaterial(id,registry=null){
  if(lookup.has(id))return lookup.get(id);
  if(typeof id!=='string'||!/^user\.material\.(surface|path)\./.test(id))return null;
  const material=registry?.resolve(id);
  if(!material||!['surface','path'].includes(material.kind)||!id.startsWith('user.material.'+material.kind+'.'))return null;
  return Object.freeze({id,label:material.label,assetKind:material.kind,
    kind:material.kind==='path'?'route':'zone',defaultTerrainFamilyId:material.terrainFamilyId});
}
/* Painter-authoring default only: the persisted WorldSurface remains the
   unique encounter authority. Unknown/indoor materials keep their author's
   semantic family rather than guessing from their picture. */
export function sculptEncounterFamilyForMaterial(materialId,registry=null){
  return resolveSculptSurfaceMaterial(materialId,registry)?.defaultTerrainFamilyId??null;
}
// Explicit opt-in repair for older maps with a painted texture and mismatched
// semantic family. Preserves IDs, original geometry, collisions and save format.
export function alignSculptSurfaceEncounterFamilies(raw,registry=null){
  const surface=normalizeSculptSurface(raw,registry);
  const reconcile=(items)=>items.map(feature=>{
    const family=sculptEncounterFamilyForMaterial(feature.materialId,registry);
    return family&&family!==feature.terrainFamilyId
      ?{...feature,terrainFamilyId:family}
      :feature;
  });
  // Never rewrite the area's base biome from its placeholder base image:
  // snow world presets may legitimately use a legacy grass background material.
  return normalizeSculptSurface({...surface,
    routes:reconcile(surface.routes),zones:reconcile(surface.zones)
  },registry);
}

const cleanPoints=(points)=>Array.isArray(points)?points.filter(p=>
  Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=0&&p.y>=0).slice(0,512)
  .map(p=>({x:p.x,y:p.y})):[];
export const createSculptSurface=()=>normalizeWorldSurface({routes:[],zones:[],rivers:[]});
export function normalizeSculptSurface(raw={},registry=null){
  const source=raw&&typeof raw==='object'?raw:{};
  if((source.rivers?.length??0)>0)throw Error('Peinture sculptable : rivière non prise en charge ici');
  if(typeof source.baseMaterialId==='string'&&source.baseMaterialId.startsWith('user.material.')&&
    resolveSculptSurfaceMaterial(source.baseMaterialId,registry)?.assetKind!=='surface')
    throw Error('Peinture sculptable : texture de base personnelle manquante ou incompatible : '+source.baseMaterialId);
  const routes=Array.isArray(source.routes)?source.routes:[];
  const zones=Array.isArray(source.zones)?source.zones:[];
  if(routes.length+zones.length>SCULPT_SURFACE_LIMIT)
    throw Error('Trop de routes et zones pour ce laboratoire');
  for(const item of [...routes,...zones]){
    const meta=resolveSculptSurfaceMaterial(item?.materialId,registry);
    if(!meta&&typeof item?.materialId==='string'&&item.materialId.startsWith('user.material.'))
      throw Error('Peinture sculptable : ressource graphique personnelle manquante : '+item.materialId);
    if(!meta || (routes.includes(item)?meta.kind!=='route':meta.kind!=='zone') ||
      (item.brushShape!==undefined&&!['round','square'].includes(item.brushShape)) ||
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
  materialId,terrainFamilyId=null,points=[],width=50,brushShape='round',border,knots
}={},registry=null){
  const surface=normalizeSculptSurface(raw,registry);
  const meta=resolveSculptSurfaceMaterial(materialId,registry);
  const pts=cleanPoints(points);
  if(!meta||pts.length===0||
      surface.routes.length+surface.zones.length>=SCULPT_SURFACE_LIMIT)return surface;
  if(pts.length===1)pts.push({x:pts[0].x+.001,y:pts[0].y+.001});
  const kind=meta.kind==='route'?'routes':'zones';
  const ids=new Set([...surface.routes,...surface.zones].map(x=>x.id));
  let serial=1;while(ids.has('sculpt-surface-'+serial))serial++;
  const feature={
    id:'sculpt-surface-'+serial,points:pts,
    materialId,width:Math.max(6,Math.min(480,Number(width)||50)),
    ...(normalizeSurfaceBrushShape(brushShape)==='square'?{brushShape:'square'}:{}),
    // The final authored WorldSurface family remains the sole gameplay owner.
    // New strokes default to the selected built-in terrain material's family;
    // an explicit override remains possible for custom encounter biomes.
    terrainFamilyId:typeof terrainFamilyId==='string'&&terrainFamilyId.trim()
      ?terrainFamilyId.trim()
      :(sculptEncounterFamilyForMaterial(materialId,registry)??
        (meta.kind==='route'?'road':surface.baseTerrainFamilyId))
  };
  if(meta.kind==='route'){
    feature.traversalRuleId='terrain.road';
    if(border)feature.border=border;
    if(knots)feature.knots=knots;
  }
  return normalizeSculptSurface({...surface,[kind]:[...surface[kind],feature]},registry);
}
function distanceToSegment(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length===0?0:Math.max(0,Math.min(1,
    ((point.x-a.x)*dx+(point.y-a.y)*dy)/length));
  return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);
}
export function removeSculptSurfaceAt(raw,point,registry=null){
  const surface=normalizeSculptSurface(raw,registry);
  let found=null;
  for(const kind of ['zones','routes']){
    for(const feature of surface[kind]){
      if(feature.brushShape==='square'
        ?squareSurfaceStrokeContainsPoint(feature.points,point.x,point.y,feature.width/2+7)
        :feature.points.some((p,i)=>i>0&&distanceToSegment(point,feature.points[i-1],p)<=feature.width/2+7))
        found={kind,id:feature.id};
    }
  }
  if(!found)return surface;
  return normalizeSculptSurface({...surface,
    [found.kind]:surface[found.kind].filter(f=>f.id!==found.id)},registry);
}

// One transaction per gesture; no partial edit on overflow.
export function eraseSculptSurfaceStroke(raw,{points,width,brushShape='round',kind='all'},registry=null){
  const surface=normalizeSculptSurface(raw,registry);
  if(!Number.isFinite(width)||width<=0||!Array.isArray(points)||!points.length)return surface;
  const ids=new Set([...surface.routes,...surface.zones].map(f=>f.id));
  let serial=1;
  const nextId=()=>{while(ids.has('sculpt-surface-'+serial))serial++;const id='sculpt-surface-'+serial++;ids.add(id);return id;};
  const result={...surface};
  for(const key of ['routes','zones']){
    if(kind!=='all'&&kind!==key)continue;
    result[key]=surface[key].flatMap(feature=>{
      const parts=eraseSurfaceStrokeParts(feature,points,width,brushShape);
      if(parts.length===1&&parts[0]===feature.points)return [feature];
      const {knots,...base}=feature;
      return parts.map((part,i)=>({...base,id:i===0?feature.id:nextId(),points:part}));
    });
  }
  if(result.routes.length+result.zones.length>SCULPT_SURFACE_LIMIT)
    throw Error('Gomme : limite de tracés atteinte, aucune modification appliquée.');
  return normalizeSculptSurface(result,registry);
}
export function editSculptRoute(raw,id,patch,registry=null){
  const surface=normalizeSculptSurface(raw,registry);
  return normalizeSculptSurface({...surface,routes:surface.routes.map(r=>r.id===id?{...r,...patch,id:r.id}:r)},registry);
}
