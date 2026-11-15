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
        // Existing links store the destination ID as a legacy visual label.
        // Present its human name until an actually custom label is supplied.
        label:customized&&customized!==portal.targetAreaId
          ?customized:nameFor(destination),
        selected:portal.id===selectedPortalId
      });
    }
    if(!testing&&portal.targetAreaId===areaId){
      const spawn=area.spawns?.find(s=>s.id===portal.targetSpawnId);
      if(!finitePoint(spawn)||incoming.has(spawn.id))continue;
      const isInitial=area.id===document.initialAreaId&&
        spawn.id===document.initialSpawnId;
      incoming.set(spawn.id,{
        kind:isInitial?'start':'arrival',spawnId:spawn.id,x:spawn.x,y:spawn.y,
        radius:16,label:isInitial?'Départ du monde':nameFor(areaFor(document,portal.sourceAreaId)),
        isInitial
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

// UI picking only: the original WorldDocument remains the sole authority.
// Touch selection uses the same exact source Portal.trigger and Area.spawns
// that render the rings; it never creates or repositions a marker by itself.
export function pickSculptWorldEditorMarkerV1(document,areaId,point,{radius=33}={}){
 if(!finitePoint(point)||!Number.isFinite(radius)||radius<=0)return null;
 const candidates=markersForSculptWorldArea(document,areaId,{testing:false});
 const scored=candidates.map(marker=>({
   marker,distance:Math.hypot(point.x-marker.x,point.y-marker.y)
 })).filter(item=>item.distance<=Math.max(radius,item.marker.radius));
 scored.sort((a,b)=>a.distance-b.distance||
   Number(b.marker.kind==='start')-Number(a.marker.kind==='start'));
 return scored[0]?.marker??null;
}
