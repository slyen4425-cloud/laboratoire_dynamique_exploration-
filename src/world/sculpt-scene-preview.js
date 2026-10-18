// Prototype-only composition of a canonical sculpt heightfield with standard
// WorldObject placements. It is NOT a WorldDocument nor a runtime save.
import {importSculptTerrain,serializeSculptTerrain} from './sculpt-height-model.js';
import {objectDefinitionCatalogV1} from '../objects/object-definition-catalog.js';
import {normalizeWorldObjectPlacement,normalizeWorldObjectPlacements} from './world-object-placement-model.js';

export const SCULPT_SCENE_PREVIEW_VERSION=1;
export const SCULPT_SCENE_PREVIEW_KIND='sculpt-preview-scene';
export const SCULPT_OBJECT_LIMIT=128;
const validKinds=new Set(['building','tree','rock']);
export function listSculptPlaceableDefinitions(){
  return Object.freeze(objectDefinitionCatalogV1.list().filter(d=>
    validKinds.has(d.kind)&&!d.id.startsWith('objectdef.relief.')));
}
const allowable=new Set(listSculptPlaceableDefinitions().map(d=>d.id));
export function normalizeSculptPreviewObjects(raw=[]){
  const safe=Array.isArray(raw)?raw.slice(0,SCULPT_OBJECT_LIMIT):[];
  const valid=safe.filter(o=>allowable.has(o?.objectDefinitionId));
  return normalizeWorldObjectPlacements(valid,objectDefinitionCatalogV1);
}
export function appendSculptPreviewObject(objects,{
  definitionId,x,y,scale=.38,rotationDeg=0
}={}){
  const list=normalizeSculptPreviewObjects(objects);
  if(list.length>=SCULPT_OBJECT_LIMIT||!allowable.has(definitionId)||
      !Number.isFinite(x)||!Number.isFinite(y))return list;
  const used=new Set(list.map(o=>o.id));
  let suffix=1;
  while(used.has('sculpt-object-'+suffix))suffix++;
  const placement=normalizeWorldObjectPlacement({
    id:'sculpt-object-'+suffix,objectDefinitionId:definitionId,
    transform:{x,y,scaleX:scale,scaleY:scale,rotationDeg}
  },list.length,objectDefinitionCatalogV1);
  return Object.freeze([...list,placement]);
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
    if(Math.abs(dx)>Math.max(maxDistance,width*.5)||
       Math.abs(dy)>Math.max(maxDistance,height*.38))continue;
    const score=Math.hypot(dx,dy);
    if(score<best){best=score;found=item;}
  }
  return found;
}
export function serializeSculptPreviewScene(terrain,objects=[]){
  return JSON.stringify({kind:SCULPT_SCENE_PREVIEW_KIND,
    sceneVersion:SCULPT_SCENE_PREVIEW_VERSION,
    terrain:JSON.parse(serializeSculptTerrain(terrain)),
    objects:normalizeSculptPreviewObjects(objects)});
}
export function importSculptPreviewScene(raw){
  const source=typeof raw==='string'?JSON.parse(raw):raw;
  if(source?.schemaVersion===1&&Array.isArray(source.levels)){
    // Exact compatibility with earlier "export heights" users.
    return Object.freeze({terrain:importSculptTerrain(source),
      objects:Object.freeze([]),isScene:false});
  }
  if(source?.kind!==SCULPT_SCENE_PREVIEW_KIND||
      source?.sceneVersion!==SCULPT_SCENE_PREVIEW_VERSION||
      !Array.isArray(source?.objects)||
      source.objects.length>SCULPT_OBJECT_LIMIT||
      source.objects.some(o=>!allowable.has(o?.objectDefinitionId)))
    throw new Error('Scène sculptable invalide : format ou objets inconnus');
  const terrain=importSculptTerrain(source.terrain);
  const objects=normalizeSculptPreviewObjects(source.objects);
  if(objects.length!==source.objects.length)
    throw new Error('Scène sculptable invalide : placements incohérents');
  if(objects.some(o=>o.transform.x<0||o.transform.x>=terrain.width*28||
     o.transform.y<0||o.transform.y>=terrain.height*21))
    throw new Error('Scène sculptable invalide : objet hors terrain');
  return Object.freeze({terrain,objects,isScene:true});
}
