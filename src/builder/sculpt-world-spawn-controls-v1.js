// Read-only editor projection of the SAME WorldArea.spawns/initialSpawnId.
// Geometry for door anchors is resolved ONLY by world-area-model; neither
// this menu nor Sculpt may invent a free coordinate for a building-linked Spawn.
import {resolveWorldAreaSpawnPoint} from '../world/world-area-model.js';
export function describeWorldAreaSpawnsForEditorV1(document,areaId){
 const area=document?.areas?.find(item=>item.id===areaId);
 if(!area)return Object.freeze([]);
 return Object.freeze((area.spawns??[]).map(spawn=>{
  const initial=area.id===document.initialAreaId&&spawn.id===document.initialSpawnId;
  const anchored=Boolean(spawn.anchor);
  const point=resolveWorldAreaSpawnPoint(area,spawn.id);
  return Object.freeze({
   id:spawn.id,initial,editable:!anchored,point,
   label:(initial?'★ Départ · ':anchored?'🔒 Porte liée · ':'📍 Arrivée · ')+spawn.id
  });
 }));
}
