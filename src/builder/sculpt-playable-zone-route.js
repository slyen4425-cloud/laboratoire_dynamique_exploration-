// Explicit World Builder repair command. It only modifies the SAME canonical
// WorldDocument; it never rescales or replaces unsupported 2400×1600 areas.
import {createWorldBuilderDraft,connectWorldAreas,setWorldInitialArea,updatePortal}
  from './world-builder-draft.js';
import {sculptWorldAreaScene,placeSculptWorldPortal} from './sculpt-world-area-link.js';
import {createWorldAreaFromSculptMapPreset} from './sculpt-map-preset-library.js';
import {builtinSculptMapPresets} from './sculpt-builtin-map-presets.js';

export function playableExteriorArea(area){
  if(!area||area.kind!=='exterior')return false;
  try{sculptWorldAreaScene(area);return true;}
  catch{return false;}
}
const nextArea=(after,before)=>after.areas.find(a=>!before.has(a.id));

export function makePlayableZoneRoute(draft,{selectedAreaId,preset=builtinSculptMapPresets()[3]}={}){
  let next=createWorldBuilderDraft(draft);
  const previousIds=new Set(next.areas.map(a=>a.id));
  let source=next.areas.find(a=>a.id===selectedAreaId&&playableExteriorArea(a))
    ??next.areas.find(playableExteriorArea);
  if(!source){
    const before=new Set(next.areas.map(a=>a.id));
    next=createWorldAreaFromSculptMapPreset(next,builtinSculptMapPresets()[0],{
      name:'Forêt de départ · 2,5D',kind:'exterior',hostAreaId:null
    });
    source=nextArea(next,before);
    if(!source)throw Error('Carte de départ 2,5D non créée');
  }
  let target=next.areas.find(a=>a.id!==source.id&&playableExteriorArea(a));
  if(!target){
    const before=new Set(next.areas.map(a=>a.id));
    next=createWorldAreaFromSculptMapPreset(next,preset,{
      name:'Destination · '+preset.name,kind:'exterior',hostAreaId:null
    });
    target=nextArea(next,before);
    if(!target)throw Error('Destination 2,5D non créée');
  }
  // This action is explicit and confirmed in the UI. Existing invalid
  // outbound links are redirected, not deleted or silently resized.
  // Object-anchored building doors are NEVER touched.
  const blocked=next.portals.find(p=>p.sourceAreaId===source.id&&
    p.enabled!==false&&p.trigger?.kind==='point'&&
    !playableExteriorArea(next.areas.find(a=>a.id===p.targetAreaId)));
  if(blocked){
    next=updatePortal(next,blocked.id,p=>{
      p.targetAreaId=target.id;
      p.targetSpawnId=target.spawns[0].id;
      p.visual={...p.visual,label:target.label??target.id};
    });
  }
  next=connectWorldAreas(next,{
    sourceAreaId:source.id,targetAreaId:target.id,returnPortal:true
  });
  // A newly built link follows the same actual Sculpt road endpoints as
  // template links; do not move any previously authored portal trigger.
  const newExit=next.portals.find(p=>p.sourceAreaId===source.id&&
    p.targetAreaId===target.id&&p.id!==blocked?.id);
  if(newExit){
    const path=source.surface?.routes?.[0]?.points??[];
    if(path.length){
      const y=Math.max(48,Math.min(source.height-48,path.at(-1).y));
      next=placeSculptWorldPortal(next,newExit.id,{x:source.width-64,y});
    }
  }
  // The destination returns using its own canonical Portal, not a UI teleport.
  const reverse=next.portals.find(p=>p.sourceAreaId===target.id&&
    p.targetAreaId===source.id);
  if(!reverse)throw Error('Retour réciproque absent');
  if(!playableExteriorArea(next.areas.find(a=>a.id===next.initialAreaId)))
    next=setWorldInitialArea(next,source.id);
  next=createWorldBuilderDraft(next);
  return Object.freeze({document:next,sourceAreaId:source.id,targetAreaId:target.id,
    previousAreaIds:Object.freeze([...previousIds]),retargetedPortalId:blocked?.id??null,
    createdAreaIds:Object.freeze(next.areas.filter(a=>!previousIds.has(a.id)).map(a=>a.id))});
}
