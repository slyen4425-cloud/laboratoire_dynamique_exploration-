// Standalone NPC editor. Borrow the hero editor's rendering pipeline, never
// its database, gameplay or world-placement state.
import {createUserNpcDefinitionV1,createUserNpcAssetResolverV1,
 exportUserNpcBundleV1,importUserNpcBundleV1,mintUserNpcIdV1} from './user-npc-definition-v1.js';
import {createUserNpcStoreV1} from '../storage/user-npc-store-v1.js';
import {mountNpcVisualLibraryV1} from './npc-visual-library-v1.js';
import {MAP_ACTOR_COMPASS_DIRECTIONS_V1} from './map-actor-visual-model.js';
import {readActorAnimationZipV1} from './actor-animation-zip-import-v1.js';
import {createImageAssetLoader} from '../assets/image-asset-loader.js';
import {createMapActorVisualPreparer} from '../assets/map-actor-visual-preparer.js';
import {createMapActorRenderer} from '../render/map-actor-renderer.js';
import {loadCaptureShowcaseEncounterSourceV1,loadCaptureAuthorEncounterBundleV1} from '../capture/capture-showcase-encounter-source-v1.js';
import {normalizeNpcCombatInstanceTransportV1} from './npc-combat-instance-transport-v1.js';
import {projectNpcCombatAuthoringCatalogV1} from './npc-combat-authoring-catalog-v1.js';
import {NPC_TRAINER_ROSTER_LIMIT_V1} from './map-actor-npc-settings-v1.js';

import {mountNpcWildBehaviorControlsV1} from './npc-wild-behavior-controls-v1.js';
const $=id=>document.getElementById(id),store=createUserNpcStoreV1();
const wildBehaviorControls=mountNpcWildBehaviorControlsV1($('npc-wild-behavior'),markDirty);
const canvas=$('npc-canvas'),ctx=canvas.getContext('2d');
let selected=null,preview=null,epoch=0,disposed=false;
let previewMoving=false,previewDirection='S',busy=false,dirty=false;
let chosenLibraryImage=null;
let portraitUrl=null,galleryUrls=[];
let officialCreatures=Object.freeze([]),rewardChoices=Object.freeze([]);
let trainerRosterDraft=[],rewardItemsDraft=[],merchantIdDraft='',wildCreatureDraft=null;
let rewardRequestId=null,npcCatalogLoading=false;
let inlineMerchantNonce=null,inlineMerchantId=null;
let combatTemplates=new Map(),combatCatalogLoading=false;
const angles={E:0,SE:Math.PI/4,S:Math.PI/2,SW:3*Math.PI/4,
 W:Math.PI,NW:-3*Math.PI/4,N:-Math.PI/2,NE:-Math.PI/4};
function notify(message,error=false){
 $('npc-status').textContent=message;$('npc-status').dataset.error=String(error);
}
function number(id){
 const value=Number($(id).value);
 if(!$(id).value.trim()||!Number.isFinite(value))
  throw new RangeError('Réglage numérique invalide : '+id);
 return value;
}
function markDirty(){
 dirty=true;
 $('npc-edit-state').textContent='Modifications non enregistrées · utilise « Voir mes modifications » puis Enregistrer.';
}
function syncMode(){
 const mode=$('npc-mode').value;
 $('npc-fps-label').hidden=mode==='image';
 $('npc-idle-label').hidden=mode!=='frames';
 $('npc-walk-label').hidden=mode!=='frames';
 $('npc-direction-inputs').hidden=mode!=='directions';
}
for(const dir of MAP_ACTOR_COMPASS_DIRECTIONS_V1){
 const label=document.createElement('label');
 label.textContent=dir+' · 6 images ordonnées';
 const input=document.createElement('input');
 input.id='npc-dir-'+dir;input.type='file';input.multiple=true;
 input.accept='image/png,image/webp';
 const zip=document.createElement('input');
 zip.id='npc-zip-'+dir;zip.type='file';zip.accept='.zip,application/zip';
 zip.setAttribute('aria-label','ZIP de la direction '+dir);
 const caption=document.createElement('small');
 caption.textContent='Ou ZIP : 6 images PNG/WebP numérotées';
 const status=document.createElement('output');status.id='npc-zip-status-'+dir;
 zip.addEventListener('change',()=>{
  markDirty();
  if(!zip.files[0]){status.textContent='';return;}
  input.value='';
  readActorAnimationZipV1(zip.files[0]).then(frames=>{
   if(zip.files[0])status.textContent=frames.length+' images vérifiées · '+dir;
  }).catch(error=>{status.textContent=error.message;notify(error.message,true);});
 });
 input.addEventListener('change',()=>{
  if(input.files.length){zip.value='';status.textContent='';}
  markDirty();
 });
 label.append(input,caption,zip,status);$('npc-direction-files').append(label);
}
// The same official Capture bestiary projection and native Scenario NPC setting
// contract supply selections here and in the historical Sculpt editor. No
// second species, item, currency, merchant or combat authority is created.
function roleSections(){
 const role=$('npc-role').value,trainer=role.startsWith('trainer-');
 $('npc-trainer-config').hidden=!trainer;
 $('npc-merchant-config').hidden=role!=='merchant';
 $('npc-wild-config').hidden=role!=='wild';
 if(trainer)renderTrainerRows();
 if(role==='merchant')renderMerchantStatus();
 if(role==='wild')renderWildChoices();
}
function creatureName(id){
 return officialCreatures.find(c=>c.id===id)?.name??'Créature non disponible dans le Bestiaire officiel';
}
function officialSelect(select,list,{empty='Choisir…',selectedId='',missingLabel='Référence antérieure (catalogue indisponible)'}={}){
 select.replaceChildren(new Option(empty,''),
  ...list.map(entry=>new Option(entry.name,entry.id)));
 if(selectedId){
  if(!list.some(entry=>entry.id===selectedId))
   select.append(new Option(missingLabel,selectedId));
  select.value=selectedId;
 }
}
function renderCreatureChoices(){
 officialSelect($('npc-creature-choice'),officialCreatures,
  {empty:'Choisir une créature officielle…'});
 $('npc-creature-add').disabled=!officialCreatures.length||
  trainerRosterDraft.length>=NPC_TRAINER_ROSTER_LIMIT_V1;
 renderWildChoices();renderTrainerRows();
}
async function loadNpcCombatCatalog(){
 if(combatCatalogLoading)return;
 combatCatalogLoading=true;
 const status=$('npc-combat-catalog-status');
 if(status)status.textContent='Lecture des caractéristiques et compétences officielles…';
 try{
  const source=await loadCaptureAuthorEncounterBundleV1();
  combatTemplates=projectNpcCombatAuthoringCatalogV1(source);
  if(status)status.textContent=combatTemplates.size+
   ' modèles Combat disponibles. Les statistiques et compétences sont propres à chaque instance.';
 }catch(error){
  combatTemplates=new Map();
  if(status)status.textContent='Catalogue Combat indisponible : '+error.message+
   ' · les réglages précédents restent conservés.';
 }finally{combatCatalogLoading=false;renderTrainerRows();renderWildChoices();}
}
function editNpcCombatInstance(index,changes){
 const slot=index===null?wildCreatureDraft:trainerRosterDraft[index];
 if(!slot)return;
 const old=slot.npcInstance??{schema:'capture-npc-opponent-instance-v1'};
 const raw={...old,...changes};
 for(const key of ['displayName','statAllocations','skillIds']){
  if(raw[key]===undefined||raw[key]===null||raw[key]==='')delete raw[key];
 }
 const edited={...slot};
 if(Object.keys(raw).length===1)delete edited.npcInstance;
 else edited.npcInstance=normalizeNpcCombatInstanceTransportV1(raw);
 if(index===null)wildCreatureDraft=edited;
 else trainerRosterDraft=trainerRosterDraft.map((row,i)=>i===index?edited:row);
 markDirty();
}
function renderNpcCombatInstanceEditor(index,slot){
 const details=document.createElement('details');
 details.className='npc-combat-instance-editor';
 const title=document.createElement('summary');
 title.textContent='Statistiques et compétences personnalisées · '+creatureName(slot.creatureId);
 details.append(title);
 const template=combatTemplates.get(slot.creatureId);
 if(!template){
  const message=document.createElement('p');
  message.className='hint';
  message.textContent='Charge le Bestiaire Combat pour modifier cet adversaire. '+
    'Ses réglages précédents sont conservés.';
  details.append(message);return details;
 }
 const info=document.createElement('p');info.className='hint';
 info.textContent='Bonus d’instance ajoutés aux valeurs officielles, uniquement pour ce PNJ. '+
  'Les compétences possibles viennent du modèle Combat et doivent être débloquées au niveau choisi.';
 details.append(info);
 const name=document.createElement('label');
 name.textContent='Nom de ce combattant ';
 const nameInput=document.createElement('input');nameInput.type='text';
 nameInput.maxLength=80;
 nameInput.placeholder=template.name+' (nom officiel)';
 nameInput.value=slot.npcInstance?.displayName??'';
 nameInput.addEventListener('change',()=>editNpcCombatInstance(index,{
  displayName:nameInput.value.trim()||undefined
 }));
 name.append(nameInput);details.append(name);
 const stats=document.createElement('div');stats.className='npc-combat-stats';
 for(const stat of template.stats){
  const label=document.createElement('label');label.textContent=stat.label+' · base '+stat.base+' · bonus ';
  const input=document.createElement('input');input.type='number';
  input.min='0';input.max='100000';input.step='1';
  input.setAttribute('aria-label','Bonus '+stat.label+' pour '+template.name);
  input.value=String(slot.npcInstance?.statAllocations?.[stat.id]??0);
  input.addEventListener('change',()=>{
   const current=index===null?wildCreatureDraft:trainerRosterDraft[index];
   const previous=current?.npcInstance?.statAllocations??{};
   const bonus={...previous};
   if(!Number.isSafeInteger(Number(input.value))||Number(input.value)<0||
      Number(input.value)>100000){notify('Bonus invalide : '+stat.label,true);return;}
   if(Number(input.value)===0)delete bonus[stat.id];else bonus[stat.id]=Number(input.value);
   try{editNpcCombatInstance(index,{statAllocations:Object.keys(bonus).length?bonus:undefined});}
   catch(error){notify(error.message,true);}
  });
  label.append(input);stats.append(label);
 }
 details.append(stats);
 const skills=document.createElement('div');skills.className='npc-combat-skills';
 const head=document.createElement('p');head.textContent='Compétences autorisées (au moins une) :';
 skills.append(head);
 const selected=new Set(slot.npcInstance?.skillIds??template.skills.map(s=>s.id));
 for(const ability of template.skills){
  const label=document.createElement('label');label.className='npc-combat-skill';
  const check=document.createElement('input');check.type='checkbox';
  check.value=ability.id;check.checked=selected.has(ability.id);
  check.addEventListener('change',()=>{
   const ids=[...skills.querySelectorAll('input:checked')].map(el=>el.value);
   if(!ids.length){check.checked=true;notify('Conserve au moins une capacité en combat',true);return;}
   const all=template.skills.map(s=>s.id);
   const custom=ids.length===all.length&&ids.every((id,i)=>id===all[i])?undefined:ids;
   try{editNpcCombatInstance(index,{skillIds:custom});}
   catch(error){notify(error.message,true);}
  });
  label.append(check,document.createTextNode(ability.name));skills.append(label);
 }
 if(!template.skills.length){
  const unavailable=document.createElement('small');
  unavailable.textContent='Aucune capacité officielle proposée pour ce modèle.';
  skills.append(unavailable);
 }
 details.append(skills);
 return details;
}
function renderTrainerRows(){
 const panel=$('npc-trainer-rows');panel.replaceChildren();
 for(const [index,slot] of trainerRosterDraft.entries()){
  const row=document.createElement('div');row.className='npc-reference-row';
  const label=document.createElement('span');
  label.textContent=(index+1)+'. '+creatureName(slot.creatureId)+' · niveau '+slot.level;
  row.append(label);
  for(const [title,diff] of [['↑',-1],['↓',1]]){
   const move=document.createElement('button');move.type='button';
   move.textContent=title;
   move.disabled=index+diff<0||index+diff>=trainerRosterDraft.length;
   move.addEventListener('click',()=>{
    const next=[...trainerRosterDraft];
    [next[index],next[index+diff]]=[next[index+diff],next[index]];
    trainerRosterDraft=next;renderTrainerRows();markDirty();
   });
   row.append(move);
  }
  const del=document.createElement('button');del.type='button';
  del.textContent='✕';del.setAttribute('aria-label','Retirer '+creatureName(slot.creatureId));
  del.addEventListener('click',()=>{
   trainerRosterDraft=trainerRosterDraft.filter((_,i)=>index!==i);
   renderTrainerRows();markDirty();
  });
  row.append(del);panel.append(row,renderNpcCombatInstanceEditor(index,slot));
 }
 if(!trainerRosterDraft.length)panel.textContent='Aucune créature : ajoute une espèce officielle.';
 $('npc-creature-add').disabled=!officialCreatures.length||
   trainerRosterDraft.length>=NPC_TRAINER_ROSTER_LIMIT_V1;
}
function renderRewardChoices(){
 officialSelect($('npc-reward-choice'),rewardChoices,
  {empty:'Choisir un objet officiel…'});
 $('npc-reward-add').disabled=!rewardChoices.length;
 const panel=$('npc-reward-rows');panel.replaceChildren();
 for(const [index,item] of rewardItemsDraft.entries()){
  const row=document.createElement('div');row.className='npc-reference-row';
  const label=document.createElement('span');
  label.textContent=(rewardChoices.find(x=>x.id===item.itemId)?.name??
    'Objet officiel non disponible — référence conservée')+' ×'+item.quantity;
  const del=document.createElement('button');
  del.textContent='✕';del.type='button';del.setAttribute('aria-label','Retirer cette récompense');
  del.addEventListener('click',()=>{
   rewardItemsDraft=rewardItemsDraft.filter((_,i)=>index!==i);
   renderRewardChoices();markDirty();
  });
  row.append(label,del);panel.append(row);
 }
 if(!rewardItemsDraft.length)panel.textContent='Aucun objet en récompense.';
}
function renderMerchantStatus(){
 $('npc-merchant-status').textContent=merchantIdDraft?
  'Configure les objets et les tarifs de ce PNJ ici.':'Aucun article configuré : ouvre les réglages de ce PNJ.';
}
function renderWildChoices(){
 officialSelect($('npc-wild-choice'),officialCreatures,{
  empty:'Choisir une créature officielle…',selectedId:wildCreatureDraft?.creatureId??'',
  missingLabel:'Espèce précédemment liée — indisponible'
 });
 const panel=$('npc-wild-instance');
 panel.replaceChildren();
 if(wildCreatureDraft)panel.append(renderNpcCombatInstanceEditor(null,wildCreatureDraft));
}
function loadGameplayFields(record){
 closeInlineMerchantEditor();
 trainerRosterDraft=(record?.npc?.trainerRoster??[]).map(s=>({...s}));
 rewardItemsDraft=(record?.npc?.trainerReward?.items??[]).map(i=>({...i}));
 merchantIdDraft=record?.npc?.merchantId??'';
 wildCreatureDraft=record?.npc?.wildCreature?{...record.npc.wildCreature}:null;
 $('npc-reward-currency').value=String(record?.npc?.trainerReward?.currency??0);
 $('npc-wild-level').value=String(wildCreatureDraft?.level??10);
 wildBehaviorControls.set(record?.npc?.wildBehavior);
 renderCreatureChoices();renderRewardChoices();roleSections();
}
async function loadCreatureCatalog(){
 if(npcCatalogLoading)return;
 npcCatalogLoading=true;$('npc-creature-add').disabled=true;
 $('npc-creature-status').textContent='Lecture du Bestiaire officiel Combat…';
 try{
  const source=await loadCaptureShowcaseEncounterSourceV1();
  if(!Array.isArray(source.creatures)||!source.creatures.length)
   throw new Error('aucune espèce publiée');
  officialCreatures=Object.freeze(source.creatures);
  $('npc-creature-status').textContent=officialCreatures.length+
   ' créatures publiées, sans catalogue de secours.';
 }catch(error){
  officialCreatures=Object.freeze([]);
  $('npc-creature-status').textContent='Bestiaire officiel indisponible : '+error.message+
   '. Les anciennes références sont conservées.';
 }finally{
  npcCatalogLoading=false;renderCreatureChoices();
 }
}
function closeInlineMerchantEditor(){
 inlineMerchantNonce=null;inlineMerchantId=null;
 const holder=$('npc-merchant-inline'),frame=$('npc-merchant-frame');
 holder.hidden=true;
 if(frame.getAttribute('src'))frame.src='about:blank';
}
function requestNativeCatalog(kind){
 if(kind!=='reward')return;
 const tag='npc-reward-status';
 if(window.parent===window){
  $(tag).textContent='Catalogue officiel disponible uniquement via la fenêtre Monster Capture (pas de catalogue parallèle).';
  return;
 }
 const requestId=crypto.randomUUID();rewardRequestId=requestId;
 $(tag).textContent='Interrogation du catalogue officiel Monster Capture…';
 window.parent.postMessage({schema:'gensrpg.exploration.npc.reward.catalog.request.v1',requestId},window.location.origin);
}
window.addEventListener('message',event=>{
 if(event.origin!==window.location.origin)return;
 const data=event.data;
 // Only the actual same-origin nested Capture-owned editor may report a
 // committed merchant. Exploration never receives stock or price fields.
 if(event.source===$('npc-merchant-frame').contentWindow){
  if(data?.schema!=='gensrpg.capture.v2.npc.merchant.saved.v1'||
     !inlineMerchantNonce||data.nonce!==inlineMerchantNonce||
     !selected||data.npcId!==selected.id||
     data.merchantId!==inlineMerchantId||typeof data.merchantId!=='string'||
     !/^[a-z0-9][a-z0-9_:.-]{0,129}$/i.test(data.merchantId))return;
  // Link ONLY the stable reference after Capture has saved its canonical
  // merchant. Never create another store, catalog, item or exchange rule.
  void run(async()=>{
   const id=data.merchantId,npcId=selected.id;
   merchantIdDraft=id;
   if(dirty){
    markDirty();
    notify('Boutique enregistrée. Enregistre ton PNJ pour conserver sa liaison et les autres modifications.',true);
    return;
   }
   const existing=await store.get(npcId);
   if(!existing||existing.role!=='merchant')
    throw new Error('PNJ marchand introuvable : aucune liaison écrite.');
   const updated={...existing,npc:{...existing.npc,merchantId:id},
    updatedAt:new Date().toISOString()};
   await store.put(updated);
   const check=await store.get(npcId);
   if(check?.npc?.merchantId!==id)
    throw new Error('Boutique enregistrée, mais liaison PNJ non vérifiable.');
   await refresh(npcId);
   renderMerchantStatus();
   notify('Articles et tarifs enregistrés pour '+updated.name+'.');
  });
  return;
 }
 if(event.source!==window.parent)return;
 if(data?.schema==='gensrpg.capture.v2.npc.reward.catalog.response.v1'&&
    data.requestId===rewardRequestId){
  rewardRequestId=null;
  rewardChoices=Object.freeze(Array.isArray(data.items)?
   data.items.filter(item=>typeof item?.id==='string'&&
    /^[a-z0-9][a-z0-9_:.-]{0,129}$/i.test(item.id)&&
    typeof item.name==='string'&&item.name.length>0&&item.name.length<=80)
    .map(x=>({id:x.id,name:x.name})):[]);
  $('npc-reward-status').textContent=data.error?
   'Objets officiels indisponibles : '+String(data.error).slice(0,120):
   rewardChoices.length+' objets officiels disponibles.';
  renderRewardChoices();
 }
});
$('npc-role').addEventListener('change',roleSections);
$('npc-creature-reload').addEventListener('click',()=>run(loadCreatureCatalog));
$('npc-creature-add').addEventListener('click',()=>{
 const creatureId=$('npc-creature-choice').value,level=number('npc-creature-level');
 if(!officialCreatures.some(c=>c.id===creatureId)||
    trainerRosterDraft.length>=NPC_TRAINER_ROSTER_LIMIT_V1)
  return notify('Sélectionne une créature publiée ; 6 maximum.',true);
 trainerRosterDraft.push({creatureId,level});
 renderTrainerRows();markDirty();
});
// Existing merchant role + one embedded Capture-owned shop editor.
// The iframe is a VIEW of AdventureRules; this PNJ stores only merchantId.
$('npc-merchant-configure').addEventListener('click',()=>{
 if(window.parent===window)
  return notify('Ouvre cet éditeur depuis Monster InvoC pour accéder au catalogue officiel.',true);
 if(!selected||dirty)
  return notify('Enregistre d’abord la fiche de ce PNJ. Tu pourras ensuite lui attribuer des objets à vendre ici.',true);
 const url=new URL('../../assets/gensrpg/capture-v2/adventure.html',window.location.href);
 if(url.origin!==window.location.origin)
  return notify('Éditeur de boutique hors origine refusé.',true);
 const universe=new URLSearchParams(window.location.search).get('universe');
 if(universe)url.searchParams.set('universe',universe);
 inlineMerchantNonce=crypto.randomUUID();
 url.searchParams.set('editor','merchant');
 url.searchParams.set('embed','npc');
 url.searchParams.set('npcBridgeNonce',inlineMerchantNonce);
 url.searchParams.set('npcId',selected.id);
 url.searchParams.set('npcName',$('npc-name').value.trim().slice(0,80));
 inlineMerchantId=merchantIdDraft||'merchant-'+selected.id;
 url.searchParams.set('merchantId',inlineMerchantId);
 $('npc-merchant-frame').src=url.href;
 $('npc-merchant-inline').hidden=false;
 $('npc-merchant-inline-status').textContent=
  'Choisis les objets proposés et les tarifs. Enregistre directement ce PNJ.';
 $('npc-merchant-config').open=true;
});
$('npc-merchant-close').addEventListener('click',closeInlineMerchantEditor);
$('npc-wild-choice').addEventListener('change',()=>{
 const id=$('npc-wild-choice').value;
 if(!id)wildCreatureDraft=null;
 else if(wildCreatureDraft?.creatureId!==id)
  wildCreatureDraft={creatureId:id,level:number('npc-wild-level')};
 renderWildChoices();markDirty();
});
$('npc-wild-level').addEventListener('change',()=>{
 if(wildCreatureDraft)wildCreatureDraft.level=number('npc-wild-level');
 markDirty();
});
$('npc-reward-add').addEventListener('click',()=>{
 const itemId=$('npc-reward-choice').value,quantity=number('npc-reward-quantity');
 if(!rewardChoices.some(entry=>entry.id===itemId))return;
 const existing=rewardItemsDraft.find(entry=>entry.itemId===itemId);
 if(existing)existing.quantity=quantity;
 else if(rewardItemsDraft.length<24)rewardItemsDraft.push({itemId,quantity});
 else return notify('Limite de 24 récompenses objet.',true);
 renderRewardChoices();markDirty();
});
$('npc-reward-reload').addEventListener('click',()=>requestNativeCatalog('reward'));


function clearInputs(){
 chosenLibraryImage=null;
 for(const id of ['npc-image','npc-portrait','npc-idle','npc-walk',
  ...MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(d=>'npc-dir-'+d),
  ...MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(d=>'npc-zip-'+d)])$(id).value='';
 for(const d of MAP_ACTOR_COMPASS_DIRECTIONS_V1)$('npc-zip-status-'+d).textContent='';
}
function setFields(record){
 selected=record;dirty=false;clearInputs();
 $('npc-name').value=record?.name??'';
 $('npc-role').value=record?.role??'villager';
 $('npc-movement').value=record?.npc.movement.mode??'static';
 $('npc-radius').value=String(record?.npc.movement.radius??90);
 $('npc-dialogue').value=record?.npc.dialogue??'';
 $('npc-allow-flee').checked=record?.npc?.allowFlee!==false;
 $('npc-height').value=String(record?.mapVisual.targetHeight??62);
 $('npc-mode').value=record?.mapVisual.animation.mode??'image';
 $('npc-fps').value=String(record?.mapVisual.animation.framesPerSecond??16);
 $('npc-facing').value=String(record?.mapVisual.sourceFacingX??1);
 $('npc-mirror').value=record?.mapVisual.mirrorHorizontal===false?'no':'yes';
 $('npc-idle-amplitude').value=String(record?.mapVisual.motion.idleAmplitude??1);
 $('npc-shadow').value=record?.mapVisual.shadow.enabled===false?'no':'yes';
 $('npc-duplicate').disabled=!record;$('npc-export').disabled=!record;
 $('npc-edit-state').textContent=record
  ?'Définition chargée : '+record.name+' · toute modification visuelle s’appliquera aux futurs chargements de ses placements.'
  :'Nouveau PNJ : aucune définition enregistrée.';
 loadGameplayFields(record);
 syncMode();updatePortrait();
}
function updatePortrait(){
 if(portraitUrl){URL.revokeObjectURL(portraitUrl);portraitUrl=null;}
 const existing=selected?.assets.find(a=>a.id===selected.id+'.portrait')?.blob;
 const blob=$('npc-portrait').files[0]??existing;
 const img=$('npc-portrait-preview');img.hidden=!(blob instanceof Blob);
 if(blob instanceof Blob){
  portraitUrl=URL.createObjectURL(blob);img.src=portraitUrl;
 }else img.removeAttribute('src');
}
async function dimensions(blob){
 if(typeof createImageBitmap==='function'){
  const bitmap=await createImageBitmap(blob);
  try{return {width:bitmap.width,height:bitmap.height};}
  finally{bitmap.close?.();}
 }
 const url=URL.createObjectURL(blob);
 try{return await new Promise((resolve,reject)=>{
  const img=new Image();
  img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});
  img.onerror=()=>reject(new Error('Image non lisible : '+blob.name));
  img.src=url;
 });}finally{URL.revokeObjectURL(url);}
}
async function uploaded(file){
 if(!file)return null;
 if(!['image/png','image/webp'].includes(file.type)||!file.size||file.size>8*1024*1024)
  throw new RangeError('Image PNG/WebP requise, maximum 8 Mo');
 return {...await dimensions(file),blob:file,mimeType:file.type};
}
function oldAsset(ref){
 const entry=selected?.assets.find(a=>a.id===ref);
 if(!entry)throw new Error('Sprite manquant dans la définition d’origine : '+ref);
 return {blob:entry.blob,mimeType:entry.mimeType,width:entry.width,height:entry.height};
}
async function listFrames(field,oldRefs=[]){
 const files=[...$(field).files];
 if(files.length>32)throw new RangeError('32 sprites maximum par animation');
 return files.length?Promise.all(files.map(uploaded)):
  selected?oldRefs.map(oldAsset):[];
}
async function draftFromForm({newId=false}={}){
 const id=selected&&!newId?selected.id:mintUserNpcIdV1();
 const mode=$('npc-mode').value,prev=selected?.mapVisual;
 const dirs=mode==='directions'?Object.fromEntries(await Promise.all(
  MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(async d=>{
   const files=[...$('npc-dir-'+d).files];
   const archive=$('npc-zip-'+d).files[0];
   if(archive)return [d,await Promise.all((await readActorAnimationZipV1(archive)).map(uploaded))];
   if(files.length&&files.length!==6)
    throw new RangeError(d+' : exactement 6 images par direction');
   return [d,files.length?await Promise.all(files.map(uploaded)):
    prev?.animation.mode==='directions'?prev.animation.directions[d].map(oldAsset):[]];
  }))):null;
 const base=mode==='directions'?dirs.S[0]:
  await uploaded($('npc-image').files[0])||
  await uploaded(chosenLibraryImage)||
  (selected?oldAsset(prev.assetId):null);
 if(!base)throw new Error('Importe une image principale PNG ou WebP');
 const portrait=await uploaded($('npc-portrait').files[0])||
  (selected?.assets.some(a=>a.id===selected.id+'.portrait')?
   oldAsset(selected.id+'.portrait'):null);
 const role=$('npc-role').value;
 const npc={
  ...(selected?.npc??{}),
  dialogue:$('npc-dialogue').value,
  movement:{mode:$('npc-movement').value,radius:number('npc-radius')},
  ...(role.startsWith('trainer-')?{
    allowFlee:$('npc-allow-flee').checked,
    trainerRoster:trainerRosterDraft.map(slot=>({...slot})),
    trainerReward:{currency:number('npc-reward-currency'),
      items:rewardItemsDraft.map(item=>({...item}))}
  }:{}),
  ...(role==='merchant'?{merchantId:merchantIdDraft}:{}),
  ...(role==='wild'?{wildBehavior:wildBehaviorControls.read()}:{}),
  ...(role==='wild'&&wildCreatureDraft?{wildCreature:{...wildCreatureDraft}}:{})
 };
 const shadow={...(prev?.shadow??{}),enabled:$('npc-shadow').value==='yes'};
 const motion={...(prev?.motion??{}),idleAmplitude:number('npc-idle-amplitude')};
 return createUserNpcDefinitionV1({
  id,name:$('npc-name').value,role:$('npc-role').value,base,portrait,mode,
  idle:mode==='frames'?await listFrames('npc-idle',prev?.animation.mode==='frames'?prev.animation.idle:[]):[],
  walk:mode==='frames'?await listFrames('npc-walk',prev?.animation.mode==='frames'?prev.animation.walk:[]):[],
  directions:dirs,framesPerSecond:mode==='image'?16:number('npc-fps'),
  targetHeight:number('npc-height'),sourceFacingX:Number($('npc-facing').value),
  mirrorHorizontal:$('npc-mirror').value==='yes',shadow,motion,npc,
  createdAt:!newId&&selected?selected.createdAt:new Date().toISOString(),
  updatedAt:new Date().toISOString()
 });
}
function destroyPreview(){
 ++epoch;
 if(!preview)return;
 cancelAnimationFrame(preview.raf);
 preview.preparer.dispose();preview.loader.dispose();preview.resolver.dispose();
 preview=null;
}
async function showPreview(record){
 destroyPreview();
 const key=epoch;
 const resolver=createUserNpcAssetResolverV1(record);
 const loader=createImageAssetLoader({resolveAsset:resolver.resolve});
 let preparer=null;
 try{
  const ids=record.assets.filter(a=>a.id!==record.id+'.portrait').map(a=>a.id);
  const ready=await loader.load(ids);
  if(disposed||key!==epoch){loader.dispose();resolver.dispose();return;}
  if(ready.ready!==ids.length)throw new Error('Sprites manquants : '+ready.ready+'/'+ids.length);
  preparer=createMapActorVisualPreparer({imageLoader:loader});
  const result=preparer.prepare(ids,{preserveCanvas:record.mapVisual.animation.mode!=='image'});
  if(result.ready!==ids.length)throw new Error('Préparation des sprites impossible');
  const renderer=createMapActorRenderer({preparedVisuals:preparer});
  const active={resolver,loader,preparer,raf:0};
  preview=active;
  function draw(timestamp){
   if(disposed||preview!==active)return;
   ctx.fillStyle='#233e4a';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.fillStyle='#34584b';ctx.fillRect(0,canvas.height-37,canvas.width,37);
   const angle=angles[previewDirection];
   renderer.draw(ctx,{camera:{x:0,y:0},timeSeconds:timestamp/1000,
    actors:[{x:canvas.width/2,y:canvas.height-37,facingX:1,
     directionX:Math.cos(angle),directionY:Math.sin(angle),
     moving:previewMoving,visualScale:1,mapVisual:record.mapVisual}]});
   active.raf=requestAnimationFrame(draw);
  }
  active.raf=requestAnimationFrame(draw);
  notify('Aperçu réel de '+record.name+' · '+(previewMoving?'marche':'repos')+
   ' · '+previewDirection+' · '+ids.length+' sprites');
 }catch(e){preparer?.dispose();loader.dispose();resolver.dispose();throw e;}
}
async function refresh(chosenId=null){
 const list=await store.list();
 $('npc-count').textContent=list.length+' PNJ enregistrés';
 const select=$('npc-saved');
 select.replaceChildren(new Option('＋ Nouveau PNJ',''),
  ...list.map(n=>new Option(n.name+' · '+n.role,n.id)));
 select.value=list.some(n=>n.id===chosenId)?chosenId:'';
 const selectedRecord=list.find(n=>n.id===chosenId)??null;
 setFields(selectedRecord);
 for(const url of galleryUrls)URL.revokeObjectURL(url);
 galleryUrls=[];
 const grid=$('npc-gallery');grid.replaceChildren();
 for(const item of list){
  const card=document.createElement('div');card.className='npc-card';
  const thumb=document.createElement('img');
  const img=item.assets.find(a=>a.id===item.mapVisual.assetId);
  const url=URL.createObjectURL(img.blob);galleryUrls.push(url);
  thumb.src=url;thumb.alt='Aperçu de '+item.name;thumb.loading='lazy';
  const title=document.createElement('strong');title.textContent=item.name;
  const subtitle=document.createElement('small');subtitle.textContent=item.role;
  const button=document.createElement('button');button.type='button';
  button.textContent='Modifier';
  button.addEventListener('click',()=>run(()=>refresh(item.id)));
  card.append(thumb,title,subtitle,button);grid.append(card);
 }
 if(selectedRecord)await showPreview(selectedRecord);
 else {destroyPreview();notify('Crée un PNJ avec une image PNG/WebP, ou choisis une fiche enregistrée.');}
}
async function save({duplicate=false}={}){
 if(busy)return;
 busy=true;$('npc-save').disabled=true;
 try{
  const record=await draftFromForm({newId:duplicate});
  await store.put(record);
  const reread=await store.get(record.id);
  if(!reread||reread.assets.length!==record.assets.length||
     reread.mapVisual.targetHeight!==record.mapVisual.targetHeight)
   throw new Error('Enregistrement non vérifiable dans la bibliothèque PNJ');
  await refresh(record.id);
  notify((duplicate?'Copie créée':'PNJ enregistré')+' et relu : '+record.name+
   ' · '+record.assets.length+' images · ID stable '+record.id);
 }finally{busy=false;$('npc-save').disabled=false;}
}
async function downloadJson(){
 if(!selected)return;
 const serialized=await exportUserNpcBundleV1(selected);
 const blob=new Blob([serialized],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 try{
  const a=document.createElement('a');a.href=url;
  a.download='gensrpg-pnj-'+selected.name.toLowerCase().replace(/[^a-z0-9-]+/g,'-')+'.json';
  document.body.append(a);a.click();a.remove();
 }finally{URL.revokeObjectURL(url);}
}
async function run(fn){
 try{await fn();}
 catch(error){notify(error.message,true);console.error('Éditeur PNJ',error);}
}
// One visual picker for the existing PNJ authoring form, never another editor.
mountNpcVisualLibraryV1({
 root:$('npc-visual-library'),npcStore:store,
 onChoose:async (file,source)=>{
  chosenLibraryImage=file;
  $('npc-image').value='';
  $('npc-mode').value='image';
  if(!$('npc-name').value.trim())$('npc-name').value=source.name;
  syncMode();markDirty();
  await showPreview(await draftFromForm());
 }
});
$('npc-image').addEventListener('change',()=>{
 if($('npc-image').files.length)chosenLibraryImage=null;
});
$('npc-saved').addEventListener('change',()=>run(()=>refresh($('npc-saved').value)));
$('npc-new').addEventListener('click',()=>run(()=>refresh()));
$('npc-save').addEventListener('click',()=>run(()=>save()));
$('npc-duplicate').addEventListener('click',()=>run(()=>save({duplicate:true})));
$('npc-export').addEventListener('click',()=>run(downloadJson));
$('npc-preview').addEventListener('click',()=>run(async()=>showPreview(await draftFromForm())));
$('npc-preview-idle').addEventListener('click',()=>{previewMoving=false;notify('Prévisualisation au repos');});
$('npc-preview-walk').addEventListener('click',()=>{previewMoving=true;notify('Prévisualisation en marche');});
$('npc-preview-direction').addEventListener('change',()=>{previewDirection=$('npc-preview-direction').value;});
$('npc-mode').addEventListener('change',syncMode);
$('npc-portrait').addEventListener('change',updatePortrait);
$('npc-import').addEventListener('change',()=>run(async()=>{
 const file=$('npc-import').files[0];if(!file)return;
 if(file.size>150*1024*1024)throw new RangeError('Archive PNJ trop volumineuse');
 const record=importUserNpcBundleV1(await file.text());
 await store.put(record);await refresh(record.id);
 notify('PNJ importé comme nouvelle définition : '+record.name);
 $('npc-import').value='';
}));
for(const element of document.querySelectorAll('input,select,textarea')){
 if(['npc-saved','npc-import','npc-preview-direction'].includes(element.id))continue;
 element.addEventListener('input',markDirty);
 element.addEventListener('change',markDirty);
}
window.addEventListener('pagehide',()=>{
 disposed=true;destroyPreview();
 if(portraitUrl)URL.revokeObjectURL(portraitUrl);
 galleryUrls.forEach(url=>URL.revokeObjectURL(url));galleryUrls=[];
},{once:true});
run(()=>refresh(new URLSearchParams(window.location.search).get('edit')));
void loadCreatureCatalog();
void loadNpcCombatCatalog();
requestNativeCatalog('reward');
