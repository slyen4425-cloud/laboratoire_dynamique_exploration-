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
export const SCULPT_INTERIOR_LIMIT=24;
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
    visual:{visible:true,marker:'exit',label:'Sortir'}
  });
  if(!entrance||!exit||!portalReferencesAreValid([exterior,area],entrance)||
    !portalReferencesAreValid([exterior,area],exit))return null;
  return Object.freeze({
    buildingId:building.id,area,entryPortal:entrance,exitPortal:exit,
    terrain:createSculptTerrain({width,height}),
    objects:frozen([]),actors:frozen([]),surface:createSculptSurface()
  });
}
export function updateSculptInterior(entry,{terrain=entry.terrain,
  objects=entry.objects,actors=entry.actors,surface=entry.surface}={}){
  return Object.freeze({...entry,terrain,objects,actors,surface});
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
    result.push(updateSculptInterior(reference,{terrain,objects,actors,surface}));
  }
  return frozen(result);
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
