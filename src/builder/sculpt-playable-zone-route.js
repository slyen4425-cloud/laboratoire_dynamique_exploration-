// Explicit World Builder repair command. It only modifies the SAME canonical
// WorldDocument; it never rescales or replaces unsupported 2400×1600 areas.
import {createWorldBuilderDraft,connectWorldAreas,setWorldInitialArea,updatePortal,initializeWorldPresetEncounters}
  from './world-builder-draft.js?rev=preset-travel-encounters-v2';
import {sculptWorldAreaScene,placeSculptWorldPortal} from './sculpt-world-area-link.js';
import {createWorldAreaFromSculptMapPreset,mapEdgePoint} from './sculpt-map-preset-library.js?rev=preset-travel-encounters-v2';
import {builtinSculptMapPresets} from './sculpt-builtin-map-presets.js?rev=preset-travel-encounters-v2';

export function playableSculptArea(area){
  if(!area)return false;
  try{sculptWorldAreaScene(area);return true;}
  catch{return false;}
}
export const playableExteriorArea=area=>area?.kind==='exterior'&&playableSculptArea(area);

// Resolve a map-tab request by inspecting the SAME WorldDocument. Navigation
// can offer another existing editable Area; it never changes a Portal, Spawn,
// zone size or the WorldDocument start position.
export function resolveSculptAreaForEditor(draft,selectedAreaId){
  const selected=draft?.areas?.find(area=>area.id===selectedAreaId);
  if(!selected)return null;
  if(playableSculptArea(selected))
    return Object.freeze({areaId:selected.id,redirected:false});
  // Prefer an exterior for a legacy exterior, then any editable instance.
  const next=draft.areas.find(area=>area.id!==selected.id&&playableExteriorArea(area))
    ??draft.areas.find(area=>area.id!==selected.id&&playableSculptArea(area));
  return next?Object.freeze({areaId:next.id,redirected:true}):null;
}
const nextArea=(after,before)=>after.areas.find(a=>!before.has(a.id));

export function makePlayableZoneRoute(draft,{selectedAreaId,preset=builtinSculptMapPresets()[3],initializeEncounters=false}={}){
  let next=createWorldBuilderDraft(draft);
  const previousIds=new Set(next.areas.map(a=>a.id));
  let source=next.areas.find(a=>a.id===selectedAreaId&&playableExteriorArea(a))
    ??next.areas.find(playableExteriorArea);
  if(!source){
    const before=new Set(next.areas.map(a=>a.id));
    next=createWorldAreaFromSculptMapPreset(next,builtinSculptMapPresets()[0],{
      name:'Forêt de départ · 2,5D',kind:'exterior',hostAreaId:null,initializeEncounters
    });
    source=nextArea(next,before);
    if(!source)throw Error('Carte de départ 2,5D non créée');
  }
  let target=next.areas.find(a=>a.id!==source.id&&playableExteriorArea(a));
  if(!target){
    const before=new Set(next.areas.map(a=>a.id));
    next=createWorldAreaFromSculptMapPreset(next,preset,{
      name:'Destination · '+preset.name,kind:'exterior',hostAreaId:null,initializeEncounters
    });
    target=nextArea(next,before);
    if(!target)throw Error('Destination 2,5D non créée');
  }
  // This action is explicit and confirmed in the UI. Existing invalid
  // outbound links are redirected, not deleted or silently resized.
  // Object-anchored building doors are NEVER touched.
  // Recover EVERY historical point Portal from an already playable region,
  // not just the first broken link. Object-anchored doors remain untouched.
  const blocked=next.portals.filter(p=>p.enabled!==false&&
    p.trigger?.kind==='point'&&
    playableExteriorArea(next.areas.find(a=>a.id===p.sourceAreaId))&&
    !playableSculptArea(next.areas.find(a=>a.id===p.targetAreaId)));
  for(const old of blocked){
    const destination=old.sourceAreaId===source.id?target:source;
    next=updatePortal(next,old.id,p=>{
      p.targetAreaId=destination.id;
      p.targetSpawnId=destination.spawns[0].id;
      p.visual={...p.visual,label:destination.label??destination.id};
    });
  }
  const knownPortals=new Set(next.portals.map(p=>p.id));
  next=connectWorldAreas(next,{
    sourceAreaId:source.id,targetAreaId:target.id,returnPortal:true
  });
  // Fresh reciprocal Portals are aligned with the prefab's WALKABLE road,
  // including the return journey. Existing authored triggers are never moved.
  for(const portal of next.portals.filter(p=>!knownPortals.has(p.id)&&
    p.trigger?.kind==='point')){
    const from=next.areas.find(a=>a.id===portal.sourceAreaId);
    next=placeSculptWorldPortal(next,portal.id,
      mapEdgePoint(sculptWorldAreaScene(from),'exit'));
  }
  // The destination returns using its own canonical Portal, not a UI teleport.
  const reverse=next.portals.find(p=>p.sourceAreaId===target.id&&
    p.targetAreaId===source.id);
  if(!reverse)throw Error('Retour réciproque absent');
  if(!playableExteriorArea(next.areas.find(a=>a.id===next.initialAreaId)))
    next=setWorldInitialArea(next,source.id);
  if(initializeEncounters)next=initializeWorldPresetEncounters(next);
  next=createWorldBuilderDraft(next);
  return Object.freeze({document:next,sourceAreaId:source.id,targetAreaId:target.id,
    previousAreaIds:Object.freeze([...previousIds]),retargetedPortalId:blocked[0]?.id??null,
    retargetedPortalIds:Object.freeze(blocked.map(p=>p.id)),
    createdAreaIds:Object.freeze(next.areas.filter(a=>!previousIds.has(a.id)).map(a=>a.id))});
}
