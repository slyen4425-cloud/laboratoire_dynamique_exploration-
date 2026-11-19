// One-way authoring adapter: WorldDocument v3 is the only saved authority.
// Native SculptTerrain is WorldArea.sculptTerrain, while paint/objects/actors
// already belong to the exact canonical WorldArea.surface/objects/actors.
// No independent "sculpt scene" or duplicate Portal graph is persisted.
import {createSculptTerrain,importSculptTerrain,serializeSculptTerrain} from '../world/sculpt-height-model.js';
import {normalizeSculptSurface} from '../world/sculpt-surface-paint.js';
import {normalizeSculptDecorativeFringeV1} from '../world/sculpt-decorative-fringe-v1.js';
import {normalizeSculptPreviewObjects,normalizeSculptPreviewActors} from '../world/sculpt-scene-preview.js';
import {updatePortal,updateSpawn,addSpawn,createWorldBuilderDraft,
  createBuildingInteriorLink,validateWorldBuilderDraft} from './world-builder-draft.js';
import {resolveWorldAreaSpawnPoint} from '../world/world-area-model.js';

export const SCULPT_WORLD_TILE=Object.freeze({width:28,height:21});
export const SCULPT_WORLD_LIMIT=Object.freeze({width:80,height:64});

function areaById(draft,id){
  const area=draft?.areas?.find(a=>a.id===id);
  if(!area)throw Error('WorldArea absente du monde');
  return area;
}
function gridForArea(area){
  const width=area.width/SCULPT_WORLD_TILE.width;
  const height=area.height/SCULPT_WORLD_TILE.height;
  if(!Number.isInteger(width)||!Number.isInteger(height)||
     width<8||height<8||width>SCULPT_WORLD_LIMIT.width||
     height>SCULPT_WORLD_LIMIT.height)
    throw Error('Zone hors des dimensions prises en charge par le terrain 2,5D ('+
      'actuellement 8–80 × 8–64 cases). Le WorldDocument conserve sa vraie taille : '+
      area.width+' × '+area.height+'. Aucune réduction automatique.');
  return {width,height};
}
export function sculptWorldAreaScene(area){
  if(!area)throw Error('WorldArea requise');
  const grid=gridForArea(area);
  const terrain=area.sculptTerrain
    ?importSculptTerrain(area.sculptTerrain)
    :createSculptTerrain(grid);
  if(terrain.width!==grid.width||terrain.height!==grid.height)
    throw Error('Dimensions 2,5D de la WorldArea incohérentes');
  const objects=normalizeSculptPreviewObjects(area.objects??[]);
  const actors=normalizeSculptPreviewActors(area.actors??[]);
  if(objects.length!==(area.objects??[]).length||
     actors.length!==(area.actors??[]).length)
    throw Error('Objets/acteurs incompatibles avec le laboratoire 2,5D : '+
      'ouverture refusée sans effacer les données du WorldDocument');
  return Object.freeze({
    terrain,objects,actors,surface:normalizeSculptSurface(area.surface),
    ...(area.decorativeFringe?{decorativeFringe:
      normalizeSculptDecorativeFringeV1(area.decorativeFringe,area)}:{})
  });
}
// Read-only recovery snapshot of the SAME WorldDocument. If a Portal/Spawn
// reference makes final validation fail, the author can download ALL current
// edits without changing persistent storage or silently deleting links.
// The sole canonical save still goes through validateWorldBuilderDraft.
export function snapshotSculptWorldAreaForRecovery(draft,areaId,scene){
  const area=areaById(draft,areaId),grid=gridForArea(area);
  const terrain=importSculptTerrain(scene?.terrain);
  if(terrain.width!==grid.width||terrain.height!==grid.height)
    throw Error('Dimensions : le relief 2,5D ne peut pas redimensionner la WorldArea sans migration explicite');
  const surface=normalizeSculptSurface(scene.surface);
  const objects=normalizeSculptPreviewObjects(scene.objects??[]);
  const actors=normalizeSculptPreviewActors(scene.actors??[]);
  if(objects.length!==(scene.objects??[]).length||actors.length!==(scene.actors??[]).length)
    throw Error('Objets/acteurs de la WorldArea invalides, sauvegarde bloquée');
  const next={...draft,areas:draft.areas.map(a=>a.id===areaId?{
    ...a,
    sculptTerrain:JSON.parse(serializeSculptTerrain(terrain)),
    surface,objects,actors,
    ...(scene.decorativeFringe!==undefined?{
      decorativeFringe:normalizeSculptDecorativeFringeV1(scene.decorativeFringe,a)
    }:{})
  }:a)};
  return next;
}
export function saveSculptWorldArea(draft,areaId,scene){
  const next=snapshotSculptWorldAreaForRecovery(draft,areaId,scene);
  const checked=validateWorldBuilderDraft(next);
  if(!checked.valid)throw Error('WorldArea invalide : '+checked.errors.join(', '));
  // Return a draft of the SAME WorldDocument, no second persisted scene.
  return createWorldBuilderDraft(checked.document);
}
function inBounds(area,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||
     x<10||y<10||x>area.width-10||y>area.height-10)
    throw Error('Position hors des limites de la carte 2,5D');
}
export function placeSculptWorldPortal(draft,portalId,{x,y}={}){
  const portal=draft?.portals?.find(p=>p.id===portalId);
  if(!portal||portal.trigger?.kind!=='point')
    throw Error('Portal absent ou ancré à un objet (placement direct non autorisé)');
  const area=areaById(draft,portal.sourceAreaId);inBounds(area,x,y);
  const next=updatePortal(draft,portalId,p=>{
    p.trigger={...p.trigger,kind:'point',x,y};
  });
  const checked=validateWorldBuilderDraft(next);
  if(!checked.valid)throw Error('Position de Portal invalide : '+checked.errors.join(', '));
  return createWorldBuilderDraft(checked.document);
}
// The user-facing marker name is the existing Portal.visual.label field.
// No duplicate marker catalog or separate visual position is introduced.
export function setSculptWorldPortalLabel(draft,portalId,label){
  if(typeof label!=='string'||label.length>80)
    throw Error('Libellé de passage invalide (80 caractères maximum)');
  const portal=draft?.portals?.find(p=>p.id===portalId);
  if(!portal)throw Error('Passage inconnu');
  const next=updatePortal(draft,portalId,p=>{
    p.visual={...p.visual,label:label.trim()||null};
  });
  const checked=validateWorldBuilderDraft(next);
  if(!checked.valid)throw Error('Repère de passage invalide : '+checked.errors.join(', '));
  return createWorldBuilderDraft(checked.document);
}
export function placeSculptWorldSpawn(draft,areaId,spawnId,{x,y}={}){
  const area=areaById(draft,areaId),spawn=area.spawns?.find(s=>s.id===spawnId);
  if(!spawn||spawn.anchor)throw Error('Spawn inconnu ou ancré à une porte');
  inBounds(area,x,y);
  const next=updateSpawn(draft,areaId,spawnId,{x,y});
  const checked=validateWorldBuilderDraft(next);
  if(!checked.valid)throw Error('Spawn invalide : '+checked.errors.join(', '));
  return createWorldBuilderDraft(checked.document);
}

// Some historical starting points are anchored to building doors. Do not
// mutate the door's ownership or unlink any incoming Portal: explicitly add
// one automatically ID'd free Spawn and select it as the existing initialSpawnId.
export function ensureFreeWorldInitialSpawnV1(draft){
 const area=areaById(draft,draft?.initialAreaId);
 const existing=area.spawns.find(s=>s.id===draft.initialSpawnId);
 if(!existing)throw Error('Départ officiel introuvable');
 if(!existing.anchor)return createWorldBuilderDraft(draft);
 const source=resolveWorldAreaSpawnPoint(area,existing.id);
 const position={x:Math.max(10,Math.min(area.width-10,source?.x??area.width/2)),
   y:Math.max(10,Math.min(area.height-10,source?.y??area.height/2))};
 const next=addSpawn(draft,area.id,position);
 const ids=new Set(area.spawns.map(s=>s.id));
 const free=next.areas.find(a=>a.id===area.id).spawns.find(s=>!ids.has(s.id));
 if(!free||free.anchor)throw Error('Impossible de créer un départ libre');
 const updated=createWorldBuilderDraft({...next,initialSpawnId:free.id});
 const checked=validateWorldBuilderDraft(updated);
 if(!checked.valid)throw Error('Départ invalide : '+checked.errors.join(', '));
 return createWorldBuilderDraft(checked.document);
}

// An interior created from the 2.5D object inspector is a REAL WorldArea,
// with exactly the same Portal and Spawn owner as World Builder.
// Never create a parallel sculptInteriors scene in a WorldDocument.
export function linkSculptWorldBuildingInteriorV1(raw,{sourceAreaId,buildingId}={}){
 const draft=createWorldBuilderDraft(raw);
 const source=areaById(draft,sourceAreaId);
 if(!source.objects.some(obj=>obj.id===buildingId))
  throw new Error('Cette maison n’est pas enregistrée dans la carte');
 const existing=draft.portals.find(p=>p.sourceAreaId===sourceAreaId&&
  p.trigger?.kind==='object-anchor'&&p.trigger.objectId===buildingId);
 let linked=createBuildingInteriorLink(draft,{
  sourceAreaId,buildingId,
  // Whole-cell dimensions: the same native Sculpt terrain renderer and
  // collision world own both the exterior and the new interior.
  interiorSize:{width:18*28,height:14*21}
 });
 let portal=(existing
  ?linked.portals.find(p=>p.id===existing.id)
  :linked.portals.find(p=>p.sourceAreaId===sourceAreaId&&
    p.trigger?.kind==='object-anchor'&&p.trigger.objectId===buildingId));
 // The native return Spawn stands 72 world units in front of the actual
 // door so the character does not spawn inside house collision. The old
 // radius=32 was INSIDE the blocking building footprint, making the
 // author-created door impossible to reach from that safe arrival.
 // Keep the trigger anchored to the exact same door and enlarge only its
 // reachability radius (not its geometry, world position or target).
 if(portal?.trigger?.kind==='object-anchor'&&portal.trigger.radius<84){
   linked=updatePortal(linked,portal.id,p=>{p.trigger.radius=84;});
   portal=linked.portals.find(p=>p.id===portal.id);
 }
 if(!portal)throw new Error('Impossible de relier la porte : bâtiment sans ancrage valide');
 const target=linked.areas.find(a=>a.id===portal.targetAreaId);
 if(!target||target.kind!=='interior')
  throw new Error('La maison pointe vers une zone intérieure invalide');
 if(!linked.portals.some(p=>p.sourceAreaId===target.id&&
    p.targetAreaId===sourceAreaId&&p.targetSpawnId))
  throw new Error('Il manque le passage de retour vers la maison');
 const checked=validateWorldBuilderDraft(linked);
 if(!checked.valid)throw new Error('Liaison non sauvegardée : '+checked.errors.join(', '));
 return Object.freeze({document:createWorldBuilderDraft(checked.document),
  portalId:portal.id,targetAreaId:target.id,created:!existing});
}
