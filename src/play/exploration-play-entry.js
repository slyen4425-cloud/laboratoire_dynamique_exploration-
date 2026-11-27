import {openWorldDocumentReleaseAccessV1} from '../storage/world-document-release-access-v1.js';
import {createExplorationUniverseWorkspaceStorageV1} from '../storage/exploration-universe-workspace-storage-v1.js';
import {
  createNewExplorationPlay,readExplorationPlay,explorationPlayNavigationKey
} from './exploration-play-session.js';

const $=id=>document.getElementById(id);
const message=(value,error=false)=>{$('play-status').textContent=value;$('play-status').dataset.error=String(error);};
let world,playOptions,access,playStorage;
const universeId=new URL(document.URL).searchParams.get('universe');
const playUrl=()=> './sculpt-lab.html?play=1'+
  (playOptions?'&adventureSession='+encodeURIComponent(playOptions.sessionId):'')+
  (universeId?'&universe='+encodeURIComponent(universeId):'');
try{
  access=await openWorldDocumentReleaseAccessV1({storage:window.localStorage,sessionStorage:window.sessionStorage,universeId});
  playStorage=universeId===null?window.localStorage:createExplorationUniverseWorkspaceStorageV1(window.localStorage,universeId);
  const sessionId=new URL(document.URL).searchParams.get('adventureSession');
  if(sessionId!==null){
    explorationPlayNavigationKey(sessionId); // reject unsafe or empty identity
    playOptions={sessionId};
  }
  world=await access.readDraft();
  if(!world){
    $('play-world-name').textContent='Aucun monde enregistré';
    $('play-world-detail').textContent='Ouvre le World Builder, prépare une carte 2,5D et définis le Spawn initial.';
    message('Une partie ne peut pas démarrer sans vrai WorldDocument. Aucune carte de démonstration ne sera utilisée.',true);
  }else{
    const area=world.areas.find(a=>a.id===world.initialAreaId);
    $('play-world-name').textContent='🌍 '+world.id;
    $('play-world-detail').textContent='Départ : '+(area?.label||area?.id||'non configuré')+
      ' · '+world.areas.length+' zone(s)';
    // GenSRPG owns New Game for a scoped AdventureSession; Exploration only
    // lets that already-created session Continue in the canonical world.
    $('play-new').disabled=Boolean(playOptions);
    $('play-new').hidden=Boolean(playOptions);
    try{
      const existing=readExplorationPlay(playStorage,world,playOptions);
      if(existing){
        $('play-continue').disabled=false;
        const savedArea=world.areas.find(a=>a.id===existing.currentAreaId);
        message('Partie enregistrée : '+(savedArea?.label||savedArea?.id)+
          '. Tu peux continuer ou créer une nouvelle partie.');
      }else message(playOptions?
        'Session GenSRPG sans checkpoint : crée et lance la partie depuis Aventure.':
        'Aucune partie en cours. Nouvelle partie démarre au Spawn officiel du monde.');
    }catch(error){
      message(error.message+' · L’ancienne sauvegarde reste intacte.',true);
    }
  }
}catch(error){
  $('play-world-name').textContent='Monde indisponible';
  message('Impossible de lire les données du World Builder : '+error.message,true);
}
$('play-new').addEventListener('click',async()=>{
  if(!world)return;
  try{
    if(playOptions)throw Error('Nouvelle partie appartient à GenSRPG Aventure, pas au menu Exploration');
    world=await access.readDraft();
    if(!world)throw Error('Monde enregistré indisponible');
    if(playStorage.getItem(playOptions?
      explorationPlayNavigationKey(playOptions.sessionId):explorationPlayNavigationKey())&&
       !window.confirm('Nouvelle partie : remplacer uniquement le checkpoint de navigation précédent ?'))return;
    createNewExplorationPlay(playStorage,world,playOptions);
    window.location.assign(playUrl());
  }catch(error){message(error.message,true);}
});
$('play-continue').addEventListener('click',async()=>{
  try{
    if(!access)throw Error('Stockage WorldDocument indisponible');
    world=await access.readDraft();
    if(!world||!readExplorationPlay(playStorage,world,playOptions))
      throw new Error('Aucune partie enregistrée');
    window.location.assign(playUrl());
  }catch(error){message(error.message,true);}
});
