// Read-only presentation of the canonical WorldDocument v3.
// Markers never own positions or alter Portal.trigger, Spawn or collision.
const finitePoint=point=>Number.isFinite(point?.x)&&Number.isFinite(point?.y);
const areaFor=(doc,id)=>doc.areas.find(area=>area.id===id);
const nameFor=area=>area?.label??area?.id??'autre zone';

export function markersForSculptWorldArea(document,areaId,{
  testing=false,selectedPortalId=null
}={}){
  if(!document||!Array.isArray(document.areas))return Object.freeze([]);
  const area=areaFor(document,areaId);
  if(!area)return Object.freeze([]);
  const markers=[],incoming=new Map();
  for(const portal of document.portals??[]){
    if(portal.enabled!==true)continue;
    if(portal.sourceAreaId===areaId&&portal.visual?.visible===true&&
       portal.trigger?.kind==='point'&&finitePoint(portal.trigger)){
      const destination=areaFor(document,portal.targetAreaId);
      const customized=portal.visual.label?.trim();
      markers.push({
        kind:'exit',portalId:portal.id,x:portal.trigger.x,y:portal.trigger.y,
        radius:portal.trigger.radius,
        label:customized||nameFor(destination),
        selected:portal.id===selectedPortalId
      });
    }
    if(!testing&&portal.targetAreaId===areaId){
      const spawn=area.spawns?.find(s=>s.id===portal.targetSpawnId);
      if(!finitePoint(spawn)||incoming.has(spawn.id))continue;
      incoming.set(spawn.id,{
        kind:'arrival',spawnId:spawn.id,x:spawn.x,y:spawn.y,
        radius:16,label:nameFor(areaFor(document,portal.sourceAreaId)),
        isInitial:area.id===document.initialAreaId&&
          spawn.id===document.initialSpawnId
      });
    }
  }
  if(!testing){
    markers.push(...incoming.values());
    if(area.id===document.initialAreaId){
      const start=area.spawns?.find(s=>s.id===document.initialSpawnId);
      if(finitePoint(start)&&!incoming.has(start.id))
        markers.push({
          kind:'start',spawnId:start.id,x:start.x,y:start.y,
          radius:16,label:'Départ du monde',isInitial:true
        });
    }
  }
  return Object.freeze(markers.map(marker=>Object.freeze(marker)));
}
