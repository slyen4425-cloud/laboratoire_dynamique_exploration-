// Prototype-only composition of a canonical sculpt heightfield with standard
// WorldObject placements. It is NOT a WorldDocument nor a runtime save.
import {createSculptTerrain,importSculptTerrain,serializeSculptTerrain,sculptWaterAt,appendSculptTerrainRamp} from './sculpt-height-model.js';
import {objectDefinitionCatalogV1} from '../objects/object-definition-catalog.js';
import {createSculptSurface,normalizeSculptSurface} from './sculpt-surface-paint.js';
import {normalizeTerrainFamilyEncounterConfig} from '../encounters/terrain-family-encounter-config.js';
import {TERRAIN_FAMILY_IDS} from './terrain-family-registry.js';
import {normalizeWorldActorPlacement,normalizeWorldActorPlacements} from '../actors/world-actor-placement-model.js';
import {normalizeWorldObjectPlacement,normalizeWorldObjectPlacements} from './world-object-placement-model.js?rev=waterfalls-v3-ramp-v77';


/*
 * Scene metadata stores the same WorldDocument EncounterConfig v1 and
 * WorldArea.encounters.randomEnabled fields that the 2D Builder owns. This
 * file validates optional transport fields; it never implements encounter
 * selection, rarity, area traversal, or alternative gameplay rules.
 */
function sculptEncounterSceneSettings(source = {}) {
  let config=null;
  if(Object.hasOwn(source,'encounterConfig')){
    const raw=source.encounterConfig;
    const known=new Set(TERRAIN_FAMILY_IDS);
    if(!raw||raw.version!==1||!Array.isArray(raw.families)||
       raw.families.length!==known.size)
      throw Error('Scène sculptable : configuration des rencontres invalide');
    const used=new Set();
    for(const profile of raw.families){
      if(!known.has(profile?.terrainFamilyId)||used.has(profile.terrainFamilyId)||
         typeof profile.encounterChancePercent!=='number'||
         !Number.isFinite(profile.encounterChancePercent)||
         profile.encounterChancePercent<0||profile.encounterChancePercent>100||
         !Array.isArray(profile.elementChances))
        throw Error('Scène sculptable : famille de rencontre invalide');
      used.add(profile.terrainFamilyId);
      const elements=new Set();
      for(const item of profile.elementChances){
        if(typeof item?.elementId!=='string'||!item.elementId.trim()||
           elements.has(item.elementId)||typeof item.chancePercent!=='number'||
           !Number.isFinite(item.chancePercent)||
           item.chancePercent<=0||item.chancePercent>100)
          throw Error('Scène sculptable : élément de rencontre invalide');
        elements.add(item.elementId);
      }
      if(profile.encounterChancePercent>0&&profile.elementChances.length===0)
        throw Error('Scène sculptable : sélectionne au moins un élément pour les rencontres');
    }
    config=normalizeTerrainFamilyEncounterConfig(raw);
  }
  const rawArea=source.exteriorEncounters;
  if(rawArea!==undefined &&
     (!rawArea||typeof rawArea!=='object'||
       typeof rawArea.randomEnabled!=='boolean'))
    throw Error('Scène sculptable : rencontres de l\'Area extérieure invalides');
  return Object.freeze({
    encounterConfig:config,
    exteriorEncounters:Object.freeze({randomEnabled:rawArea?.randomEnabled??true})
  });
}

export const SCULPT_SCENE_PREVIEW_VERSION=1;
export const SCULPT_SCENE_PREVIEW_KIND='sculpt-preview-scene';
// Safeguard against excessive mobile scenes, not a 128-tree authoring ceiling.
// 2048 independent WorldObjects is enough for dense 80x60 forests; exports
// beyond this budget fail explicitly instead of silently deleting objects.
export const SCULPT_OBJECT_LIMIT=2048;
export const SCULPT_ACTOR_LIMIT=80;
// Only the existing sculpt terrain and placement formats own the data.
// This constructor is a scene-level editor command, not a second world model.
export function createBlankSculptPreviewScene({width=36,height=24}={}){
  const terrain=createSculptTerrain({width,height});
  return Object.freeze({terrain,objects:Object.freeze([]),actors:Object.freeze([]),surface:createSculptSurface(),isScene:true});
}
const validKinds=new Set(['building','tree','rock','bridge','stairs','ramp','decor']);
export function listSculptPlaceableDefinitions(){
  // New slopes belong to the terrain sculpture tools, NOT Object placement.
  return Object.freeze(objectDefinitionCatalogV1.list().filter(d=>
    validKinds.has(d.kind)&&d.kind!=='ramp'&&!d.id.startsWith('objectdef.relief.')));
}
// Read older V77 scenes to migrate ramps without data loss, but never offer
// their historical pseudo-object definitions for new placements.
const allowable=new Set([...listSculptPlaceableDefinitions().map(d=>d.id),
  ...objectDefinitionCatalogV1.list().filter(d=>d.kind==='ramp').map(d=>d.id)]);
// One Sculpt authoring policy for BOTH placing and dragging native objects.
// The heightfield owns the wetness, the canonical ObjectDefinition owns kind.
// No pixel, image alpha or collision shortcut can declare water passable.
export function sculptObjectCanOccupyCell(terrain,definitionId,col,row){
  if(!terrain||!Number.isInteger(col)||!Number.isInteger(row)||
    col<0||row<0||col>=terrain.width||row>=terrain.height)return false;
  const definition=objectDefinitionCatalogV1.get(definitionId);
  if(!definition||!allowable.has(definitionId))return false;
  return sculptWaterAt(terrain,col,row)<=0||definition.kind==='bridge';
}
export function sculptPreviewVariants(definitionId){
  const def=objectDefinitionCatalogV1.get(definitionId);
  return Object.freeze([...(def?.visual?.variants??[])]);
}
function validVariant(definitionId,variantId){
  return sculptPreviewVariants(definitionId).some(v=>v.id===variantId)?variantId:null;
}
export function normalizeSculptPreviewObjects(raw=[]){
  const safe=Array.isArray(raw)?raw:[];
  if(safe.length>SCULPT_OBJECT_LIMIT)
    throw Error('Scène sculptable : limite de '+SCULPT_OBJECT_LIMIT+' objets dépassée');
  const valid=safe.filter(o=>allowable.has(o?.objectDefinitionId));
  return normalizeWorldObjectPlacements(valid,objectDefinitionCatalogV1);
}
export function appendSculptPreviewObject(objects,{
  definitionId,x,y,scale=.38,scaleX=scale,scaleY=scale,rotationDeg=0,variantId=null
}={}){
  const list=normalizeSculptPreviewObjects(objects);
  if(list.length>=SCULPT_OBJECT_LIMIT||!allowable.has(definitionId)||
      !Number.isFinite(x)||!Number.isFinite(y))return list;
  const used=new Set(list.map(o=>o.id));
  let suffix=1;
  while(used.has('sculpt-object-'+suffix))suffix++;
  const placement=normalizeWorldObjectPlacement({
    id:'sculpt-object-'+suffix,objectDefinitionId:definitionId,
    transform:{x,y,scaleX,scaleY,rotationDeg},
    overrides:{visualVariantId:validVariant(definitionId,variantId)}
  },list.length,objectDefinitionCatalogV1);
  return Object.freeze([...list,placement]);
}
export function updateSculptPreviewObject(objects,id,{scale,scaleX,scaleY,rotationDeg,variantId,x,y}={}){
  const items=normalizeSculptPreviewObjects(objects);
  if(!items.some(o=>o.id===id))return items;
  return Object.freeze(items.map((item,i)=>{
    if(item.id!==id)return item;
    const nextTransform={...item.transform};
    if(Number.isFinite(x))nextTransform.x=x;
    if(Number.isFinite(y))nextTransform.y=y;
    const definition=objectDefinitionCatalogV1.get(item.objectDefinitionId);
    const maxScale=['bridge','stairs','ramp'].includes(definition?.kind)?3:1.2;
    if(Number.isFinite(scale)&&scale>=.25&&scale<=maxScale){
      nextTransform.scaleX=scale;nextTransform.scaleY=scale;
    }
    // Canonical independent axes: X is bridge LONGITUDINAL length even
    // when the selected bitmap faces vertically; Y is the deck width.
    if(Number.isFinite(scaleX)&&scaleX>=.25&&scaleX<=maxScale)
      nextTransform.scaleX=scaleX;
    if(Number.isFinite(scaleY)&&scaleY>=.25&&scaleY<=maxScale)
      nextTransform.scaleY=scaleY;
    if(Number.isFinite(rotationDeg))nextTransform.rotationDeg=rotationDeg;
    const nextVariant=variantId===undefined?item.overrides.visualVariantId:
      validVariant(item.objectDefinitionId,variantId);
    if(nextTransform.scaleX===item.transform.scaleX&&
       nextTransform.scaleY===item.transform.scaleY&&
       nextTransform.x===item.transform.x&&nextTransform.y===item.transform.y&&
       nextTransform.rotationDeg===item.transform.rotationDeg&&
       nextVariant===item.overrides.visualVariantId)return item;
    return normalizeWorldObjectPlacement({...item,transform:nextTransform,
      overrides:{...item.overrides,visualVariantId:nextVariant}},
      i,objectDefinitionCatalogV1);
  }));
}
export function removeSculptPreviewObject(objects,id){
  return Object.freeze(normalizeSculptPreviewObjects(objects).filter(o=>o.id!==id));
}
export function findSculptPreviewObjectNear(objects,x,y,maxDistance=50){
  let found=null,best=Infinity;
  for(const item of normalizeSculptPreviewObjects(objects)){
    const definition=objectDefinitionCatalogV1.get(item.objectDefinitionId);
    const width=(definition?.baseSize?.width??0)*item.transform.scaleX;
    const height=(definition?.baseSize?.height??0)*item.transform.scaleY;
    // Pick objects using the anchor/collision footprint, independent of pixels.
    const dx=x-item.transform.x,dy=y-item.transform.y;
    // Image is anchored at the character's foot. Permit selecting the full
    // upper silhouette rather than requiring a tap on the invisible anchor.
    if(Math.abs(dx)>Math.max(maxDistance,width*.5)||
       dy<-Math.max(maxDistance,height)||dy>maxDistance)continue;
    const score=Math.hypot(dx,dy);
    if(score<best){best=score;found=item;}
  }
  return found;
}
// Actor definitions and asset visuals are resolved by Capture, never owned here.
export function normalizeSculptPreviewActors(raw=[]){
  if(!Array.isArray(raw)||raw.length>SCULPT_ACTOR_LIMIT||
     raw.some(item=>!item||typeof item.actorDefinitionId!=='string'||
       !item.actorDefinitionId.trim()||!Number.isFinite(item.x)||
       !Number.isFinite(item.y)))
    throw Error('Scène sculptable : placements acteur invalides');
  const placements=normalizeWorldActorPlacements(raw);
  if(placements.length!==raw.length)throw Error('Scène sculptable : acteurs incohérents');
  return placements;
}
export function appendSculptPreviewActor(raw,{
  definitionId,x,y,facingX=1,visualScale=1,visualView='front'
}={}){
  const actors=normalizeSculptPreviewActors(raw);
  if(actors.length>=SCULPT_ACTOR_LIMIT||!definitionId||
     !Number.isFinite(x)||!Number.isFinite(y))return actors;
  const ids=new Set(actors.map(a=>a.id));let serial=1;
  while(ids.has('sculpt-actor-'+serial))serial++;
  const placed=normalizeWorldActorPlacement({
    id:'sculpt-actor-'+serial,actorDefinitionId:definitionId,x,y,facingX,
    ...(visualScale===1?{}:{visualScale}),
    ...(visualView==='front'?{}:{visualView})
  },actors.length);
  return Object.freeze([...actors,placed]);
}
export function findSculptPreviewActorNear(raw,x,y,threshold=28){
  const actors=normalizeSculptPreviewActors(raw);
  let best=null,bestDistance=Infinity;
  for(const actor of actors){
    const scale=actor.visualScale??1;
    const dx=x-actor.x,dy=y-actor.y;
    // The actor asset stands ABOVE its ground anchor; allow tapping its body.
    // Still use world-coordinate anchors, never a second sprite collision.
    if(Math.abs(dx)>Math.max(threshold,scale*44)||
       dy< -Math.max(threshold,scale*95)||dy>threshold)continue;
    const distance=Math.hypot(dx,Math.max(0,dy));
    if(distance<bestDistance){best=actor;bestDistance=distance;}
  }
  return best;
}
export function updateSculptPreviewActor(raw,id,{
  facingX,visualScale,visualView
}={}){
  const actors=normalizeSculptPreviewActors(raw);
  if(!actors.some(actor=>actor.id===id))return actors;
  return Object.freeze(actors.map((actor,index)=>{
    if(actor.id!==id)return actor;
    const next=normalizeWorldActorPlacement({
      ...actor,
      facingX:facingX===undefined?actor.facingX:facingX,
      visualScale:visualScale===undefined?(actor.visualScale??1):visualScale,
      visualView:visualView===undefined?(actor.visualView??'front'):visualView
    },index);
    return JSON.stringify(next)===JSON.stringify(actor)?actor:next;
  }));
}
export function removeSculptPreviewActorAt(raw,x,y,threshold=24){
  const actors=normalizeSculptPreviewActors(raw);
  const found=findSculptPreviewActorNear(actors,x,y,threshold);
  return found?Object.freeze(actors.filter(a=>a.id!==found.id)):actors;
}
export function serializeSculptPreviewScene(terrain,objects=[],surface=createSculptSurface(),actors=[],encounterSettings=null){
  const paint=normalizeSculptSurface(surface);
  const settings=encounterSettings===null?null:sculptEncounterSceneSettings(encounterSettings);
  return JSON.stringify({kind:SCULPT_SCENE_PREVIEW_KIND,
    sceneVersion:SCULPT_SCENE_PREVIEW_VERSION,
    terrain:JSON.parse(serializeSculptTerrain(terrain)),
    objects:normalizeSculptPreviewObjects(objects),
    ...(paint.routes.length||paint.zones.length||
      paint.baseTerrainFamilyId!==createSculptSurface().baseTerrainFamilyId||
      paint.baseMaterialId!==createSculptSurface().baseMaterialId
      ?{surface:paint}:{}),
    ...(actors.length?{actors:normalizeSculptPreviewActors(actors)}:{}),
    ...(settings?.encounterConfig?{encounterConfig:settings.encounterConfig}:{}),
    ...(settings?{exteriorEncounters:settings.exteriorEncounters}:{})});
}
export function importSculptPreviewScene(raw){
  const source=typeof raw==='string'?JSON.parse(raw):raw;
  if(source?.schemaVersion===1&&Array.isArray(source.levels)){
    // Exact compatibility with earlier "export heights" users.
    return Object.freeze({terrain:importSculptTerrain(source),
      objects:Object.freeze([]),actors:Object.freeze([]),surface:createSculptSurface(),
      encounterConfig:null,exteriorEncounters:Object.freeze({randomEnabled:true}),isScene:false});
  }
  if(source?.kind!==SCULPT_SCENE_PREVIEW_KIND||
      source?.sceneVersion!==SCULPT_SCENE_PREVIEW_VERSION||
      !Array.isArray(source?.objects)||
      source.objects.length>SCULPT_OBJECT_LIMIT||
      source.objects.some(o=>!allowable.has(o?.objectDefinitionId)))
    throw new Error('Scène sculptable invalide : format ou objets inconnus');
  let terrain=importSculptTerrain(source.terrain);
  const objects=normalizeSculptPreviewObjects(source.objects);
  if(objects.length!==source.objects.length)
    throw new Error('Scène sculptable invalide : placements incohérents');
  if(objects.some(o=>o.transform.x<0||o.transform.x>=terrain.width*28||
     o.transform.y<0||o.transform.y>=terrain.height*21))
    throw new Error('Scène sculptable invalide : objet hors terrain');
  // Legacy V77 slopes saved as WorldObjects are migrated to native terrain.
  // If an obsolete invalid placement cannot be migrated, retain it intact
  // instead of silently deleting user data.
  const migrated=[];
  for(const object of objects){
    const definition=objectDefinitionCatalogV1.get(object.objectDefinitionId);
    if(definition?.kind!=='ramp'){migrated.push(object);continue;}
    const t=object.transform,a=t.rotationDeg*Math.PI/180;
    const length=definition.baseSize.height*t.scaleY;
    const next=appendSculptTerrainRamp(terrain,{
      x:t.x,y:t.y,endX:t.x+Math.sin(a)*length,
      endY:t.y-Math.cos(a)*length,width:definition.baseSize.width*t.scaleX*.68});
    if(next===terrain){migrated.push(object);continue;}
    terrain=next;
  }
  const actors=normalizeSculptPreviewActors(source.actors??[]);
  if(actors.some(a=>a.x<0||a.x>=terrain.width*28||a.y<0||a.y>=terrain.height*21))
    throw Error('Scène sculptable : acteur hors terrain');
  const surface=normalizeSculptSurface(source.surface);
  for(const feature of [...surface.routes,...surface.zones]){
    if(feature.points.some(p=>p.x>=terrain.width*28||p.y>=terrain.height*21))
      throw Error('Peinture sculptable hors de la carte');
  }
  const settings=sculptEncounterSceneSettings(source);
  return Object.freeze({terrain,objects:Object.freeze(migrated),actors,surface,
    ...settings,isScene:true});
}
