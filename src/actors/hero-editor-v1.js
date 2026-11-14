// Native Exploration Actor Definition Editor. No gameplay or camera state lives
// here: images are stored in the authoritative Hero DB and previewed by the
// same ImageAssetLoader + MapActorVisualPreparer + MapActorRenderer as the map.
import {createUserHeroDefinitionV1,createUserHeroAssetResolverV1} from './user-hero-definition-v1.js';
import {createUserHeroStoreV1} from '../storage/user-hero-store-v1.js';
import {createImageAssetLoader} from '../assets/image-asset-loader.js';
import {createMapActorVisualPreparer} from '../assets/map-actor-visual-preparer.js';
import {createMapActorRenderer} from '../render/map-actor-renderer.js';
import {MAP_ACTOR_COMPASS_DIRECTIONS_V1,normalizeMapActorVisual,DEFAULT_HERO_VISUAL_SETTINGS_V1} from './map-actor-visual-model.js';
import {loadOfficialHeroCatalogV1,installOfficialHeroPresetV1} from './official-hero-presets-v1.js';

const $=id=>document.getElementById(id);
const status=$('hero-status');
const canvas=$('hero-canvas'),ctx=canvas.getContext('2d');
const store=createUserHeroStoreV1();
let selected=null,preview=null,renderEpoch=0,previewMoving=false,disposed=false;
let liveVisual=null,dirty=false,saving=false;
for(const dir of MAP_ACTOR_COMPASS_DIRECTIONS_V1){
 const label=document.createElement('label');
 label.textContent=dir+' · six images ordonnées (0–5)';
 const input=document.createElement('input');
 input.id='hero-direction-'+dir;input.type='file';input.multiple=true;
 input.accept='image/png,image/webp';input.setAttribute('aria-label','Sprites '+dir);
 label.append(input);$('hero-direction-files').append(label);
}
let previewDirection='S';

function notify(message,error=false){
 status.textContent=message;status.dataset.error=String(error);
}
function number(id){
 const raw=$(id).value.trim();
 if(!raw||!Number.isFinite(Number(raw)))throw new RangeError('Réglage invalide : '+id);
 return Number(raw);
}
function updateMode(){
 const mode=$('hero-mode').value,sprites=mode==='frames';
 for(const id of ['hero-idle-label','hero-walk-label'])$(id).hidden=!sprites;
 $('hero-directions-inputs').hidden=mode!=='directions';
 $('hero-fps-label').hidden=mode==='image';
 $('hero-image-label').hidden=mode==='directions';
 $('hero-idle-amplitude').disabled=false;
 // All modes share the single native oscillation control.
  $('hero-walk-amplitude').disabled=false;
}
function oldAsset(id){
 const entry=selected?.assets.find(value=>value.id===id);
 if(!entry)throw new Error('Image du héros indisponible : '+id);
 return {blob:entry.blob,width:entry.width,height:entry.height,mimeType:entry.mimeType};
}
async function decodedDimensions(file){
 if(typeof createImageBitmap==='function'){
  const bitmap=await createImageBitmap(file);
  try{return {width:bitmap.width,height:bitmap.height};}
  finally{bitmap.close?.();}
 }
 const url=URL.createObjectURL(file);
 try{
  return await new Promise((resolve,reject)=>{
   const image=new Image();
   image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});
   image.onerror=()=>reject(new Error('Image illisible : '+file.name));
   image.src=url;
  });
 }finally{URL.revokeObjectURL(url);}
}
async function uploaded(file){
 if(!file)return null;
 if(!['image/png','image/webp'].includes(file.type))
  throw new RangeError('Seuls les PNG et WebP sont admis : '+file.name);
 if(file.size<1||file.size>8*1024*1024)
  throw new RangeError('Fichier vide ou supérieur à 8 Mo : '+file.name);
 const size=await decodedDimensions(file);
 return {blob:file,mimeType:file.type,...size};
}
async function directionFrames(dir,previous){
 const files=[...$('hero-direction-'+dir).files];
 if(files.length&&files.length!==6)
  throw new RangeError('Direction '+dir+' : importe exactement six sprites, ordonnés de 0 à 5.');
 if(files.length)return Promise.all(files.map(uploaded));
 if(previous?.mapVisual.animation.mode==='directions')
  return previous.mapVisual.animation.directions[dir].map(oldAsset);
 throw new Error('Direction '+dir+' : ajoute six sprites avant d’enregistrer.');
}
function previewFromForm(record){
 if(!record)return null;
 try{
  return normalizeMapActorVisual({...record.mapVisual,
   targetHeight:number('hero-height'),
   motion:{...record.mapVisual.motion,
    idleAmplitude:number('hero-idle-amplitude'),
    walkAmplitude:number('hero-walk-amplitude')}
  });
 }catch{return record.mapVisual;}
}
function markDirty(){
 dirty=true;
 liveVisual=previewFromForm(selected);
 $('hero-edit-state').textContent='Modifications en aperçu uniquement · clique sur « Enregistrer le héros » pour les conserver.';
}
async function frames(field,oldRefs){
 const files=[...$(field).files];
 if(files.length>32)throw new RangeError('Maximum 32 images par séquence');
 if(files.length)return Promise.all(files.map(uploaded));
 return selected?oldRefs.map(oldAsset):[];
}
function destroyPreview(){
 ++renderEpoch;
 const previous=preview;
 preview=null;
 if(!previous)return;
 cancelAnimationFrame(previous.raf);
 previous.preparer.dispose();
 previous.loader.dispose();
 previous.resolver.dispose();
}
async function startPreview(record){
 destroyPreview();
 const epoch=renderEpoch;
 const resolver=createUserHeroAssetResolverV1(record);
 const loader=createImageAssetLoader({resolveAsset:resolver.resolve});
 let preparer=null;
 try{
  const ids=resolver.list().map(asset=>asset.id);
  const loaded=await loader.load(ids);
  if(disposed||renderEpoch!==epoch){
   loader.dispose();resolver.dispose();return;
  }
  if(loaded.ready!==ids.length)throw new Error('Visuels incomplets : '+loaded.ready+'/'+ids.length);
  preparer=createMapActorVisualPreparer({imageLoader:loader});
  const spriteMode=record.mapVisual.animation.mode!=='image';
  const prepared=preparer.prepare(ids,{preserveCanvas:spriteMode});
  if(prepared.ready!==ids.length)
   throw new Error('Impossible de préparer tous les visuels du héros');
  const renderer=createMapActorRenderer({preparedVisuals:preparer});
  const active={resolver,loader,preparer,raf:0};
  preview=active;
  function frame(time){
   if(disposed||preview!==active)return;
   ctx.clearRect(0,0,canvas.width,canvas.height);
   ctx.fillStyle='#274251';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.fillStyle='#315947';ctx.fillRect(0,canvas.height-35,canvas.width,35);
   const angle={E:0,SE:Math.PI/4,S:Math.PI/2,SW:3*Math.PI/4,
     W:Math.PI,NW:-3*Math.PI/4,N:-Math.PI/2,NE:-Math.PI/4}[previewDirection];
   renderer.draw(ctx,{camera:{x:0,y:0},timeSeconds:time/1000,
    actors:[{x:canvas.width/2,y:canvas.height-35,facingX:1,
     directionX:Math.cos(angle),directionY:Math.sin(angle),
     moving:previewMoving,visualScale:1,mapVisual:liveVisual??record.mapVisual}]});
   active.raf=requestAnimationFrame(frame);
  }
  active.raf=requestAnimationFrame(frame);
  notify(record.name+' · '+(record.mapVisual.animation.mode==='directions'
    ?'8 directions × 6 sprites'
    :spriteMode?'Animation : '+record.mapVisual.animation.walk.length+' sprites de marche'
    :'Image fixe : mouvement simulé'));
 }catch(error){
  preparer?.dispose();
  loader.dispose();resolver.dispose();
  throw error;
 }
}
function displayFields(record){
 selected=record;
 dirty=false;
 $('hero-edit-state').textContent=record
  ?'Héros chargé : '+record.name+' · les réglages affichés appartiennent à ce héros.'
  :'Nouveau héros · aucune modification enregistrée.';
 $('hero-name').value=record?.name??'';
 $('hero-mode').value=record?.mapVisual.animation.mode??'image';
 $('hero-height').value=record?.mapVisual.targetHeight??DEFAULT_HERO_VISUAL_SETTINGS_V1.targetHeight;
 $('hero-source-facing').value=String(record?.mapVisual.sourceFacingX??1);
 $('hero-fps').value=record?.mapVisual.animation.framesPerSecond??DEFAULT_HERO_VISUAL_SETTINGS_V1.framesPerSecond;
 $('hero-idle-amplitude').value=record?.mapVisual.motion.idleAmplitude??DEFAULT_HERO_VISUAL_SETTINGS_V1.idleAmplitude;
 $('hero-walk-amplitude').value=record?.mapVisual.motion.walkAmplitude??DEFAULT_HERO_VISUAL_SETTINGS_V1.walkAmplitude;
 for(const id of ['hero-image','hero-idle','hero-walk'])$(id).value='';
 for(const dir of MAP_ACTOR_COMPASS_DIRECTIONS_V1)$('hero-direction-'+dir).value='';
 $('hero-delete').disabled=!record;
 updateMode();
 liveVisual=record?.mapVisual??null;
}
async function refreshCatalog(chosenId=null){
 const records=await store.list();
 const picker=$('hero-saved'),counts=new Map();
 for(const record of records)counts.set(record.name,(counts.get(record.name)??0)+1);
 picker.replaceChildren(new Option('＋ Nouveau héros…',''),
  ...records.map(record=>{
   const date=new Date(record.createdAt).toLocaleDateString('fr-FR');
   const duplicate=counts.get(record.name)>1?' · même nom':'';
   return new Option(record.name+' · '+date+duplicate,record.id);
  }));
 const chosen=records.find(record=>record.id===chosenId)??null;
 picker.value=chosen?.id??'';
 const repeated=[...counts.values()].filter(count=>count>1).length;
 $('hero-library-count').textContent=records.length+' héros enregistrés'+
  (repeated?' · '+repeated+' nom(s) répété(s) à vérifier':'')+
  ' · chaque ligne correspond à un enregistrement distinct.';
 displayFields(chosen);
 if(chosen)await startPreview(chosen);
 else{destroyPreview();notify(records.length
  ?'Choisis un héros enregistré dans la liste pour voir ses réglages, ou crée un nouveau héros.'
  :'Importe une image PNG/WebP ou choisis un modèle officiel pour créer ton héros.');}
}
async function saveHero(){
 if(saving)return;
 saving=true;$('hero-save').disabled=true;
 try{
  const previous=selected;
  const id=previous?.id??'hero.user.'+crypto.randomUUID();
  const mode=$('hero-mode').value;
  const directions=mode==='directions'
   ?Object.fromEntries(await Promise.all(MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(async dir=>
     [dir,await directionFrames(dir,previous)])))
   :null;
  // In the directional mode the S/0 frame is the single base reference.
  // Never require a separate user image or silently discard an uploaded frame.
  const base=mode==='directions'?directions.S[0]:
   await uploaded($('hero-image').files[0])||
   (previous?oldAsset(previous.mapVisual.assetId):null);
  if(!base)throw new Error('Choisis une image principale PNG ou WebP.');
  const idle=mode==='frames'
   ?await frames('hero-idle',previous?.mapVisual.animation.idle??[]):[];
  const walk=mode==='frames'
   ?await frames('hero-walk',previous?.mapVisual.animation.walk??[]):[];
  const record=createUserHeroDefinitionV1({
   id,name:$('hero-name').value,base,mode,idle,walk,directions,
   framesPerSecond:mode==='image'?DEFAULT_HERO_VISUAL_SETTINGS_V1.framesPerSecond:number('hero-fps'),
   targetHeight:number('hero-height'),
   sourceFacingX:Number($('hero-source-facing').value),
   motion:{idleAmplitude:number('hero-idle-amplitude'),
    idleFrequency:previous?.mapVisual.motion.idleFrequency??.8,
    walkAmplitude:number('hero-walk-amplitude'),
    walkFrequency:previous?.mapVisual.motion.walkFrequency??3.8},
   now:previous?.createdAt??new Date().toISOString()
  });
  await store.put(record);
  const persisted=await store.get(record.id);
  if(!persisted||persisted.mapVisual.targetHeight!==record.mapVisual.targetHeight||
     persisted.assets.length!==record.assets.length)
   throw new Error('Vérification de sauvegarde impossible : recharge le héros avant de quitter.');
  await refreshCatalog(record.id);
  notify('Héros enregistré et relu : '+record.name+'. '+record.assets.length+
    ' image(s) conservées, taille '+record.mapVisual.targetHeight+'.');
 }finally{
  saving=false;$('hero-save').disabled=false;
 }
}

async function deleteHero(){
 if(!selected)return;
 if(!confirm('Supprimer UNIQUEMENT « '+selected.name+' » (créé le '+
  new Date(selected.createdAt).toLocaleDateString('fr-FR')+') ?\\n'+
  'Ses sprites seront retirés de cette bibliothèque. Si une partie utilise ce héros, son apparence pourra devenir indisponible. Les autres héros et les parties ne seront pas supprimés.'))return;
 await store.delete(selected.id);
 await refreshCatalog();
 notify('Définition de héros supprimée de la bibliothèque locale.');
}
async function run(callback){
 try{
  status.dataset.error='false';
  await callback();
 }catch(error){
  notify(error.message,true);
  console.error('Éditeur Héros Exploration : ',error);
 }
}
$('hero-mode').addEventListener('change',()=>{updateMode();markDirty();});
for(const id of ['hero-name','hero-height','hero-fps','hero-source-facing',
  'hero-idle-amplitude','hero-walk-amplitude','hero-image','hero-idle','hero-walk',
  ...MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>'hero-direction-'+dir)]){
 $(id).addEventListener('input',markDirty);
 $(id).addEventListener('change',markDirty);
}
// Opt-in author action only: never rewrite an existing UserHeroDefinition on open.
$('hero-apply-defaults').addEventListener('click',()=>{
 $('hero-height').value=String(DEFAULT_HERO_VISUAL_SETTINGS_V1.targetHeight);
 $('hero-fps').value=String(DEFAULT_HERO_VISUAL_SETTINGS_V1.framesPerSecond);
 $('hero-idle-amplitude').value=String(DEFAULT_HERO_VISUAL_SETTINGS_V1.idleAmplitude);
 $('hero-walk-amplitude').value=String(DEFAULT_HERO_VISUAL_SETTINGS_V1.walkAmplitude);
 markDirty();
 notify('Réglages 35 / 16 images/s / oscillation 1 en aperçu. Clique sur Enregistrer pour les garder.');
});
$('hero-try-25').addEventListener('click',()=>{
 $('hero-height').value='25';markDirty();
 notify('Taille 25 en aperçu · non enregistrée.');
});
$('hero-saved').addEventListener('change',()=>{
 run(()=>refreshCatalog($('hero-saved').value));
});
$('hero-save').addEventListener('click',()=>run(saveHero));
$('hero-delete').addEventListener('click',()=>run(deleteHero));
$('hero-preview-idle').addEventListener('click',()=>{
 previewMoving=false;
 notify('Prévisualisation : repos');
});
$('hero-preview-walk').addEventListener('click',()=>{
 previewMoving=true;
 notify('Prévisualisation : marche');
});
$('hero-preview-direction').addEventListener('change',()=>{
 previewDirection=$('hero-preview-direction').value;
 notify('Direction affichée : '+previewDirection);
});
async function installPresetGallery(){
 const grid=$('hero-official-grid'),message=$('hero-official-status');
 try{
  const catalog=await loadOfficialHeroCatalogV1();
  for(const hero of catalog.heroes){
   const card=document.createElement('div');card.className='hero-preset';
   const image=document.createElement('img');
   image.loading='lazy';image.alt='Modèle '+hero.name;
   image.src=new URL(hero.thumbnail,document.baseURI).href;
   const label=document.createElement('strong');label.textContent=hero.name;
   const button=document.createElement('button');button.type='button';
   button.textContent='Utiliser ce modèle';
   button.addEventListener('click',()=>run(async()=>{
     button.disabled=true;message.textContent='Installation de '+hero.name+'…';
     try{
       const record=await installOfficialHeroPresetV1({hero,store});
       await refreshCatalog(record.id);
       message.textContent=record.name+' est disponible dans la sélection de héros.';
     }finally{button.disabled=false;}
   }));
   card.append(image,label,button);grid.append(card);
  }
  message.textContent=catalog.heroes.length+' modèles officiels disponibles · bibliothèque unique';
 }catch(error){
  message.textContent='Modèles indisponibles : '+error.message;
  console.error('Catalogue de héros officiel',error);
 }
}
void installPresetGallery();
window.addEventListener('pagehide',()=>{
 disposed=true;
 destroyPreview();
});
run(async()=>{
 const records=await store.list();
 // The editor used to start on "Nouveau" with an empty form while several
 // playable heroes were already saved. Show a real record on entry.
 await refreshCatalog(records.at(-1)?.id??null);
});
