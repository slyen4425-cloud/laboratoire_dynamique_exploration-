// Native play-navigation checkpoint ONLY. WorldDocument remains authored by
// World Builder; combat, species, XP, inventory and full game saves belong to
// their existing Combat / GenSRPG Aventure owners, not to this module.
import {createInitialExplorationState} from '../world/world-document-model.js';
import {sculptWorldAreaScene} from '../builder/sculpt-world-area-link.js';

export const EXPLORATION_PLAY_NAV_KEY='gensrpg.exploration.play.navigation.v1';
export const EXPLORATION_PLAY_NAV_SCHEMA='gensrpg.exploration.play-navigation.v1';

function authoritativeWorld(world){
  if(!world||typeof world!=='object'||typeof world.id!=='string'||
    !world.id||!Array.isArray(world.areas)||!world.areas.length||
    typeof world.initialAreaId!=='string')
    throw new Error('WorldDocument du World Builder requis pour Jouer');
  return world;
}

export function playWorldFingerprint(raw){
  const world=authoritativeWorld(raw);
  // Revision token, not a cryptographic signature: detect edits to the
  // canonical graph before resuming a position into a different world.
  const serialized=JSON.stringify(world);
  let a=2166136261,b=0;
  for(let i=0;i<serialized.length;i++){
    const code=serialized.charCodeAt(i);
    a=Math.imul(a^code,16777619);
    b=Math.imul(b+code+1,2246822519);
  }
  return serialized.length+':'+(a>>>0).toString(36)+':'+(b>>>0).toString(36);
}

function requirePlayableState(world,state,validatedAreas=null){
  const area=world.areas.find(a=>a.id===state?.currentAreaId);
  if(!area)throw new Error('WorldArea de partie absente du WorldDocument');
  // The same adapter used by the genuine Sculpt engine checks 2.5D area
  // dimensions and authored objects. No demo terrain fallback.
  if(!validatedAreas?.has(area.id)){
    sculptWorldAreaScene(area);
    validatedAreas?.add(area.id);
  }
  if(!Number.isFinite(state.x)||!Number.isFinite(state.y)||
     state.x<0||state.y<0||state.x>area.width||state.y>area.height)
    throw new Error('Position de partie invalide ou hors carte');
  return {currentAreaId:area.id,x:state.x,y:state.y};
}

function snapshot(world,state){
  const position=requirePlayableState(world,state);
  return Object.freeze({
    schema:EXPLORATION_PLAY_NAV_SCHEMA,version:1,
    worldId:world.id,worldFingerprint:playWorldFingerprint(world),
    ...position
  });
}

function storageRequired(storage){
  if(typeof storage?.setItem!=='function'||typeof storage?.getItem!=='function')
    throw new Error('Stockage du checkpoint de navigation indisponible');
  return storage;
}

export function createNewExplorationPlay(storage,rawWorld){
  const world=authoritativeWorld(rawWorld);
  const initial=createInitialExplorationState(world);
  if(!initial)throw new Error('Spawn initial manquant : configure le départ dans World Builder');
  const result=snapshot(world,initial);
  storageRequired(storage).setItem(EXPLORATION_PLAY_NAV_KEY,JSON.stringify(result));
  return result;
}

export function readExplorationPlay(storage,rawWorld){
  const world=authoritativeWorld(rawWorld);
  const saved=storageRequired(storage).getItem(EXPLORATION_PLAY_NAV_KEY);
  if(saved===null)return null;
  let value;
  try{value=JSON.parse(saved);}
  catch{throw new Error('Checkpoint de partie illisible : sauvegarde conservée');}
  if(value?.schema!==EXPLORATION_PLAY_NAV_SCHEMA||value?.version!==1)
    throw new Error('Version du checkpoint de partie incompatible');
  if(value.worldId!==world.id||value.worldFingerprint!==playWorldFingerprint(world))
    throw new Error('Le monde a été modifié depuis la sauvegarde : partie conservée, reprise bloquée');
  const position=requirePlayableState(world,value);
  return Object.freeze({...value,...position});
}

// The play runtime uses one pre-validated document for its entire lifetime.
// Rehashing a large WorldDocument on each movement paint causes PC microstutter;
// this checkpoint writer validates the WorldDocument ONCE on creation, then
// serializes only actor position into the existing navigation save key.
export function createExplorationPlayProgressWriter(storage,rawWorld){
  const world=authoritativeWorld(rawWorld);
  const current=readExplorationPlay(storage,world);
  if(!current)throw new Error('Aucune partie à reprendre');
  const validatedAreas=new Set([current.currentAreaId]);
  return position=>{
    const valid=requirePlayableState(world,position,validatedAreas);
    const result=Object.freeze({...current,...valid});
    storage.setItem(EXPLORATION_PLAY_NAV_KEY,JSON.stringify(result));
    return result;
  };
}

export function saveExplorationPlayPosition(storage,rawWorld,position){
  const world=authoritativeWorld(rawWorld);
  const previous=readExplorationPlay(storage,world);
  if(!previous)throw new Error('Aucune partie à sauvegarder : utilise Nouvelle partie');
  const updated=snapshot(world,position);
  storage.setItem(EXPLORATION_PLAY_NAV_KEY,JSON.stringify(updated));
  return updated;
}
