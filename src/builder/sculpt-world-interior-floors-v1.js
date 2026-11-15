// The World Builder's existing WorldArea/Portal/Spawn owns every floor.
// These helpers provide a view and authoring commands, never a second graph.
import {addWorldArea,addSpawn,connectWorldAreas,updatePortal,
  updateSpawn,createWorldBuilderDraft,validateWorldBuilderDraft}
  from './world-builder-draft.js';
import {validInteriorConnectorAsset,validInteriorDoorAsset}
  from '../world/interior-material-catalog.js';
import {circleFitsWorldAreaBoundary}
  from '../world/world-area-geometry.js';
export const WORLD_INTERIOR_MAX_FLOORS=4;
const areaOf=(world,id)=>world?.areas?.find(area=>area.id===id)??null;
export function worldInteriorFloorRootId(world,areaId){
 const area=areaOf(world,areaId);
 if(area?.kind!=='interior')return null;
 const root=area.interiorFloor?.rootAreaId??area.id;
 return areaOf(world,root)?.kind==='interior'?root:null;
}
export function worldInteriorFloors(world,areaId){
 const root=worldInteriorFloorRootId(world,areaId);
 if(!root)return Object.freeze([]);
 return Object.freeze(world.areas.filter(a=>a.kind==='interior'&&
   (a.id===root||a.interiorFloor?.rootAreaId===root))
   .map(a=>Object.freeze({areaId:a.id,level:a.id===root?0:a.interiorFloor.level,
     label:a.id===root?'Rez-de-chaussée':'Étage '+a.interiorFloor.level}))
   .sort((a,b)=>a.level-b.level));
}
export function worldInteriorFloorPortals(world,areaId){
 const levels=new Set(worldInteriorFloors(world,areaId).map(x=>x.areaId));
 return Object.freeze((world?.portals??[]).filter(p=>p.sourceAreaId===areaId&&
    levels.has(p.targetAreaId)&&p.targetAreaId!==areaId&&
    p.visual?.marker==='portal'));
}
export function worldInteriorHouseExit(world,areaId){
 const root=worldInteriorFloorRootId(world,areaId);
 if(!root)return null;
 const inbound=world.portals.find(p=>p.targetAreaId===root&&
   p.trigger?.kind==='object-anchor'&&areaOf(world,p.sourceAreaId)?.kind==='exterior');
 if(!inbound)return null;
 const outbound=world.portals.find(p=>p.sourceAreaId===root&&
   p.targetAreaId===inbound.sourceAreaId&&p.trigger?.kind==='point');
 return outbound?Object.freeze({outsideAreaId:inbound.sourceAreaId,
   rootAreaId:root,entry:inbound,exit:outbound}):null;
}
function validate(next){
 const checked=validateWorldBuilderDraft(next);
 if(!checked.valid)throw Error('Étages / passages invalides : '+checked.errors.join(', '));
 return createWorldBuilderDraft(checked.document);
}
export function addWorldInteriorFloor(world,areaId){
 const floors=worldInteriorFloors(world,areaId);
 const root=worldInteriorFloorRootId(world,areaId);
 const current=areaOf(world,areaId);
 if(!root||!current)throw Error('Intérieur officiel introuvable');
 if(floors.length>=WORLD_INTERIOR_MAX_FLOORS)
   throw Error('Maximum de '+WORLD_INTERIOR_MAX_FLOORS+' étages atteint');
 const level=floors[floors.length-1]?.level??0;
 if(floors[floors.length-1]?.areaId!==areaId)
   throw Error('Ouvre le dernier étage pour ajouter celui du dessus');
 if(floors.some(f=>f.level!==floors.indexOf(f)))
   throw Error('Numérotation des étages incohérente : aucune mutation');
 let next=addWorldArea(world,{name:'Étage '+(level+1),
   kind:'interior',width:current.width,height:current.height});
 const newArea=next.areas.find(a=>!world.areas.some(o=>o.id===a.id));
 if(!newArea)throw Error('Étage non créé');
 next=createWorldBuilderDraft({...next,areas:next.areas.map(a=>
   a.id===newArea.id?{...a,interiorFloor:{rootAreaId:root,level:level+1},
     boundary:current.boundary,
     surface:{...a.surface,baseMaterialId:current.surface.baseMaterialId}}:a)});
 const center={x:Math.min(current.width-42,Math.max(42,current.width*.52)),
   y:Math.min(current.height-42,Math.max(42,current.height*.52))};
 const prior=new Set(current.spawns.map(s=>s.id));
 next=addSpawn(next,areaId,{x:center.x-68,y:center.y});
 const parent=areaOf(next,areaId);
 const returnSpawn=parent.spawns.find(s=>!prior.has(s.id));
 if(!returnSpawn)throw Error('Arrivée du niveau inférieur non créée');
 next=connectWorldAreas(next,{sourceAreaId:areaId,targetAreaId:newArea.id,returnPortal:true});
 const upper=areaOf(next,newArea.id);
 const up=next.portals.find(p=>p.sourceAreaId===areaId&&p.targetAreaId===newArea.id);
 const down=next.portals.find(p=>p.sourceAreaId===newArea.id&&p.targetAreaId===areaId);
 if(!up||!down)throw Error('Portails de montée/descente absents');
 // The target spawn is deliberately away from the portal trigger.
 next=updateSpawn(next,newArea.id,upper.spawns[0].id,
   {x:center.x-68,y:center.y});
 for(const portal of [up,down]){
  next=updatePortal(next,portal.id,p=>{
    p.trigger={kind:'point',x:center.x,y:center.y,radius:25};
    if(portal.id===down.id)p.targetSpawnId=returnSpawn.id;
    p.visual={...p.visual,visible:true,marker:'portal',
      label:portal.id===up.id?'Monter à l’étage '+(level+1):
        'Descendre au niveau '+level,assetId:'stairs.wood'};
  });
 }
 return Object.freeze({document:validate(next),areaId:newArea.id});
}
export function changeWorldInteriorConnector(world,portalId,{x,y,assetId,rotationDeg}={}){
 const portal=world?.portals?.find(p=>p.id===portalId);
 if(!portal||!worldInteriorFloorPortals(world,portal.sourceAreaId).some(p=>p.id===portalId))
   throw Error('Passage entre étages absent');
 if(!validInteriorConnectorAsset(assetId))throw Error('Escalier / échelle inconnu');
 const area=areaOf(world,portal.sourceAreaId);
 if(!Number.isFinite(x)||!Number.isFinite(y)||
   !circleFitsWorldAreaBoundary(area,x,y,16))
    throw Error('Pose l’escalier sur le sol autorisé');
 const next=updatePortal(world,portalId,p=>{
   p.trigger={kind:'point',x,y,radius:25};
   p.visual={...p.visual,visible:true,marker:'portal',assetId,
     ...(Number.isFinite(rotationDeg)?{rotationDeg}:{})};
 });
 return validate(next);
}
export function changeWorldInteriorDoor(world,areaId,{x,y,assetId,scale}={}){
 const house=worldInteriorHouseExit(world,areaId);
 if(!house||house.rootAreaId!==areaId)
   throw Error('Ouvre le rez-de-chaussée pour modifier la porte');
 const portal=house.exit,area=areaOf(world,areaId);
 const xSafe=Number.isFinite(x)?Math.max(26,Math.min(area.width-26,x)):portal.trigger.x;
 const ySafe=Number.isFinite(y)?Math.max(30,Math.min(area.height-17,y)):portal.trigger.y;
 if(!circleFitsWorldAreaBoundary(area,xSafe,ySafe,12))
   throw Error('Porte en dehors du sol de la pièce');
 if(assetId!==undefined&&!validInteriorDoorAsset(assetId))
   throw Error('Visuel de porte invalide');
 return validate(updatePortal(world,portal.id,p=>{
   p.trigger={...p.trigger,x:xSafe,y:ySafe};
   p.visual={...p.visual,
     ...(assetId!==undefined?{assetId}:{}),
     ...(Number.isFinite(scale)?{scale}: {})};
 }));
}
