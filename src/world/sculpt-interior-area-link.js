// V79 R1. SculptLab-only bridge to the canonical WorldArea/Portal contracts.
// NOT a second collision/portal engine and NOT a WorldDocument runtime save.
// Each interior keeps exactly ONE canonical SculptTerrain, distinct from exterior.
import {createSculptTerrain,importSculptTerrain,serializeSculptTerrain} from './sculpt-height-model.js';
import {normalizeWorldArea} from './world-area-model.js?rev=interior-r3c-wall-materials';
import {pointInWorldAreaBoundary,circleFitsWorldAreaBoundary} from './world-area-geometry.js';
import {validInteriorDoorAsset,validInteriorConnectorAsset} from './interior-material-catalog.js';
import {normalizePortal,portalReferencesAreValid,applyPortalTransition,
  findTriggeredPortal} from './portal-model.js?rev=interior-r3c-visual-asset';
import {resolveWorldObjectPlacements} from './world-object-placement-model.js';
import {createSculptSurface,normalizeSculptSurface} from './sculpt-surface-paint.js';
import {normalizeSculptPreviewObjects,normalizeSculptPreviewActors} from './sculpt-scene-preview.js';

export const SCULPT_EXTERIOR_AREA_ID='sculpt-exterior';
export const SCULPT_INTERIOR_SIZE=Object.freeze({width:18,height:14});
export const SCULPT_INTERIOR_LIMIT=64;
export const SCULPT_INTERIOR_TEMPLATE_LIMIT=32;
export const SCULPT_INTERIOR_FLOOR_LIMIT=4;
const frozen=items=>Object.freeze(items);

export function createSculptInteriorArea(building,exteriorObjects=[],{width=18,height=14}={}){
  if(!building?.id||building.kind!=='building'||!building.doorAnchors?.length)return null;
  const id='sculpt-interior-'+building.id;
  if(!Number.isInteger(width)||width<8||width>80||!Number.isInteger(height)||height<8||height>64)
    throw Error('Dimensions d’intérieur invalides');
  const spawnX=(width*.5)*28,spawnY=(height-3)*21;
  const area=normalizeWorldArea({
    id,kind:'interior',width:width*28,height:height*21,
    spawns:[{id:'entrance',x:spawnX,y:spawnY}],
    objects:[],encounters:{randomEnabled:false}
  });
  const exterior=normalizeWorldArea({
    id:SCULPT_EXTERIOR_AREA_ID,kind:'exterior',width:20000,height:20000,
    objects:exteriorObjects,
    spawns:[{id:'outside-'+building.id,anchor:{
      kind:'building-door',objectId:building.id,
      anchorId:building.doorAnchors[0].id,offset:56}}]
  });
  const entrance=normalizePortal({
    id:'sculpt-enter-'+building.id,sourceAreaId:exterior.id,
    trigger:{kind:'object-anchor',objectId:building.id,
      anchorId:building.doorAnchors[0].id,radius:52},
    targetAreaId:id,targetSpawnId:'entrance',
    visual:{visible:true,marker:'entry',label:'Entrer'}
  });
  const exit=normalizePortal({
    id:'sculpt-leave-'+building.id,sourceAreaId:id,
    trigger:{kind:'point',x:spawnX,y:(height-1.5)*21,radius:32},
    targetAreaId:exterior.id,targetSpawnId:'outside-'+building.id,
    visual:{visible:true,marker:'exit',label:'Sortir',scale:.58,assetId:'default'}
  });
  if(!entrance||!exit||!portalReferencesAreValid([exterior,area],entrance)||
    !portalReferencesAreValid([exterior,area],exit))return null;
  return Object.freeze({
    buildingId:building.id,floorIndex:0,area,entryPortal:entrance,exitPortal:exit,
    terrain:createSculptTerrain({width,height}),
    objects:frozen([]),actors:frozen([]),surface:normalizeSculptSurface({baseMaterialId:'floor.wood.house'})
  });
}
// Upper levels are independent WorldAreas, not relief cells or additional
// player coordinates in the same Area. All transitions remain canonical Portals.
export function createSculptUpperFloor(below){
  if(!below?.area||below.area.kind!=='interior'||
      !Number.isInteger(below.floorIndex)||below.floorIndex<0||
      below.floorIndex>=SCULPT_INTERIOR_FLOOR_LIMIT-1)
    throw Error('Étage : nombre maximal atteint');
  const floorIndex=below.floorIndex+1;
  const width=below.terrain.width,height=below.terrain.height;
  const w=width*28,h=height*21;
  const upPoint={kind:'point',x:w*.5,y:h*.52,radius:27};
  const downPoint={kind:'point',x:w*.5,y:h*.52,radius:27};
  const areaId='sculpt-interior-'+below.buildingId+'-floor-'+floorIndex;
  const belowSpawn={id:'arrival-down',x:Math.max(16,w*.5-44),
    y:Math.min(h-16,h*.52+45)};
  const updatedBelow=Object.freeze({...below,area:normalizeWorldArea({...below.area,
    spawns:[...below.area.spawns.filter(spawn=>spawn.id!=='arrival-down'),belowSpawn]})});
  const upSpawn={id:'arrival-up',x:Math.max(16,w*.5-44),
    y:Math.min(h-16,h*.52+45)};
  const area=normalizeWorldArea({id:areaId,kind:'interior',width:w,height:h,
    boundary:below.area.boundary,spawns:[upSpawn],
    encounters:{randomEnabled:false}});
  const entryPortal=normalizePortal({
    id:'sculpt-stairs-up-'+below.buildingId+'-'+floorIndex,
    sourceAreaId:below.area.id,trigger:upPoint,
    targetAreaId:areaId,targetSpawnId:'arrival-up',
    visual:{visible:true,marker:'portal',label:'Monter à l’étage '+floorIndex,assetId:'stairs.wood'}
  });
  const exitPortal=normalizePortal({
    id:'sculpt-stairs-down-'+below.buildingId+'-'+floorIndex,
    sourceAreaId:areaId,trigger:downPoint,
    targetAreaId:below.area.id,targetSpawnId:'arrival-down',
    visual:{visible:true,marker:'portal',label:'Descendre à l’étage '+(floorIndex-1),assetId:'stairs.wood'}
  });
  if(!entryPortal||!exitPortal||
     !portalReferencesAreValid([updatedBelow.area,area],entryPortal)||
     !portalReferencesAreValid([updatedBelow.area,area],exitPortal))
    throw Error('Étage : liaison WorldArea/Portal invalide');
  return Object.freeze({below:updatedBelow,upper:Object.freeze({
    buildingId:below.buildingId,floorIndex,area,entryPortal,exitPortal,
    terrain:createSculptTerrain({width,height}),objects:frozen([]),actors:frozen([]),
    surface:normalizeSculptSurface({baseMaterialId:below.surface.baseMaterialId})
  })});
}
// Placed stair or ladder: the source Portal owns the interaction position,
// the target WorldArea Spawn owns the arrival position. No extra prop objects.
export function updateSculptFloorConnector(entries,{sourceAreaId,portalId,x,y,assetId,rotationDeg}={}){
  if(!Array.isArray(entries)||!validInteriorConnectorAsset(assetId))
    throw Error('Escalier/échelle : modèle invalide');
  const source=entries.find(e=>e.area.id===sourceAreaId);
  if(!source)throw Error('Escalier/échelle : étage absent');
  // Find exactly one Portal sourced by this level and targeting an adjacent level.
  const links=entries.flatMap(e=>[e.entryPortal,e.exitPortal]);
  const portal=links.find(p=>p.id===portalId&&p.sourceAreaId===sourceAreaId&&
    p.visual.marker==='portal');
  if(!portal)throw Error('Ajoute un étage pour placer un escalier');
  if(!Number.isFinite(x)||!Number.isFinite(y)||
    !circleFitsWorldAreaBoundary(source.area,x,y,12))
    throw Error('Place l’escalier sur le sol réel de cet étage');
  const target=entries.find(e=>e.area.id===portal.targetAreaId);
  if(!target)throw Error('Étage cible absent');
  const updatedPortal=normalizePortal({...portal,
    trigger:{kind:'point',x,y,radius:27},
    visual:{...portal.visual,assetId,
      ...(Number.isFinite(rotationDeg)?{rotationDeg}: {})}});
  // The arrival uses the existing Spawn ID. On different-sized or L-shaped
  // floors, retain the target's valid existing spawn instead of teleporting
  // beyond its boundary.
  const arrival=target.area.spawns.find(p=>p.id===portal.targetSpawnId);
  if(!arrival)throw Error('Point d’arrivée manquant');
  let arrivals=target.area.spawns;
  if(circleFitsWorldAreaBoundary(target.area,x,y,12)){
    arrivals=target.area.spawns.map(p=>p.id===arrival.id?
      {...p,x,y}:p);
  }
  return Object.freeze(entries.map(entry=>{
    const area=entry.area.id===target.area.id?
      normalizeWorldArea({...entry.area,spawns:arrivals}):entry.area;
    const entryPortal=entry.entryPortal.id===portal.id?updatedPortal:entry.entryPortal;
    const exitPortal=entry.exitPortal.id===portal.id?updatedPortal:entry.exitPortal;
    return entry.area.id===target.area.id||
      entryPortal!==entry.entryPortal||exitPortal!==entry.exitPortal?
        Object.freeze({...entry,area,entryPortal,exitPortal}):entry;
  }));
}
// The physical doorway position is exactly exitPortal.trigger; the interior
// arrival Spawn is moved in the SAME WorldArea contract, offset into the room.
// The external facade entrance is still building-door object-anchor (unchanged).
export function updateSculptInteriorDoor(entry,{x,y,scale,assetId}={}){
  if(!entry?.area||entry.area.kind!=='interior')throw Error('Porte : intérieur absent');
  const previous=entry.exitPortal.trigger;
  const width=entry.area.width,height=entry.area.height;
  const bounded=(n,fallback,min,max)=>Number.isFinite(n)?
    Math.max(min,Math.min(max,n)):fallback;
  const atX=bounded(x,previous.x,26,width-26);
  const atY=bounded(y,previous.y,30,height-17);
  const size=bounded(scale,entry.exitPortal.visual.scale??.58,.35,1.5);
  const exitPortal=normalizePortal({...entry.exitPortal,
    trigger:{...previous,x:atX,y:atY},
    visual:{...entry.exitPortal.visual,scale:size,
      assetId:validInteriorDoorAsset(assetId)?assetId:(entry.exitPortal.visual.assetId??'default')}});
  // Never spawn directly inside the exit trigger: entrance should have room
  // to walk, and the canonical source trigger remains the visible door.
  const spawnY=Math.max(12,atY-(previous.radius??32)-18);
  const area=normalizeWorldArea({...entry.area,
    spawns:entry.area.spawns.map(spawn=>spawn.id==='entrance'?
      {...spawn,x:atX,y:spawnY}:spawn)});
  return Object.freeze({...entry,exitPortal,area});
}
export function updateSculptInterior(entry,{terrain=entry.terrain,
  objects=entry.objects,actors=entry.actors,surface=entry.surface,area=entry.area}={}){
  return Object.freeze({...entry,terrain,objects,actors,surface,area});
}
export function serializeSculptInteriors(entries=[]){
  return frozen(entries.map(e=>Object.freeze({
    buildingId:e.buildingId,floorIndex:e.floorIndex??0,
    area:e.area,entryPortal:e.entryPortal,exitPortal:e.exitPortal,
    terrain:JSON.parse(serializeSculptTerrain(e.terrain)),
    objects:e.objects,actors:e.actors,surface:e.surface
  })));
}
export function importSculptInteriors(raw=[],outsideObjects=[]){
  if(!Array.isArray(raw)||raw.length>SCULPT_INTERIOR_LIMIT)
    throw Error('Intérieurs 2,5D : liste invalide');
  const seen=new Set();
  const buildings=resolveWorldObjectPlacements(outsideObjects);
  const result=[];
  for(const item of [...raw].sort((a,b)=>(a?.floorIndex??0)-(b?.floorIndex??0))){
    const building=buildings.find(o=>o.kind==='building'&&o.id===item?.buildingId);
    const floorIndex=item.floorIndex??0;
    const key=item?.buildingId+':'+floorIndex;
    if(!building||!Number.isInteger(floorIndex)||floorIndex<0||
       floorIndex>=SCULPT_INTERIOR_FLOOR_LIMIT||seen.has(key))
      throw Error('Intérieur 2,5D : bâtiment absent ou dupliqué, étage absent ou dupliqué');
    seen.add(key);
    let reference;
    if(floorIndex===0)reference=createSculptInteriorArea(building,outsideObjects);
    else{
      const parent=result.find(e=>e.buildingId===building.id&&e.floorIndex===floorIndex-1);
      if(!parent)throw Error('Étage sans niveau précédent');
      const linked=createSculptUpperFloor(parent);
      const index=result.indexOf(parent);
      result[index]=Object.freeze({...linked.below,
        area:normalizeWorldArea({...linked.below.area,
          spawns:parent.area.spawns.some(x=>x.id==='arrival-down')?
            parent.area.spawns:linked.below.area.spawns})});
      reference=linked.upper;
    }
    if(!reference||item.area?.id!==reference.area.id||
      item.entryPortal?.id!==reference.entryPortal.id||
      item.exitPortal?.id!==reference.exitPortal.id||
      item.entryPortal?.sourceAreaId!==reference.entryPortal.sourceAreaId||
      item.entryPortal?.targetAreaId!==reference.entryPortal.targetAreaId||
      item.exitPortal?.targetAreaId!==reference.exitPortal.targetAreaId)
      throw Error('Intérieur 2,5D : raccord Portal/Area invalide');
    const terrain=importSculptTerrain(item.terrain);
    if(terrain.width*28!==item.area?.width||terrain.height*21!==item.area?.height)
      throw Error('Intérieur 2,5D : dimensions du sol incohérentes');
    // Reconstruct canonical links FROM the current building anchor, never
    // trust stale saved door positions after building rotation or movement.
    const objects=normalizeSculptPreviewObjects(item.objects??[]);
    const actors=normalizeSculptPreviewActors(item.actors??[]);
    if(objects.some(o=>o.transform.x<0||o.transform.y<0||
       o.transform.x>=terrain.width*28||o.transform.y>=terrain.height*21))
      throw Error('Intérieur 2,5D : objet hors pièce');
    const surface=normalizeSculptSurface(item.surface);
    const door=item.exitPortal?.trigger;
    if(door?.kind!=='point'||!Number.isFinite(door.x)||!Number.isFinite(door.y)||
      door.x<26||door.x>terrain.width*28-26||
      door.y<30||door.y>terrain.height*21-17)
      throw Error('Intérieur 2,5D : position porte invalide');
    const scaled=item.exitPortal.visual?.scale??.58;
    if(!Number.isFinite(scaled)||scaled<.35||scaled>1.5)
      throw Error('Intérieur 2,5D : échelle porte invalide');
    const resized=normalizeWorldArea({...reference.area,width:terrain.width*28,
      height:terrain.height*21,boundary:item.area?.boundary??{kind:'rectangle'},
      walls:item.area?.walls??[],spawns:item.area?.spawns??reference.area.spawns,
      wallMaterialId:item.area?.wallMaterialId});
    const entry=floorIndex===0?
      updateSculptInteriorDoor({...reference,area:resized},
        {x:door.x,y:door.y,scale:scaled,assetId:item.exitPortal.visual?.assetId}):
      Object.freeze({...reference,area:resized,
        entryPortal:normalizePortal({...reference.entryPortal,
          trigger:item.entryPortal.trigger,visual:item.entryPortal.visual}),
        exitPortal:normalizePortal({...reference.exitPortal,
          trigger:item.exitPortal.trigger,visual:item.exitPortal.visual})});
    result.push(updateSculptInterior(entry,{terrain,objects,actors,surface,
      area:entry.area}));
  }
  return frozen(result);
}
// Reusable content only: never copy building IDs, Area IDs, Portals or Spawns.
// A template is explicitly applied to a new canonical building-linked interior.
export function normalizeSculptInteriorTemplates(raw=[]){
  if(!Array.isArray(raw)||raw.length>SCULPT_INTERIOR_TEMPLATE_LIMIT)
    throw Error('Modèles d’intérieur : liste invalide');
  const ids=new Set();
  return frozen(raw.map(item=>{
    if(!item||item.schemaVersion!==1||('area' in item)||('entryPortal' in item)||
      ('exitPortal' in item)||('buildingId' in item)||typeof item.id!=='string'||
      !/^interior-template-[a-z0-9-]{1,48}$/.test(item.id)||
      ids.has(item.id)||typeof item.name!=='string'||
      !item.name.trim()||item.name.length>64)
      throw Error('Modèles d’intérieur : identifiant, nom ou version invalide');
    ids.add(item.id);
    const terrain=importSculptTerrain(item.terrain);
    if(terrain.width<8||terrain.width>80||terrain.height<8||terrain.height>64)
      throw Error('Modèles d’intérieur : dimensions incompatibles');
    const objects=normalizeSculptPreviewObjects(item.objects??[]);
    const actors=normalizeSculptPreviewActors(item.actors??[]);
    if(objects.length!==(item.objects??[]).length||
      actors.length!==(item.actors??[]).length||
      objects.some(o=>o.transform.x<0||o.transform.y<0||
        o.transform.x>=terrain.width*28||o.transform.y>=terrain.height*21))
      throw Error('Modèles d’intérieur : contenu invalide');
    return Object.freeze({schemaVersion:1,id:item.id,name:item.name.trim(),
      terrain:JSON.parse(serializeSculptTerrain(terrain)),objects,actors,
      walls:normalizeWorldArea({kind:'interior',walls:item.walls??[]}).walls,
      boundary:normalizeWorldArea({kind:'interior',boundary:item.boundary}).boundary,
      wallMaterialId:normalizeWorldArea({kind:'interior',wallMaterialId:item.wallMaterialId}).wallMaterialId,
      surface:normalizeSculptSurface(item.surface)});
  }));
}
export function createSculptInteriorTemplate(entry,{id,name}={}){
  return normalizeSculptInteriorTemplates([{
    schemaVersion:1,id,name,terrain:JSON.parse(serializeSculptTerrain(entry.terrain)),
    objects:entry.objects,actors:entry.actors,surface:entry.surface,
    walls:entry.area.walls,boundary:entry.area.boundary,
    wallMaterialId:entry.area.wallMaterialId
  }])[0];
}
export function applySculptInteriorTemplate(entry,template){
  if(!entry?.area||entry.area.kind!=='interior')
    throw Error('Modèle : aucune pièce intérieure active');
  const valid=normalizeSculptInteriorTemplates([template])[0];
  // Import creates distinct data values; portal links stay attached to entry.
  const source=importSculptTerrain(valid.terrain);
  const area=normalizeWorldArea({...entry.area,width:source.width*28,
    height:source.height*21,walls:valid.walls,boundary:valid.boundary,
    wallMaterialId:valid.wallMaterialId});
  const transformed=updateSculptInteriorDoor({...entry,area,terrain:source},
    {x:source.width*14,y:source.height*21-32});
  return updateSculptInterior(transformed,{
    terrain:source,objects:valid.objects,
    actors:valid.actors,surface:valid.surface,area:transformed.area
  });
}
export function sculptInteriorPortalDocument(outsideObjects,entries){
  const outdoor=normalizeWorldArea({
    id:SCULPT_EXTERIOR_AREA_ID,kind:'exterior',width:20000,height:20000,
    objects:outsideObjects,
    spawns:entries.filter(e=>(e.floorIndex??0)===0).map(e=>({id:'outside-'+e.buildingId,
      anchor:{kind:'building-door',objectId:e.buildingId,
        anchorId:e.entryPortal.trigger.anchorId,offset:56}}))
  });
  const areas=[outdoor,...entries.map(e=>normalizeWorldArea({...e.area,
    objects:e.objects,actors:e.actors}))];
  const portals=entries.flatMap(e=>[e.entryPortal,e.exitPortal]);
  // Explicit same authority as the existing Builder/WorldDocument.
  return Object.freeze({areas:frozen(areas),portals:frozen(portals)});
}
export function sculptInteriorAvailablePortal(outsideObjects,entries,currentAreaId,point){
  const document=sculptInteriorPortalDocument(outsideObjects,entries);
  return findTriggeredPortal(document,currentAreaId,point);
}
export function sculptInteriorTransition(outsideObjects,entries,currentAreaId,point){
  const document=sculptInteriorPortalDocument(outsideObjects,entries);
  const portal=findTriggeredPortal(document,currentAreaId,point);
  if(!portal)return null;
  return applyPortalTransition(document,{currentAreaId,x:point.x,y:point.y},portal);
}
