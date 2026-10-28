// Reusable, explicit map-template library. A preset is a snapshot of the
// existing SculptPreviewScene contract, NEVER a WorldDocument/Portal/Spawn
// authority. Applying it goes through saveSculptWorldArea once.
import {serializeSculptPreviewScene,importSculptPreviewScene} from '../world/sculpt-scene-preview.js';
import {addWorldArea,connectWorldAreas} from './world-builder-draft.js';
import {saveSculptWorldArea} from './sculpt-world-area-link.js';

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
  if(kind==='dungeon'){
    if(!hostAreaId||hostAreaId===area.id||
       !next.areas.some(entry=>entry.id===hostAreaId))
      throw Error('Sélectionne une zone hôte pour ce donjon');
    next=connectWorldAreas(next,{sourceAreaId:hostAreaId,
      targetAreaId:area.id,returnPortal:true});
  }
  return next;
}
