// One-way authoring adapter: WorldDocument v3 is the only saved authority.
// Native SculptTerrain is WorldArea.sculptTerrain, while paint/objects/actors
// already belong to the exact canonical WorldArea.surface/objects/actors.
// No independent "sculpt scene" or duplicate Portal graph is persisted.
import {createSculptTerrain,importSculptTerrain,serializeSculptTerrain} from '../world/sculpt-height-model.js';
import {normalizeSculptSurface} from '../world/sculpt-surface-paint.js';
import {normalizeSculptPreviewObjects,normalizeSculptPreviewActors} from '../world/sculpt-scene-preview.js';
import {updatePortal,updateSpawn,createWorldBuilderDraft,
  validateWorldBuilderDraft} from './world-builder-draft.js';

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
  return Object.freeze({
    terrain,objects:normalizeSculptPreviewObjects(area.objects??[]),
    actors:normalizeSculptPreviewActors(area.actors??[]),
    surface:normalizeSculptSurface(area.surface)
  });
}
export function saveSculptWorldArea(draft,areaId,scene){
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
    surface,objects,actors
  }:a)};
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
export function placeSculptWorldSpawn(draft,areaId,spawnId,{x,y}={}){
  const area=areaById(draft,areaId),spawn=area.spawns?.find(s=>s.id===spawnId);
  if(!spawn||spawn.anchor)throw Error('Spawn inconnu ou ancré à une porte');
  inBounds(area,x,y);
  const next=updateSpawn(draft,areaId,spawnId,{x,y});
  const checked=validateWorldBuilderDraft(next);
  if(!checked.valid)throw Error('Spawn invalide : '+checked.errors.join(', '));
  return createWorldBuilderDraft(checked.document);
}
