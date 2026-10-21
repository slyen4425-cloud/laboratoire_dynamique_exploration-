// Independent soundtrack *bindings* for a World Builder project.
// Does not duplicate SoundtrackProjectV1 or the shared audio playback owner.
export const EXPLORATION_SOUNDTRACK_BINDINGS_V1 = "exploration-soundtrack-bindings-v1";
const ID=/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,159}$/;
function id(value,label){
  if(typeof value!=="string" || !ID.test(value))throw new TypeError(label+" must be a valid identifier");
  return value;
}
function record(value,label){
  if(!value || typeof value!=="object" || Array.isArray(value))throw new TypeError(label+" must be an object");
  return value;
}
function keysOnly(value,allowed,label){
  for(const k of Object.keys(value))if(!allowed.includes(k))throw new TypeError(label+" unknown field: "+k);
}
function mappings(value,label){
  record(value,label);
  const pairs=Object.entries(value).map(([key,scene])=>[id(key,label+" key"),id(scene,label+" scene")]);
  return Object.freeze(Object.fromEntries(pairs));
}
export function createEmptyExplorationSoundtrackBindingsV1(projectId){
  return Object.freeze({
    schema:EXPLORATION_SOUNDTRACK_BINDINGS_V1,version:1,projectId:id(projectId,"projectId"),
    defaultSceneId:null,combatSceneId:"capture:combat:normal",
    areaScenes:Object.freeze({}),terrainFamilyScenes:Object.freeze({})
  });
}
export function normalizeExplorationSoundtrackBindingsV1(raw){
  record(raw,"soundtrack bindings");
  keysOnly(raw,["schema","version","projectId","defaultSceneId","combatSceneId","areaScenes","terrainFamilyScenes"],"bindings");
  if(raw.schema!==EXPLORATION_SOUNDTRACK_BINDINGS_V1 || raw.version!==1)throw new TypeError("ExplorationSoundtrackBindingsV1 expected");
  const projectId=id(raw.projectId,"projectId");
  const defaultSceneId=raw.defaultSceneId===null?null:id(raw.defaultSceneId,"defaultSceneId");
  const combatSceneId=id(raw.combatSceneId,"combatSceneId");
  return Object.freeze({
    schema:EXPLORATION_SOUNDTRACK_BINDINGS_V1,version:1,projectId,
    defaultSceneId,combatSceneId,
    areaScenes:mappings(raw.areaScenes,"areaScenes"),
    terrainFamilyScenes:mappings(raw.terrainFamilyScenes,"terrainFamilyScenes")
  });
}
export function setExplorationSoundtrackBindingV1(raw,kind,contextId,sceneId){
  const base=normalizeExplorationSoundtrackBindingsV1(raw);
  if(kind==="default"){
    if(contextId!==null)throw new TypeError("default contextId must be null");
    return normalizeExplorationSoundtrackBindingsV1({...base,defaultSceneId:sceneId===null?null:id(sceneId,"sceneId")});
  }
  if(kind==="combat"){
    if(contextId!==null)throw new TypeError("combat contextId must be null");
    return normalizeExplorationSoundtrackBindingsV1({...base,combatSceneId:id(sceneId,"sceneId")});
  }
  const field=kind==="area"?"areaScenes":kind==="terrainFamily"?"terrainFamilyScenes":null;
  if(!field)throw new TypeError("unknown binding kind");
  const key=id(contextId,"contextId");
  const next={...base[field]};
  if(sceneId===null) delete next[key];
  else next[key]=id(sceneId,"sceneId");
  return normalizeExplorationSoundtrackBindingsV1({...base,[field]:next});
}
export function resolveExplorationSoundtrackSceneV1(raw,{areaId,terrainFamilyId=null}){
  const b=normalizeExplorationSoundtrackBindingsV1(raw);
  id(areaId,"areaId");
  if(terrainFamilyId!==null)id(terrainFamilyId,"terrainFamilyId");
  return b.areaScenes[areaId] ?? (terrainFamilyId===null?undefined:b.terrainFamilyScenes[terrainFamilyId]) ?? b.defaultSceneId;
}
export function createExplorationSoundtrackContextV1(bindings){
  const b=normalizeExplorationSoundtrackBindingsV1(bindings);
  return Object.freeze({
    projectId:b.projectId,
    battleSceneId:b.combatSceneId,
    sceneForArea:({areaId,terrainFamilyId})=>resolveExplorationSoundtrackSceneV1(b,{areaId,terrainFamilyId})
  });
}
