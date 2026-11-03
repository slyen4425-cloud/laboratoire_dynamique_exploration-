import {readWorldAssemblerDraft} from '../builder/world-assembler-handoff.js';
import {
  createNewExplorationPlay,readExplorationPlay
} from './exploration-play-session.js';

const $=id=>document.getElementById(id);
const message=(value,error=false)=>{$('play-status').textContent=value;$('play-status').dataset.error=String(error);};
const playUrl='./sculpt-lab.html?play=1';
let world;
try{
  world=readWorldAssemblerDraft(window.localStorage);
  if(!world){
    $('play-world-name').textContent='Aucun monde enregistré';
    $('play-world-detail').textContent='Ouvre le World Builder, prépare une carte 2,5D et définis le Spawn initial.';
    message('Une partie ne peut pas démarrer sans vrai WorldDocument. Aucune carte de démonstration ne sera utilisée.',true);
  }else{
    const area=world.areas.find(a=>a.id===world.initialAreaId);
    $('play-world-name').textContent='🌍 '+world.id;
    $('play-world-detail').textContent='Départ : '+(area?.label||area?.id||'non configuré')+
      ' · '+world.areas.length+' zone(s)';
    $('play-new').disabled=false;
    try{
      const existing=readExplorationPlay(window.localStorage,world);
      if(existing){
        $('play-continue').disabled=false;
        const savedArea=world.areas.find(a=>a.id===existing.currentAreaId);
        message('Partie enregistrée : '+(savedArea?.label||savedArea?.id)+
          '. Tu peux continuer ou créer une nouvelle partie.');
      }else message('Aucune partie en cours. Nouvelle partie démarre au Spawn officiel du monde.');
    }catch(error){
      message(error.message+' · L’ancienne sauvegarde reste intacte.',true);
    }
  }
}catch(error){
  $('play-world-name').textContent='Monde indisponible';
  message('Impossible de lire les données du World Builder : '+error.message,true);
}
$('play-new').addEventListener('click',()=>{
  if(!world)return;
  try{
    if(window.localStorage.getItem('gensrpg.exploration.play.navigation.v1')&&
       !window.confirm('Nouvelle partie : remplacer uniquement le checkpoint de navigation précédent ?'))return;
    createNewExplorationPlay(window.localStorage,world);
    window.location.assign(playUrl);
  }catch(error){message(error.message,true);}
});
$('play-continue').addEventListener('click',()=>{
  try{
    if(!world||!readExplorationPlay(window.localStorage,world))
      throw new Error('Aucune partie enregistrée');
    window.location.assign(playUrl);
  }catch(error){message(error.message,true);}
});
