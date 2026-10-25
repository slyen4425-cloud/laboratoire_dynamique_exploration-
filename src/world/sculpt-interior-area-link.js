// V79 R1. SculptLab-only bridge to the canonical WorldArea/Portal contracts.
// NOT a second collision/portal engine and NOT a WorldDocument runtime save.
// Each interior keeps exactly ONE canonical SculptTerrain, distinct from exterior.
import {createSculptTerrain,importSculptTerrain,serializeSculptTerrain} from './sculpt-height-model.js';
import {normalizeWorldArea} from './world-area-model.js';
import {normalizePortal,portalReferencesAreValid,applyPortalTransition,
  findTriggeredPortal} from './portal-model.js';
import {resolveWorldObjectPlacements} from './world-object-placement-model.js';
import {createSculptSurface,normalizeSculptSurface} from './sculpt-surface-paint.js';
import {normalizeSculptPreviewObjects,normalizeSculptPreviewActors} from './sculpt-scene-preview.js';

export const SCULPT_EXTERIOR_AREA_ID='sculpt-exterior';
export const SCULPT_INTERIOR_SIZE=Object.freeze({width:18,height:14});
export const SCULPT_INTERIOR_LIMIT=64;
export const SCULPT_INTERIOR_TEMPLATE_LIMIT=32;
const frozen=items=>Object.freeze(items);

export function createSculptInteriorArea(building,exteriorObjects=[]){
  if(!building?.id||building.kind!=='building'||!building.doorAnchors?.length)return null;
  const id='sculpt-interior-'+building.id;
  const width=SCULPT_INTERIOR_SIZE.width,height=SCULPT_INTERIOR_SIZE.height;
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
    visual:{visible:true,marker:'exit',label:'Sortir',scale:.58}
  });
  if(!entrance||!exit||!portalReferencesAreValid([exterior,area],entrance)||
    !portalReferencesAreValid([exterior,area],exit))return null;
  return Object.freeze({
    buildingId:building.id,area,entryPortal:entrance,exitPortal:exit,
    terrain:createSculptTerrain({width,height}),
    objects:frozen([]),actors:frozen([]),surface:normalizeSculptSurface({baseMaterialId:'floor.wood.house'})
  });
}
// The physical doorway position is exactly exitPortal.trigger; the interior
// arrival Spawn is moved in the SAME WorldArea contract, offset into the room.
// The external facade entrance is still building-door object-anchor (unchanged).
export function updateSculptInteriorDoor(entry,{x,y,scale}={}){
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
    visual:{...entry.exitPortal.visual,scale:size}});
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
    buildingId:e.buildingId,area:e.area,entryPortal:e.entryPortal,exitPortal:e.exitPortal,
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
  for(const item of raw){
    const building=buildings.find(o=>o.kind==='building'&&o.id===item?.buildingId);
    if(!building||seen.has(building.id))
      throw Error('Intérieur 2,5D : bâtiment absent ou dupliqué');
    seen.add(building.id);
    const reference=createSculptInteriorArea(building,outsideObjects);
    if(!reference||item.area?.id!==reference.area.id||
      item.entryPortal?.id!==reference.entryPortal.id||
      item.exitPortal?.id!==reference.exitPortal.id)
      throw Error('Intérieur 2,5D : raccord Portal/Area invalide');
    const terrain=importSculptTerrain(item.terrain);
    if(terrain.width!==reference.terrain.width||terrain.height!==reference.terrain.height)
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
      door.x<26||door.x>reference.area.width-26||
      door.y<30||door.y>reference.area.height-17)
      throw Error('Intérieur 2,5D : position porte invalide');
    const scaled=item.exitPortal.visual?.scale??.58;
    if(!Number.isFinite(scaled)||scaled<.35||scaled>1.5)
      throw Error('Intérieur 2,5D : échelle porte invalide');
    const entry=updateSculptInteriorDoor(reference,{x:door.x,y:door.y,scale:scaled});
    result.push(updateSculptInterior(entry,{terrain,objects,actors,surface,
      area:normalizeWorldArea({...entry.area,walls:item.area?.walls??[]})}));
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
    if(terrain.width!==SCULPT_INTERIOR_SIZE.width||
      terrain.height!==SCULPT_INTERIOR_SIZE.height)
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
      surface:normalizeSculptSurface(item.surface)});
  }));
}
export function createSculptInteriorTemplate(entry,{id,name}={}){
  return normalizeSculptInteriorTemplates([{
    schemaVersion:1,id,name,terrain:JSON.parse(serializeSculptTerrain(entry.terrain)),
    objects:entry.objects,actors:entry.actors,surface:entry.surface,
    walls:entry.area.walls
  }])[0];
}
export function applySculptInteriorTemplate(entry,template){
  if(!entry?.area||entry.area.kind!=='interior')
    throw Error('Modèle : aucune pièce intérieure active');
  const valid=normalizeSculptInteriorTemplates([template])[0];
  // Import creates distinct data values; portal links stay attached to entry.
  return updateSculptInterior(entry,{
    terrain:importSculptTerrain(valid.terrain),objects:valid.objects,
    actors:valid.actors,surface:valid.surface,
    area:normalizeWorldArea({...entry.area,walls:valid.walls})
  });
}
export function sculptInteriorPortalDocument(outsideObjects,entries){
  const outdoor=normalizeWorldArea({
    id:SCULPT_EXTERIOR_AREA_ID,kind:'exterior',width:20000,height:20000,
    objects:outsideObjects,
    spawns:entries.map(e=>({id:'outside-'+e.buildingId,
      anchor:{kind:'building-door',objectId:e.buildingId,
        anchorId:e.entryPortal.trigger.anchorId,offset:56}}))
  });
  const areas=[outdoor,...entries.map(e=>normalizeWorldArea({...e.area,
    objects:e.objects,actors:e.actors}))];
  const portals=entries.flatMap(e=>[e.entryPortal,e.exitPortal]);
  // Explicit same authority as the existing Builder/WorldDocument.
  return Object.freeze({areas:frozen(areas),portals:frozen(portals)});
}
export function sculptInteriorTransition(outsideObjects,entries,currentAreaId,point){
  const document=sculptInteriorPortalDocument(outsideObjects,entries);
  const portal=findTriggeredPortal(document,currentAreaId,point);
  if(!portal)return null;
  return applyPortalTransition(document,{currentAreaId,x:point.x,y:point.y},portal);
}
