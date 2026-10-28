// Reusable, explicit map-template library. A preset is a snapshot of the
// existing SculptPreviewScene contract, NEVER a WorldDocument/Portal/Spawn
// authority. Applying it goes through saveSculptWorldArea once.
import {serializeSculptPreviewScene,importSculptPreviewScene} from '../world/sculpt-scene-preview.js';
import {addWorldArea,connectWorldAreas,addSpawn,updateSpawn,updatePortal,createWorldBuilderDraft,createBuildingInteriorLink} from './world-builder-draft.js';
import {saveSculptWorldArea,placeSculptWorldPortal} from './sculpt-world-area-link.js';
import {createBlankSculptPreviewScene} from '../world/sculpt-scene-preview.js';
import {appendSculptSurfaceStroke,normalizeSculptSurface} from '../world/sculpt-surface-paint.js';
import {appendInteriorWall} from '../world/interior-wall-model.js';

export const SCULPT_MAP_PRESET_KEY='gensrpg.exploration.map-presets.v1';
export const SCULPT_MAP_PRESET_KIND='gensrpg-sculpt-map-preset';
export const SCULPT_MAP_PRESET_LIMIT=24;
const nameOf=value=>{
  const name=typeof value==='string'?value.trim():'';
  if(!name||name.length>64)throw Error('Donne un nom de préset (64 caractères maximum)');
  return name;
};
export function importSculptMapPreset(raw){
  let value;
  try{value=typeof raw==='string'?JSON.parse(raw):raw;}
  catch{throw Error('Fichier de préset JSON invalide');}
  if(value?.kind!==SCULPT_MAP_PRESET_KIND||value.version!==1||
     typeof value.name!=='string'||!value.scene)
    throw Error('Format de préset de carte inconnu');
  const name=nameOf(value.name);
  const validated=importSculptPreviewScene(value.scene);
  const scene=JSON.parse(serializeSculptPreviewScene(validated.terrain,
    validated.objects,validated.surface,validated.actors));
  const id=typeof value.id==='string'&&/^map-preset-[0-9]+$/.test(value.id)?
    value.id:'map-preset-1';
  return Object.freeze({kind:SCULPT_MAP_PRESET_KIND,version:1,id,name,scene});
}
export function createSculptMapPreset(scene,{name='Ma carte',id='map-preset-1'}={}){
  const source=JSON.parse(serializeSculptPreviewScene(
    scene?.terrain,scene?.objects??[],scene?.surface,scene?.actors??[]));
  return importSculptMapPreset({kind:SCULPT_MAP_PRESET_KIND,version:1,
    id,name:nameOf(name),scene:source});
}
export function readSculptMapPresets(storage){
  if(!storage||typeof storage.getItem!=='function')return [];
  const raw=storage.getItem(SCULPT_MAP_PRESET_KEY);
  if(!raw)return [];
  let parsed;
  try{parsed=JSON.parse(raw);}catch{throw Error('Bibliothèque de présets corrompue : exporte ou restaure une sauvegarde');}
  if(!Array.isArray(parsed)||parsed.length>SCULPT_MAP_PRESET_LIMIT)
    throw Error('Bibliothèque de présets invalide');
  const names=new Set(),ids=new Set();
  return parsed.map(entry=>{
    const p=importSculptMapPreset(entry);
    if(ids.has(p.id)||names.has(p.name.toLocaleLowerCase('fr')))
      throw Error('Bibliothèque de présets : doublon incohérent');
    names.add(p.name.toLocaleLowerCase('fr'));ids.add(p.id);return p;
  });
}
export function saveSculptMapPreset(storage,scene,name){
  if(!storage||typeof storage.setItem!=='function')
    throw Error('Stockage local indisponible : utilise export JSON');
  const list=readSculptMapPresets(storage),n=nameOf(name);
  const existing=list.find(p=>p.name.toLocaleLowerCase('fr')===n.toLocaleLowerCase('fr'));
  if(!existing&&list.length>=SCULPT_MAP_PRESET_LIMIT)
    throw Error('Bibliothèque pleine : 24 présets maximum');
  let id=existing?.id;
  if(!id){let i=1;const used=new Set(list.map(p=>p.id));
    while(used.has('map-preset-'+i))i++;
    id='map-preset-'+i;
  }
  const preset=createSculptMapPreset(scene,{name:n,id});
  const next=existing?list.map(p=>p.id===id?preset:p):[...list,preset];
  storage.setItem(SCULPT_MAP_PRESET_KEY,JSON.stringify(next));
  return preset;
}
export function addImportedSculptMapPreset(storage,raw){
  const preset=importSculptMapPreset(raw);
  // Imported names are explicit; reuse the same canonical name-ownership rule.
  const scene=importSculptPreviewScene(preset.scene);
  return saveSculptMapPreset(storage,scene,preset.name);
}
// Gate placement is a projection of the existing Sculpt route, not a new
// persisted Portal geometry or template topology. The WorldDocument is owner.
function mapEdgePoint(scene,side){
  const width=scene.terrain.width*28,height=scene.terrain.height*21;
  const firstRoute=scene.surface.routes[0]?.points??[];
  const endpoint=side==='entry'?firstRoute[0]:firstRoute.at(-1);
  return {x:side==='entry'?64:width-64,
    y:Math.max(48,Math.min(height-48,endpoint?.y??height/2))};
}
export function createWorldAreaFromSculptMapPreset(draft,preset,{
  name,kind='exterior',hostAreaId=null
}={}){
  const saved=importSculptMapPreset(preset);
  const source=importSculptPreviewScene(saved.scene);
  const before=new Set(draft.areas.map(area=>area.id));
  let next=addWorldArea(draft,{name:nameOf(name??saved.name),kind,
    width:source.terrain.width*28,height:source.terrain.height*21});
  const area=next.areas.find(entry=>!before.has(entry.id));
  if(!area)throw Error('WorldArea de préset non créée');
  next=saveSculptWorldArea(next,area.id,source);
  // Position the REAL Spawn on the starting edge, even if the template
  // is used as a standalone map. Never add Spawn/Portal data to the preset.
  const entry=mapEdgePoint(source,'entry');
  next=updateSpawn(next,area.id,area.spawns[0].id,entry);
  if(kind==='dungeon'&&(!hostAreaId||hostAreaId===area.id||
     !next.areas.some(other=>other.id===hostAreaId)))
    throw Error('Sélectionne une zone hôte pour ce donjon');
  // All maps created *inside an existing world* are connected by reciprocal
  // canonical Portals, not just dungeons. An unrelated imported template
  // without hostAreaId remains deliberately standalone.
  if(hostAreaId){
    const host=next.areas.find(other=>other.id===hostAreaId);
    if(!host||host.id===area.id)throw Error('Zone hôte introuvable');
    next=connectWorldAreas(next,{
      sourceAreaId:hostAreaId,targetAreaId:area.id,returnPortal:true
    });
    const hostOutbound=next.portals.find(p=>p.sourceAreaId===hostAreaId&&
      p.targetAreaId===area.id);
    if(hostOutbound&&host.sculptTerrain&&host.surface?.routes?.[0]?.points?.length){
      const route=host.surface.routes[0].points;
      next=placeSculptWorldPortal(next,hostOutbound.id,{
        x:host.width-64,y:Math.max(48,Math.min(host.height-48,route.at(-1).y))});
    }
    const outbound=next.portals.find(p=>p.sourceAreaId===area.id&&
      p.targetAreaId===hostAreaId);
    if(!outbound)throw Error('Passage retour non créé');
    // Exit on the opposite edge, aligned with the last path segment.
    next=placeSculptWorldPortal(next,outbound.id,mapEdgePoint(source,'exit'));
    // A dedicated host arrival is placed at its own entry edge. The existing
    // initial Spawn is NEVER moved, nor are any existing Portal destinations.
    const hostSurface=host.surface?.routes?.[0]?.points??[];
    const hostY=hostSurface[0]?.y??host.height/2;
    next=addSpawn(next,hostAreaId,{x:Math.min(64,host.width/2),
      y:Math.max(48,Math.min(host.height-48,hostY))});
    const last=next.areas.find(a=>a.id===hostAreaId).spawns.at(-1);
    next=updatePortal(next,outbound.id,p=>{p.targetSpawnId=last.id;});
  }
  // A native map preset only contains decor. Once instanced as a WorldArea,
  // link each real house to an *independent* editable interior, using the
  // existing Building door anchor, WorldArea, Portal and Spawn model.
  // Imported user presets use the very same contract, if they have houses.
  const buildings=next.areas.find(a=>a.id===area.id).objects
    .filter(obj=>obj.objectDefinitionId.startsWith('objectdef.building.'));
  for(const [index,building] of buildings.entries()){
    const prior=new Set(next.areas.map(a=>a.id));
    next=createBuildingInteriorLink(next,{
      sourceAreaId:area.id,buildingId:building.id,
      anchorId:'main-door',interiorSize:{width:18*28,height:14*21}
    });
    const room=next.areas.find(a=>!prior.has(a.id));
    if(!room)throw Error('Impossible de raccorder la maison au modèle de pièce');
    const blank=createBlankSculptPreviewScene({width:18,height:14});
    // Floors are actual WorldSurface strokes; partitions are canonical
    // WorldArea.walls and participate in the shared collision model.
    const surface=appendSculptSurfaceStroke(
      normalizeSculptSurface({...blank.surface,
        baseMaterialId:'floor.wood.house',
        baseTerrainFamilyId:source.surface.baseTerrainFamilyId}),
      {materialId:index%2===0?'floor.tile.light':'floor.tile.sandstone',
        points:[{x:64,y:78},{x:18*28-64,y:78}],width:86});
    next=saveSculptWorldArea(next,room.id,{...blank,surface});
    let walls=appendInteriorWall([],{a:{x:52,y:115},b:{x:200,y:115}});
    walls=appendInteriorWall(walls,{a:{x:304,y:115},b:{x:452,y:115}});
    next=createWorldBuilderDraft({...next,areas:next.areas.map(a=>
      a.id===room.id?{...a,label:'Intérieur · '+(building.objectDefinitionId.includes('inn.')?'Auberge':'Maison')+
        ' '+(index+1),walls,wallMaterialId:'wood'}:a)});
  }
  // Canonical validation of reciprocal links, size and Spawn refs.
  return createWorldBuilderDraft(next);
}
