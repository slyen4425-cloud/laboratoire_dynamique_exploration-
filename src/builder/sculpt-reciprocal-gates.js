// Placement policy for an explicit two-way connection on canonical WorldAreas.
// WorldDocument remains the only Portal/Spawn authority; these commands only
// relocate those already managed by the standard Builder functions.
import {addSpawn,connectWorldAreas,updatePortal,createWorldBuilderDraft} from './world-builder-draft.js';
import {placeSculptWorldPortal} from './sculpt-world-area-link.js';

export function sculptRouteGatePoint(area,edge){
 const route=area?.surface?.routes?.[0]?.points??[];
 const endpoint=edge==='entry'?route[0]:route.at(-1);
 if(!endpoint||!Number.isFinite(endpoint.y))return null;
 return Object.freeze({x:edge==='entry'?64:area.width-64,
   y:Math.max(48,Math.min(area.height-48,endpoint.y))});
}
function ensureArrival(next,portalId,arrivalAreaId,point){
 const portal=next.portals.find(p=>p.id===portalId);
 const area=next.areas.find(a=>a.id===arrivalAreaId);
 if(!portal||!area||!point)return next;
 const existing=area.spawns.find(s=>s.id===portal.targetSpawnId);
 if(existing&&!existing.anchor&&
   Math.hypot(existing.x-point.x,existing.y-point.y)<.1)return next;
 // An existing Spawn can be shared by another Portal or be the starting
 // position: never move it, create an independently referenced arrival.
 next=addSpawn(next,arrivalAreaId,point);
 const spawn=next.areas.find(a=>a.id===arrivalAreaId).spawns.at(-1);
 return updatePortal(next,portal.id,p=>{p.targetSpawnId=spawn.id;});
}
export function alignSculptReciprocalGatePair(draft,{
 sourceAreaId,targetAreaId
}={}){
 let next=connectWorldAreas(draft,{sourceAreaId,targetAreaId,returnPortal:true});
 const source=next.areas.find(a=>a.id===sourceAreaId);
 const target=next.areas.find(a=>a.id===targetAreaId);
 const forward=next.portals.find(p=>p.sourceAreaId===sourceAreaId&&p.targetAreaId===targetAreaId&&p.trigger?.kind==='point');
 const backward=next.portals.find(p=>p.sourceAreaId===targetAreaId&&p.targetAreaId===sourceAreaId&&p.trigger?.kind==='point');
 if(!forward||!backward)throw Error('Portals réciproques de voyage introuvables');
 const sourceExit=sculptRouteGatePoint(source,'exit');
 const targetEntry=sculptRouteGatePoint(target,'entry');
 if(sourceExit){
   next=placeSculptWorldPortal(next,forward.id,sourceExit);
   next=ensureArrival(next,backward.id,sourceAreaId,{
     x:Math.max(32,sourceExit.x-74),y:sourceExit.y
   });
 }
 if(targetEntry){
   // Returning to A from B must happen at B's entrance (west edge),
   // never at B's next exit (east edge).
   next=placeSculptWorldPortal(next,backward.id,targetEntry);
   next=ensureArrival(next,forward.id,targetAreaId,{
     x:Math.min(target.width-32,targetEntry.x+74),y:targetEntry.y
   });
 }
 return createWorldBuilderDraft(next);
}
