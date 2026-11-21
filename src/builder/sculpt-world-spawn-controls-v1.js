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

// Compact editor projection by INCOMING Portal rather than by Spawn. An older
// map can have several Portals sharing one Spawn; show every source separately
// so the author can repair one direction without moving the others.
export function describeWorldAreaIncomingPortalsForEditorV1(document,areaId){
 const area=document?.areas?.find(item=>item.id===areaId);
 if(!area)return Object.freeze([]);
 const incoming=(document.portals??[]).filter(portal=>
  portal.targetAreaId===areaId&&portal.enabled!==false);
 return Object.freeze(incoming.map(portal=>{
  const spawn=area.spawns?.find(item=>item.id===portal.targetSpawnId);
  const source=document.areas.find(item=>item.id===portal.sourceAreaId);
  const same=incoming.filter(other=>other.targetSpawnId===portal.targetSpawnId);
  const isStart=areaId===document.initialAreaId&&
   spawn?.id===document.initialSpawnId;
  return Object.freeze({
   portalId:portal.id,sourceAreaId:portal.sourceAreaId,
   label:'Depuis '+(source?.label??source?.id??'carte inconnue'),
   spawnId:portal.targetSpawnId,
   shared:same.length>1||isStart,
   editable:!!spawn&&!spawn.anchor,
   point:spawn?resolveWorldAreaSpawnPoint(area,spawn.id):null
  });
 }));
}
