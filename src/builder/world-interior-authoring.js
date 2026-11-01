// Canonical WorldBuilder room authoring. This is a pure command adapter:
// WorldDocument WorldArea + Portal + Spawn remain the ONLY persisted owners.
// Existing Sculpt room geometry and template rules are reused, not forked.
import {createWorldBuilderDraft,validateWorldBuilderDraft,addWorldArea,connectWorldAreas} from './world-builder-draft.js';
import {sculptWorldAreaScene} from './sculpt-world-area-link.js';
import {sculptInteriorShapeId,resizeSculptInterior} from '../world/sculpt-interior-layout.js';
import {updateSculptInteriorDoor,applySculptInteriorTemplate} from '../world/sculpt-interior-area-link.js';
import {normalizeWorldArea} from '../world/world-area-model.js';
import {normalizeSculptSurface} from '../world/sculpt-surface-paint.js';
import {circleFitsWorldAreaBoundary,findWorldAreaBoundarySafePoint} from '../world/world-area-geometry.js';
import {validInteriorConnectorAsset} from '../world/interior-material-catalog.js';

const area=(d,id)=>d?.areas?.find(a=>a.id===id)??null;
const source=(d,id)=>d?.portals?.filter(p=>p.sourceAreaId===id)??[];
const inbound=(d,id)=>d?.portals?.filter(p=>p.targetAreaId===id)??[];
function checked(d){
  const result=validateWorldBuilderDraft(d);
  if(!result.valid)throw Error('Intérieur WorldDocument invalide : '+result.errors.join(', '));
  return createWorldBuilderDraft(result.document);
}
function requireRoom(d,id){
  const found=area(d,id);
  if(found?.kind!=='interior')throw Error('Sélectionne une WorldArea intérieure');
  return found;
}
function groundRoot(d,roomId){
  for(const p of d.portals??[]){
    if(p.trigger?.kind!=='object-anchor'||area(d,p.sourceAreaId)?.kind!=='exterior')continue;
    if(p.targetAreaId===roomId)return p.targetAreaId;
    const visited=new Set([p.targetAreaId]);
    const queue=[p.targetAreaId];
    while(queue.length){
      const node=queue.shift();
      for(const exit of source(d,node).filter(x=>x.visual?.marker==='portal')){
        if(exit.targetAreaId===roomId)return p.targetAreaId;
        if(area(d,exit.targetAreaId)?.kind==='interior'&&!visited.has(exit.targetAreaId)){
          visited.add(exit.targetAreaId);queue.push(exit.targetAreaId);
        }
      }
    }
  }
  return null;
}
export function worldInteriorFloors(d,roomId){
  requireRoom(d,roomId);
  const root=groundRoot(d,roomId);
  if(!root)return Object.freeze([roomId]);
  const floors=[root],seen=new Set(floors);
  while(true){
    const current=floors.at(-1);
    const next=source(d,current).find(p=>p.visual?.marker==='portal'&&
      area(d,p.targetAreaId)?.kind==='interior'&&!seen.has(p.targetAreaId)&&
      source(d,p.targetAreaId).some(back=>back.visual?.marker==='portal'&&back.targetAreaId===current));
    if(!next)break;
    floors.push(next.targetAreaId);seen.add(next.targetAreaId);
  }
  return Object.freeze(floors);
}
export function worldInteriorDoorPortal(d,roomId){
  const room=requireRoom(d,roomId);
  // Only the ground-floor doorway returns to the exterior anchored house.
  const entry=inbound(d,room.id).find(p=>p.trigger?.kind==='object-anchor'&&
    area(d,p.sourceAreaId)?.kind==='exterior');
  return entry?source(d,room.id).find(p=>p.targetAreaId===entry.sourceAreaId&&
    p.trigger?.kind==='point')??null:null;
}
export function worldInteriorAdapter(d,roomId){
  const room=requireRoom(d,roomId);
  const scene=sculptWorldAreaScene(room);
  const exitPortal=worldInteriorDoorPortal(d,roomId);
  const entryPortal=inbound(d,roomId).find(p=>p.trigger?.kind==='object-anchor')??null;
  // A borrowed view of the *same* canonical area for existing geometry
  // commands; it is never placed in sculptInteriors or persisted separately.
  const {sculptTerrain:unused,...geometry}=normalizeWorldArea(room);
  return Object.freeze({area:geometry,terrain:scene.terrain,
    objects:scene.objects,actors:scene.actors,surface:scene.surface,
    buildingId:entryPortal?.trigger.objectId??roomId,
    floorIndex:worldInteriorFloors(d,roomId).indexOf(roomId),
    entryPortal,exitPortal});
}
function replaceArea(d,id,patch){
  return {...d,areas:d.areas.map(a=>a.id===id?{...a,...patch}:a)};
}
function replacePortal(d,id,patch){
  return {...d,portals:d.portals.map(p=>p.id===id?{...p,...patch}:p)};
}
function canonicalScenePatch(updated){
  return {width:updated.area.width,height:updated.area.height,
    boundary:updated.area.boundary,walls:updated.area.walls,
    wallMaterialId:updated.area.wallMaterialId,
    spawns:updated.area.spawns,objects:updated.objects,actors:updated.actors,
    surface:updated.surface,sculptTerrain:updated.terrain};
}
function requireNoOtherLinks(d,id){
  const door=worldInteriorDoorPortal(d,id);
  if(!door)throw Error('Édition de la porte/forme : ouvre le rez-de-chaussée lié à une maison');
  if(source(d,id).some(p=>p.id!==door.id)||inbound(d,id).some(p=>p.trigger?.kind!=='object-anchor'))
    throw Error('Dimensions/modèle bloqués : étage ou autre Portal connecté à cette pièce');
  return door;
}
export function resizeWorldInterior(d,id,{width,height,shape}={}){
  const room=requireRoom(d,id),door=requireNoOtherLinks(d,id);
  const adapter=worldInteriorAdapter(d,id);
  const changed=resizeSculptInterior(adapter,{width,height,shape});
  if(!circleFitsWorldAreaBoundary(changed.area,changed.exitPortal.trigger.x,
    changed.exitPortal.trigger.y,10))
    throw Error('Nouvelle forme incompatible avec la porte : déplace la porte avant de modifier la pièce');
  const sx=changed.terrain.width/adapter.terrain.width,
        sy=changed.terrain.height/adapter.terrain.height;
  // Preserve the WorldSurface's existing route/zone IDs, materials and family
  // semantics while resizing their authored geometry. No new paint authority.
  const scaleStroke=(stroke)=>{
    const strokeWidth=stroke.width*Math.sqrt(sx*sy);
    if(strokeWidth<6||strokeWidth>480)throw Error(
      'Dimensions incompatibles avec la largeur des zones peintes (6–480)');
    return {...stroke,width:strokeWidth,
      points:stroke.points.map(p=>({
        x:Math.min(changed.area.width-.01,p.x*sx),
        y:Math.min(changed.area.height-.01,p.y*sy)}))};
  };
  const surface=(sx===1&&sy===1)?adapter.surface:normalizeSculptSurface({
    ...adapter.surface,
    routes:adapter.surface.routes.map(scaleStroke),
    zones:adapter.surface.zones.map(scaleStroke)
  });
  let next=replaceArea(d,id,{...canonicalScenePatch(changed),surface});
  next=replacePortal(next,door.id,{trigger:changed.exitPortal.trigger,
    visual:changed.exitPortal.visual});
  return checked(next);
}
export function editWorldInteriorDoor(d,id,{x,y,scale,assetId}={}){
  const door=worldInteriorDoorPortal(d,id);
  if(!door)throw Error('Porte extérieure de cette maison introuvable');
  const room=requireRoom(d,id);
  const adapter=worldInteriorAdapter(d,id);
  const changed=updateSculptInteriorDoor(adapter,{x,y,scale,assetId});
  const entry=inbound(d,id).find(p=>p.trigger?.kind==='object-anchor');
  if(!entry)throw Error('Entrée de maison introuvable');
  const atX=changed.exitPortal.trigger.x,atY=changed.exitPortal.trigger.y;
  // The Portal trigger is the actual visible exit, not merely a drawing.
  // A cut-out of an L/T/cross room must never leave its door unreachable.
  if(!circleFitsWorldAreaBoundary(room,atX,atY,10))
    throw Error('Porte hors du plancher : choisis un point accessible dans la forme');
  const arrival={x:atX,y:Math.max(12,atY-(door.trigger.radius??28)-18)};
  const safe=findWorldAreaBoundarySafePoint(room,arrival,18);
  if(!safe)throw Error('Porte hors sol : déplace-la sur le plancher réel');
  let next=replaceArea(d,id,{spawns:room.spawns.map(spawn=>
    spawn.id===entry.targetSpawnId?{...spawn,x:safe.x,y:safe.y}:spawn)});
  next=replacePortal(next,door.id,{trigger:changed.exitPortal.trigger,
    visual:changed.exitPortal.visual});
  return checked(next);
}
export function applyWorldInteriorTemplate(d,id,template){
  const door=requireNoOtherLinks(d,id),room=requireRoom(d,id);
  const updated=applySculptInteriorTemplate(worldInteriorAdapter(d,id),template);
  const entry=inbound(d,id).find(p=>p.trigger?.kind==='object-anchor');
  if(!entry)throw Error('Entrée de maison introuvable');
  const at=updated.exitPortal.trigger;
  const targetBoundary={...room,...canonicalScenePatch(updated)};
  if(!circleFitsWorldAreaBoundary(targetBoundary,at.x,at.y,10))
    throw Error('Modèle incompatible : sa porte se situe hors du plancher');
  const newSpawn={x:at.x,y:Math.max(12,at.y-(door.trigger.radius??28)-18)};
  const target={...room,...canonicalScenePatch(updated)};
  const safe=findWorldAreaBoundarySafePoint(target,newSpawn,18);
  if(!safe)throw Error('Modèle incompatible avec la porte de cette maison');
  const spawns=target.spawns.map(p=>p.id===entry.targetSpawnId?
    {...p,x:safe.x,y:safe.y}:p);
  let next=replaceArea(d,id,{...canonicalScenePatch(updated),spawns});
  next=replacePortal(next,door.id,{trigger:updated.exitPortal.trigger,
    visual:updated.exitPortal.visual});
  return checked(next);
}
export function addWorldInteriorFloor(d,roomId){
  requireRoom(d,roomId);
  const floors=worldInteriorFloors(d,roomId),previous=floors.at(-1);
  if(floors.length>=4)throw Error('Maison limitée à quatre étages');
  if(d.areas.length>=64)throw Error('Limite des WorldAreas atteinte');
  const parent=area(d,previous),index=floors.length;
  let next=addWorldArea(d,{name:(parent.label??'Maison')+' étage '+index,
    kind:'interior',width:parent.width,height:parent.height});
  const upper=next.areas.at(-1);
  if(upper.id===previous)throw Error('Étage non créé');
  // Connect using the EXISTING WorldBuilder Portal constructor and IDs.
  next=connectWorldAreas(next,{sourceAreaId:previous,targetAreaId:upper.id,returnPortal:true});
  // The lower floor can already have a descending stair at its center.
  // Ascending stairs use a second reachable location so the first matching
  // Portal does not shadow access to floor 3 or 4.
  const ascent={kind:'point',x:Math.round(parent.width*.25),
    y:Math.round(parent.height*.48),radius:27};
  const descent={kind:'point',x:Math.round(parent.width*.5),
    y:Math.round(parent.height*.52),radius:27};
  const up=next.portals.find(p=>p.sourceAreaId===previous&&p.targetAreaId===upper.id);
  const down=next.portals.find(p=>p.sourceAreaId===upper.id&&p.targetAreaId===previous);
  if(!up||!down)throw Error('Escalier : Portals canoniques non créés');
  const stairs={visible:true,marker:'portal',assetId:'stairs.wood'};
  next=replacePortal(next,up.id,{trigger:ascent,
    visual:{...stairs,label:'Monter à l’étage '+index}});
  next=replacePortal(next,down.id,{trigger:descent,visual:{
    ...stairs,label:'Descendre à l’étage '+(index-1)}});
  // The actual Spawn is the only authority for the arrival.
  next=replaceArea(next,upper.id,{siteKind:'building',
    spawns:upper.spawns.map(sp=>sp.id===up.targetSpawnId?{...sp,x:descent.x,y:descent.y}:sp)});
  // The existing entry Spawn on the lower floor belongs to its own Portal.
  // Connecting a staircase must NEVER steal/move it (particularly the
  // exterior house entrance). The stairs have their own dedicated Spawn.
  let landingId='stairs-arrival-from-'+index;
  let serial=2;
  while(parent.spawns.some(sp=>sp.id===landingId))landingId='stairs-arrival-from-'+index+'-'+serial++;
  next=replaceArea(next,previous,{spawns:[...parent.spawns,{
    id:landingId,x:ascent.x,y:Math.min(parent.height-18,ascent.y+36)}]});
  next=replacePortal(next,down.id,{targetSpawnId:landingId});
  const document=checked(next);
  return Object.freeze({document,areaId:upper.id});
}
export function editWorldInteriorConnector(d,portalId,{x,y,assetId,rotationDeg}={}){
  const portal=d.portals.find(p=>p.id===portalId);
  if(!portal||portal.visual?.marker!=='portal'||portal.trigger?.kind!=='point'||
     area(d,portal.sourceAreaId)?.kind!=='interior')
    throw Error('Sélectionne un escalier/échelle lié aux WorldAreas');
  const from=requireRoom(d,portal.sourceAreaId),to=requireRoom(d,portal.targetAreaId);
  if(!validInteriorConnectorAsset(assetId))throw Error('Modèle d’escalier/échelle invalide');
  if(!Number.isFinite(x)||!Number.isFinite(y)||!circleFitsWorldAreaBoundary(from,x,y,12))
    throw Error('Place le passage sur le plancher réel');
  let next=replacePortal(d,portal.id,{
    trigger:{...portal.trigger,x,y},
    visual:{...portal.visual,assetId,...(Number.isFinite(rotationDeg)?{rotationDeg}: {})}
  });
  if(circleFitsWorldAreaBoundary(to,x,y,12)){
    next=replaceArea(next,to.id,{spawns:to.spawns.map(sp=>sp.id===portal.targetSpawnId?
      {...sp,x,y}:sp)});
  }
  return checked(next);
}
