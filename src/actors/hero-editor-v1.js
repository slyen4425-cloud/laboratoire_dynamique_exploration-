// Native Exploration Actor Definition Editor. No gameplay or camera state lives
// here: images are stored in the authoritative Hero DB and previewed by the
// same ImageAssetLoader + MapActorVisualPreparer + MapActorRenderer as the map.
import {createUserHeroDefinitionV1,createUserHeroAssetResolverV1} from './user-hero-definition-v1.js';
import {createUserHeroStoreV1} from '../storage/user-hero-store-v1.js';
import {createImageAssetLoader} from '../assets/image-asset-loader.js';
import {createMapActorVisualPreparer} from '../assets/map-actor-visual-preparer.js';
import {createMapActorRenderer} from '../render/map-actor-renderer.js';

const $=id=>document.getElementById(id);
const status=$('hero-status');
const canvas=$('hero-canvas'),ctx=canvas.getContext('2d');
const store=createUserHeroStoreV1();
let selected=null,preview=null,renderEpoch=0,previewMoving=false,disposed=false;

function notify(message,error=false){
 status.textContent=message;status.dataset.error=String(error);
}
function number(id){
 const raw=$(id).value.trim();
 if(!raw||!Number.isFinite(Number(raw)))throw new RangeError('Réglage invalide : '+id);
 return Number(raw);
}
function updateMode(){
 const sprites=$('hero-mode').value==='frames';
 for(const id of ['hero-idle-label','hero-walk-label','hero-fps-label'])$(id).hidden=!sprites;
 $('hero-idle-amplitude').disabled=sprites;
 $('hero-walk-amplitude').disabled=sprites;
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
  const spriteMode=record.mapVisual.animation.mode==='frames';
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
   renderer.draw(ctx,{camera:{x:0,y:0},timeSeconds:time/1000,
    actors:[{x:canvas.width/2,y:canvas.height-35,
     facingX:1,moving:previewMoving,visualScale:2,mapVisual:record.mapVisual}]});
   active.raf=requestAnimationFrame(frame);
  }
  active.raf=requestAnimationFrame(frame);
  notify(record.name+' · '+(spriteMode?
   'Animation : '+record.mapVisual.animation.walk.length+' sprites de marche':
   'Image fixe : mouvement simulé'));
 }catch(error){
  preparer?.dispose();
  loader.dispose();resolver.dispose();
  throw error;
 }
}
function displayFields(record){
 selected=record;
 $('hero-name').value=record?.name??'';
 $('hero-mode').value=record?.mapVisual.animation.mode??'image';
 $('hero-height').value=record?.mapVisual.targetHeight??37;
 $('hero-source-facing').value=String(record?.mapVisual.sourceFacingX??1);
 $('hero-fps').value=record?.mapVisual.animation.framesPerSecond??8;
 $('hero-idle-amplitude').value=record?.mapVisual.motion.idleAmplitude??.55;
 $('hero-walk-amplitude').value=record?.mapVisual.motion.walkAmplitude??2;
 for(const id of ['hero-image','hero-idle','hero-walk'])$(id).value='';
 $('hero-delete').disabled=!record;
 updateMode();
}
async function refreshCatalog(chosenId=null){
 const records=await store.list();
 const picker=$('hero-saved');
 picker.replaceChildren(new Option('Nouveau héros…',''),
  ...records.map(record=>new Option(record.name,record.id)));
 const chosen=records.find(record=>record.id===chosenId)??null;
 picker.value=chosen?.id??'';
 displayFields(chosen);
 if(chosen)await startPreview(chosen);
 else{destroyPreview();notify('Importe une image PNG ou WebP pour créer ton héros.');}
}
async function saveHero(){
 const previous=selected;
 const id=previous?.id??'hero.user.'+crypto.randomUUID();
 const mode=$('hero-mode').value;
 const base=await uploaded($('hero-image').files[0])||
  (previous?oldAsset(previous.mapVisual.assetId):null);
 if(!base)throw new Error('Choisis une image principale PNG ou WebP.');
 const idle=mode==='frames'
  ?await frames('hero-idle',previous?.mapVisual.animation.idle??[]):[];
 const walk=mode==='frames'
  ?await frames('hero-walk',previous?.mapVisual.animation.walk??[]):[];
 const record=createUserHeroDefinitionV1({
  id,name:$('hero-name').value,base,mode,idle,walk,
  framesPerSecond:mode==='frames'?number('hero-fps'):8,
  targetHeight:number('hero-height'),
  sourceFacingX:Number($('hero-source-facing').value),
  motion:{idleAmplitude:number('hero-idle-amplitude'),
   idleFrequency:previous?.mapVisual.motion.idleFrequency??.8,
   walkAmplitude:number('hero-walk-amplitude'),
   walkFrequency:previous?.mapVisual.motion.walkFrequency??3.8},
  now:previous?.createdAt??new Date().toISOString()
 });
 await store.put(record);
 await refreshCatalog(record.id);
 notify('Héros enregistré durablement : '+record.name+'. Son visuel est prêt pour la sélection en jeu.');
}
async function deleteHero(){
 if(!selected)return;
 if(!confirm('Supprimer définitivement le héros « '+selected.name+' » et toutes ses images ?'))return;
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
$('hero-mode').addEventListener('change',updateMode);
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
window.addEventListener('pagehide',()=>{
 disposed=true;
 destroyPreview();
});
run(()=>refreshCatalog());
